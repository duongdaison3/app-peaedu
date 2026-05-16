'use server'

import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser, requireRoles } from '../auth/actions'
import type { QuestionSkill } from '@prisma/client'

/**
 * Get student performance summary
 */
export async function getStudentPerformance(studentId: string) {
  const user = await requireAuthenticatedUser()

  // Only allow student to view own performance or teacher/admin to view students
  if (user.id !== studentId && user.role === 'student') {
    throw new Error('Unauthorized')
  }

  const attempts = await prisma.testAttempt.findMany({
    where: { studentId },
    include: {
      test: { select: { title: true } },
      answers: { select: { score: true } }
    }
  })

  const totalAttempts = attempts.length
  const completedAttempts = attempts.filter(a => a.status === 'graded' || a.status === 'submitted').length
  const averageScore = attempts.length > 0 
    ? attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / completedAttempts 
    : 0

  return {
    totalAttempts,
    completedAttempts,
    averageScore,
    attempts: attempts.map(a => ({
      id: a.id,
      testTitle: a.test.title,
      score: a.totalScore,
      status: a.status,
      submittedAt: a.submittedAt
    }))
  }
}

/**
 * Get skill scores for student
 */
export async function getStudentSkillScores(studentId: string) {
  const user = await requireAuthenticatedUser()

  if (user.id !== studentId && user.role === 'student') {
    throw new Error('Unauthorized')
  }

  const skillScores = await prisma.studentSkillScore.findMany({
    where: { studentId }
  })

  return skillScores
}

/**
 * Update skill scores after test
 */
export async function updateSkillScores(attemptId: string) {
  await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: { include: { question: true } }
    }
  })

  if (!attempt || !attempt.studentId) return

  const skillStats: Record<string, { total: number; correct: number }> = {}

  for (const answer of attempt.answers) {
    const skill = answer.question.skill || 'general'
    if (!skillStats[skill]) {
      skillStats[skill] = { total: 0, correct: 0 }
    }
    skillStats[skill].total++
    if (answer.score && answer.score > 0) {
      skillStats[skill].correct++
    }
  }

  // Update or create skill scores
  for (const [skill, stats] of Object.entries(skillStats)) {
    const percentage = (stats.correct / stats.total) * 100
    await prisma.studentSkillScore.upsert({
      where: {
        studentId_skill: {
          studentId: attempt.studentId,
          skill: skill as any
        }
      },
      update: { averageScore: percentage },
      create: {
        studentId: attempt.studentId,
        skill: skill as any,
        averageScore: percentage
      }
    })
  }
}

/**
 * Get class performance analytics
 */
export async function getClassAnalytics(classId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const classItem = await prisma.class.findUnique({
    where: { id: classId }
  })

  if (classItem?.teacherId !== user.id && user.role !== 'super_admin' && user.role !== 'academic_manager') {
    throw new Error('Unauthorized')
  }

  const students = await prisma.classStudent.findMany({
    where: { classId },
    include: {
      student: {
        include: {
          skillScores: true,
          testAttempts: {
            select: { totalScore: true, submittedAt: true }
          }
        }
      }
    }
  })

  return {
    totalStudents: students.length,
    students: students.map(s => ({
      id: s.student.id,
      name: s.student.fullName,
      email: s.student.email,
      averageScore: s.student.testAttempts.length > 0
        ? s.student.testAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / s.student.testAttempts.length
        : 0,
      attempts: s.student.testAttempts.length,
      skillScores: s.student.skillScores
    }))
  }
}

/**
 * Update leaderboard for a class
 */
export async function updateClassLeaderboard(classId: string) {
  await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const students = await prisma.classStudent.findMany({
    where: { classId },
    include: {
      student: {
        include: {
          testAttempts: { select: { totalScore: true } }
        }
      }
    }
  })

  const rankings = students
    .map(s => ({
      studentId: s.student.id,
      score: s.student.testAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0)
    }))
    .sort((a, b) => b.score - a.score)

  // Clear old snapshots
  await prisma.leaderboardSnapshot.deleteMany({ where: { classId } })

  // Create new snapshots
  for (let i = 0; i < rankings.length; i++) {
    await prisma.leaderboardSnapshot.create({
      data: {
        classId,
        studentId: rankings[i].studentId,
        score: rankings[i].score,
        rank: i + 1
      }
    })
  }

  return rankings
}

/**
 * Get leaderboard for class
 */
export async function getClassLeaderboard(classId: string) {
  await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const leaderboard = await prisma.leaderboardSnapshot.findMany({
    where: { classId },
    include: {
      student: { select: { fullName: true, email: true } }
    },
    orderBy: { rank: 'asc' }
  })

  return leaderboard
}

function recommendLevel(percentage: number) {
  if (percentage >= 85) return 'C1 - Advanced'
  if (percentage >= 70) return 'B2 - Upper Intermediate'
  if (percentage >= 55) return 'B1 - Intermediate'
  if (percentage >= 40) return 'A2 - Elementary'
  return 'A1 - Beginner'
}

export async function getAnalyticsDashboardData() {
  const user = await requireAuthenticatedUser()

  const whereForAttempts =
    user.role === 'student'
      ? { studentId: user.id }
      : user.role === 'super_admin' || user.role === 'academic_manager'
        ? {}
        : { test: { createdBy: user.id } }

  const attempts = await prisma.testAttempt.findMany({
    where: whereForAttempts,
    include: {
      student: { select: { id: true, fullName: true, email: true } },
      test: { select: { id: true, title: true } },
      answers: { include: { question: { select: { skill: true, score: true } } } }
    },
    orderBy: { startedAt: 'asc' }
  })

  const scoreAttempts = attempts.filter(a => a.totalScore !== null)
  const classAverage =
    scoreAttempts.length > 0
      ? scoreAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / scoreAttempts.length
      : 0

  const studentMap = new Map<string, { name: string; attempts: number; total: number }>()
  const skillMap = new Map<string, { correct: number; total: number; score: number }>()
  const monthlyMap = new Map<string, { sum: number; count: number }>()

  for (const attempt of attempts) {
    if (attempt.student) {
      const current = studentMap.get(attempt.student.id) || {
        name: attempt.student.fullName || attempt.student.email,
        attempts: 0,
        total: 0
      }

      current.attempts += 1
      current.total += attempt.totalScore || 0
      studentMap.set(attempt.student.id, current)
    }

    const period = `${attempt.startedAt.getFullYear()}-${String(attempt.startedAt.getMonth() + 1).padStart(2, '0')}`
    const monthly = monthlyMap.get(period) || { sum: 0, count: 0 }
    monthly.sum += attempt.totalScore || 0
    monthly.count += 1
    monthlyMap.set(period, monthly)

    for (const answer of attempt.answers) {
      const key = answer.question.skill || 'general'
      const stat = skillMap.get(key) || { correct: 0, total: 0, score: 0 }
      stat.total += 1
      stat.score += answer.score || 0
      if ((answer.score || 0) > 0) stat.correct += 1
      skillMap.set(key, stat)
    }
  }

  const studentScores = Array.from(studentMap.entries())
    .map(([id, value]) => ({
      id,
      name: value.name,
      attempts: value.attempts,
      averageScore: value.attempts > 0 ? value.total / value.attempts : 0
    }))
    .sort((a, b) => b.averageScore - a.averageScore)

  const leaderboard = studentScores.slice(0, 10).map((student, index) => ({
    rank: index + 1,
    ...student
  }))

  const progressOverTime = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([period, value]) => ({
      period,
      averageScore: value.count > 0 ? value.sum / value.count : 0
    }))

  const skillBreakdown = Array.from(skillMap.entries())
    .map(([skill, value]) => ({
      skill,
      total: value.total,
      correct: value.correct,
      percentage: value.total > 0 ? (value.correct / value.total) * 100 : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)

  const myGoals = await prisma.studyGoal.findMany({
    where: { studentId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'graded').length
  const recommendedLevel = recommendLevel(classAverage)

  return {
    summary: {
      totalAttempts: attempts.length,
      completedAttempts,
      classAverage,
      recommendedLevel
    },
    studentScores,
    skillBreakdown,
    progressOverTime,
    leaderboard,
    goals: myGoals
  }
}

export async function upsertMyStudyGoal(input: {
  targetTests: number
  targetScore: number
  deadline: string
}) {
  const user = await requireRoles(['student'])

  const deadline = new Date(input.deadline)
  if (Number.isNaN(deadline.getTime())) {
    throw new Error('Invalid deadline')
  }

  const current = await prisma.studyGoal.findFirst({
    where: { studentId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  if (current) {
    return prisma.studyGoal.update({
      where: { id: current.id },
      data: {
        targetTests: input.targetTests,
        targetScore: input.targetScore,
        deadline
      }
    })
  }

  return prisma.studyGoal.create({
    data: {
      studentId: user.id,
      targetTests: input.targetTests,
      targetScore: input.targetScore,
      deadline
    }
  })
}

export async function getAnalyticsReportCsv() {
  const data = await getAnalyticsDashboardData()

  const header = 'rank,name,attempts,average_score\n'
  const rows = data.leaderboard
    .map(item => `${item.rank},"${item.name}",${item.attempts},${item.averageScore.toFixed(2)}`)
    .join('\n')

  return header + rows
}
