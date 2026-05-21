'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser, requireAuthenticatedUser, requireRoles } from '../auth/actions'
import type { TestType, ShowAnswersMode } from '@prisma/client'

/**
 * Create test with sections
 */
export async function createTest({
  title,
  description,
  type,
  classId,
  allowAnonymous,
  allowRetry,
  maxAttempts,
  startAt,
  endAt,
  showAnswersMode,
  sections
}: {
  title: string
  description?: string
  type: TestType
  classId?: string
  allowAnonymous?: boolean
  allowRetry?: boolean
  maxAttempts?: number
  startAt?: Date
  endAt?: Date
  showAnswersMode?: ShowAnswersMode
  sections: Array<{
    title: string
    skill?: string
    durationMinutes?: number
    questionIds: string[]
  }>
}) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const test = await prisma.test.create({
    data: {
      title,
      description,
      type,
      classId: classId || null,
      allowAnonymous,
      allowRetry,
      maxAttempts,
      startAt,
      endAt,
      showAnswersMode: showAnswersMode || 'after_deadline',
      createdBy: user.id,
      sections: {
        create: sections.map((section, idx) => ({
          title: section.title,
          skill: section.skill as any,
          durationMinutes: section.durationMinutes,
          orderIndex: idx,
          questions: {
            create: section.questionIds.map((questionId, qIdx) => ({
              questionId,
              orderIndex: qIdx
            }))
          }
        }))
      }
    },
    include: {
      sections: {
        include: { questions: { include: { question: true } } }
      }
    }
  })

  return test
}

/**
 * Update test metadata
 */
export async function updateTest(testId: string, data: { title?: string; description?: string }) {
  await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  return prisma.test.update({
    where: { id: testId },
    data: {
      title: data.title,
      description: data.description,
    },
  })
}

/**
 * Get test by ID
 */
export async function getTest(testId: string) {
  await requireAuthenticatedUser()

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      sections: {
        include: {
          questions: {
            include: { question: { include: { options: true, media: true } } }
          }
        },
        orderBy: { orderIndex: 'asc' }
      },
      creator: { select: { id: true, fullName: true } },
      class: { select: { id: true, title: true } }
    }
  })

  if (!test) throw new Error('Test not found')

  return test
}

/**
 * Get tests (with filters)
 */
export async function getTests({ classId, userId }: { classId?: string; userId?: string } = {}) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const tests = await prisma.test.findMany({
    where: {
      createdBy: userId || user.id,
      classId: classId || undefined
    },
    include: {
      sections: { select: { _count: true } },
      attempts: { select: { _count: true } },
      class: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return tests
}

/**
 * Start test attempt
 */
export async function startTestAttempt(
  testId: string,
  anonymousData?: {
    name: string
    email: string
    phone?: string
  }
) {
  const user = await getCurrentUser()

  // Load test with sections & questions to compute server-side ordering
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      sections: {
        include: { questions: { include: { question: true } } },
        orderBy: { orderIndex: 'asc' }
      }
    }
  })

  if (!test) throw new Error('Test not found')

  // Check attempts if not anonymous
  if (user && test.maxAttempts) {
    const attemptCount = await prisma.testAttempt.count({
      where: { testId, studentId: user.id }
    })

    if (attemptCount >= test.maxAttempts) {
      throw new Error('Max attempts reached')
    }
  }


  // Generate deterministic random seed and compute sectionsOrder
  const seed = Math.floor(Math.random() * 1e9)

  const mulberry32 = (a: number) => {
    return function () {
      var t = (a += 0x6D2B79F5)
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  const rng = mulberry32(seed)
  const shuffleDeterministic = (arr: any[]) => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const sectionsOrder = test.sections.map((s: any) => {
    const qIds = s.questions.map((q: any) => q.id)
    const ordered = s.randomizeQuestions ? shuffleDeterministic(qIds) : qIds
    return { sectionId: s.id, questionIds: ordered }
  })

  const attempt = await prisma.testAttempt.create({
    data: {
      testId,
      studentId: user?.id || null,
      anonymousName: anonymousData?.name || null,
      anonymousEmail: anonymousData?.email || null,
      anonymousPhone: anonymousData?.phone || null,
      status: 'in_progress',
      randomSeed: seed,
      sectionsOrder: sectionsOrder as any
    }
  })

  return attempt
}

/**
 * Submit test attempt with answers
 */
export async function submitTestAttempt(
  attemptId: string,
  answers: Array<{
    questionId: string
    answerText?: string
    answerJson?: Record<string, any>
  }>
) {
  const user = await getCurrentUser()

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId }
  })

  if (!attempt) throw new Error('Attempt not found')

  // If attempt is linked to user, verify ownership
  if (attempt.studentId && user?.id !== attempt.studentId) {
    throw new Error('Unauthorized')
  }

  // Enforce total duration based on section durations if defined
  const test = await prisma.test.findUnique({ where: { id: attempt.testId }, include: { sections: true } })
  const totalMinutes = test?.sections?.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) || 0
  if (totalMinutes > 0) {
    const now = new Date()
    const elapsedMs = now.getTime() - new Date(attempt.startedAt).getTime()
    const elapsedMinutes = elapsedMs / 1000 / 60
    // Allow small grace of 0.5 minutes
    if (elapsedMinutes - 0.5 > totalMinutes) {
      throw new Error('Time expired for this attempt')
    }
  }

  // Create answer records
  await prisma.attemptAnswer.createMany({
    data: answers.map(ans => ({
      attemptId,
      questionId: ans.questionId,
      answerText: ans.answerText ?? undefined,
      answerJson: ans.answerJson ?? undefined
    }))
  })

  // Update attempt status
  const updated = await prisma.testAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'submitted',
      submittedAt: new Date()
    },
    include: {
      answers: { include: { question: true } },
      test: { include: { sections: true } }
    }
  })

  // Auto-score simple questions
  await autoScoreAttempt(attemptId)

  return updated
}

/**
 * Auto-score attempt (MCQ, true/false, etc)
 */
export async function autoScoreAttempt(attemptId: string) {
  const answers = await prisma.attemptAnswer.findMany({
    where: { attemptId },
    include: { question: { include: { options: true } } }
  })

  let totalScore = 0

  for (const answer of answers) {
    let score = 0

    if (answer.question.type === 'mcq' || answer.question.type === 'true_false') {
      const correctOption = answer.question.options.find(o => o.isCorrect)
      if ((answer.answerJson as any)?.selectedId === correctOption?.id) {
        score = answer.question.score
      }
    }

    if (score > 0) {
      await prisma.attemptAnswer.update({
        where: { id: answer.id },
        data: { score }
      })
    }

    totalScore += score
  }

  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { totalScore, status: 'graded' }
  })
}

/**
 * Get attempt results
 */
export async function getAttemptResults(attemptId: string) {
  const user = await getCurrentUser()

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: { include: { questions: { include: { question: true } } } }
        }
      },
      answers: { include: { question: { include: { options: true } } } },
      student: { select: { id: true, fullName: true } }
    }
  })

  if (!attempt) throw new Error('Attempt not found')

  // Check access
  if (attempt.studentId && user?.id !== attempt.studentId && user?.role !== 'teacher') {
    throw new Error('Unauthorized')
  }

  return attempt
}

/**
 * Calculate score by skill
 */
export async function calculateSkillScores(attemptId: string) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: { include: { question: true } },
      test: { include: { sections: true } }
    }
  })

  if (!attempt) throw new Error('Attempt not found')

  const skillScores: Record<string, { correct: number; total: number }> = {}

  for (const answer of attempt.answers) {
    const skill = answer.question.skill || 'general'
    if (!skillScores[skill]) {
      skillScores[skill] = { correct: 0, total: 0 }
    }

    skillScores[skill].total++
    if (answer.score && answer.score > 0) {
      skillScores[skill].correct++
    }
  }

  return Object.entries(skillScores).map(([skill, { correct, total }]) => ({
    skill,
    percentage: (correct / total) * 100,
    correct,
    total
  }))
}

/**
 * Create test section
 */
export async function createTestSection({
  testId,
  title,
  skill,
  durationMinutes
}: {
  testId: string
  title: string
  skill?: string
  durationMinutes?: number
}) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const test = await prisma.test.findUnique({ where: { id: testId } })
  if (test?.createdBy !== user.id) throw new Error('Unauthorized')

  const maxOrder = await prisma.testSection.findFirst({
    where: { testId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true }
  })

  const section = await prisma.testSection.create({
    data: {
      testId,
      title,
      skill: skill as any || null,
      durationMinutes: durationMinutes || null,
      orderIndex: (maxOrder?.orderIndex || 0) + 1
    },
    include: { questions: { include: { question: true } } }
  })

  return section
}

/**
 * Update test section
 */
export async function updateTestSection(
  sectionId: string,
  data: {
    title?: string
    skill?: string | null
    durationMinutes?: number | null
  }
) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const section = await prisma.testSection.findUnique({
    where: { id: sectionId },
    include: { test: true }
  })

  if (section?.test.createdBy !== user.id) throw new Error('Unauthorized')

  const updated = await prisma.testSection.update({
    where: { id: sectionId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.skill !== undefined && { skill: data.skill as any }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes })
    },
    include: { questions: { include: { question: true } } }
  })

  return updated
}

/**
 * Delete test section
 */
export async function deleteTestSection(sectionId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const section = await prisma.testSection.findUnique({
    where: { id: sectionId },
    include: { test: true }
  })

  if (section?.test.createdBy !== user.id) throw new Error('Unauthorized')

  await prisma.testSection.delete({ where: { id: sectionId } })
  return { success: true }
}

/**
 * Add question to section
 */
export async function addQuestionToSection({
  sectionId,
  questionId,
  customScore
}: {
  sectionId: string
  questionId: string
  customScore?: number
}) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const section = await prisma.testSection.findUnique({
    where: { id: sectionId },
    include: { test: true }
  })

  if (section?.test.createdBy !== user.id) throw new Error('Unauthorized')

  const maxOrder = await prisma.testQuestion.findFirst({
    where: { testSectionId: sectionId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true }
  })

  const testQuestion = await prisma.testQuestion.create({
    data: {
      testSectionId: sectionId,
      questionId,
      customScore: customScore || null,
      orderIndex: (maxOrder?.orderIndex || 0) + 1
    },
    include: { question: true }
  })

  return testQuestion
}

/**
 * Remove question from section
 */
export async function removeQuestionFromSection(testQuestionId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const testQuestion = await prisma.testQuestion.findUnique({
    where: { id: testQuestionId },
    include: { section: { include: { test: true } } }
  })

  if (testQuestion?.section.test.createdBy !== user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.testQuestion.delete({ where: { id: testQuestionId } })
  return { success: true }
}

/**
 * Reorder questions in section
 */
export async function reorderQuestionsInSection(
  sectionId: string,
  questionIds: string[]
) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const section = await prisma.testSection.findUnique({
    where: { id: sectionId },
    include: { test: true }
  })

  if (section?.test.createdBy !== user.id) throw new Error('Unauthorized')

  await Promise.all(
    questionIds.map((qId, index) =>
      prisma.testQuestion.update({
        where: { id: qId },
        data: { orderIndex: index }
      })
    )
  )

  const questions = await prisma.testQuestion.findMany({
    where: { testSectionId: sectionId },
    include: { question: true },
    orderBy: { orderIndex: 'asc' }
  })

  return questions
}

/**
 * Reorder sections in test
 */
export async function reorderSectionsInTest(testId: string, sectionIds: string[]) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const test = await prisma.test.findUnique({ where: { id: testId } })
  if (test?.createdBy !== user.id) throw new Error('Unauthorized')

  await Promise.all(
    sectionIds.map((sId, index) =>
      prisma.testSection.update({
        where: { id: sId },
        data: { orderIndex: index }
      })
    )
  )

  const sections = await prisma.testSection.findMany({
    where: { testId },
    include: { questions: { include: { question: true } } },
    orderBy: { orderIndex: 'asc' }
  })

  return sections
}

/**
 * Update question score in test
 */
export async function updateTestQuestionScore(testQuestionId: string, customScore: number) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const testQuestion = await prisma.testQuestion.findUnique({
    where: { id: testQuestionId },
    include: { section: { include: { test: true } } }
  })

  if (testQuestion?.section.test.createdBy !== user.id) {
    throw new Error('Unauthorized')
  }

  const updated = await prisma.testQuestion.update({
    where: { id: testQuestionId },
    data: { customScore },
    include: { question: true }
  })

  return updated
}

/**
 * Get test attempt with all questions (for test-taking)
 */
export async function getTestAttemptDetails(attemptId: string) {
  const user = await requireAuthenticatedUser()
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      testId: true,
      studentId: true,
      randomSeed: true,
      sectionsOrder: true,
      startedAt: true,
      submittedAt: true,
      status: true,
      totalScore: true,
      answers: true,
      student: { select: { id: true, fullName: true } },
      test: {
        select: {
          sections: {
            select: {
              id: true,
              orderIndex: true,
              title: true,
              questions: {
                select: {
                  orderIndex: true,
                  question: {
                    select: {
                      id: true,
                      title: true,
                      content: true,
                      explanation: true,
                      score: true,
                      type: true,
                      parentQuestionId: true,
                      skill: true,
                      difficulty: true,
                      configJson: true,
                      options: true,
                      media: true
                    }
                  }
                },
                orderBy: { orderIndex: 'asc' }
              }
            },
            orderBy: { orderIndex: 'asc' }
          }
        }
      }
    }
  })

  if (!attempt) throw new Error('Attempt not found')

  // Check access
  if (attempt.studentId && user?.id !== attempt.studentId) {
    throw new Error('Unauthorized')
  }

  // Reconstruct test.sections/question order based on persisted sectionsOrder if available
  if (attempt.sectionsOrder && attempt.test && attempt.test.sections) {
    const orderMap = new Map<string, string[]>()
    ;(attempt.sectionsOrder as any).forEach((s: any) => orderMap.set(s.sectionId, s.questionIds))

    attempt.test.sections = attempt.test.sections.map((s: any) => {
      const qOrder = orderMap.get(s.id)
      if (!qOrder) return s
      const qMap = new Map(s.questions.map((q: any) => [q.id, q]))
      const orderedQs = qOrder.map((id: string) => qMap.get(id)).filter(Boolean)
      return { ...s, questions: orderedQs }
    })
  }

  return attempt
}

/**
 * Save answer draft (autosave)
 */
export async function saveAnswerDraft(
  attemptId: string,
  questionId: string,
  answerData: {
    answerText?: string
    answerJson?: Record<string, any>
  }
) {
  const user = await requireAuthenticatedUser()

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId }
  })

  if (!attempt) throw new Error('Attempt not found')

  // Check ownership
  if (attempt.studentId && user?.id !== attempt.studentId) {
    throw new Error('Unauthorized')
  }

  // Find or create answer
  let answer = await prisma.attemptAnswer.findFirst({
    where: { attemptId, questionId }
  })

  if (answer) {
    // Update existing draft
    answer = await prisma.attemptAnswer.update({
      where: { id: answer.id },
      data: {
        answerText: answerData.answerText ?? answer.answerText,
        answerJson: answerData.answerJson ?? answer.answerJson ?? undefined
      }
    })
  } else {
    // Create new draft
    answer = await prisma.attemptAnswer.create({
      data: {
        attemptId,
        questionId,
        answerText: answerData.answerText ?? undefined,
        answerJson: answerData.answerJson ?? undefined
      }
    })
  }

  return answer
}

/**
 * Bulk save answer drafts (upsert multiple answers in one transaction)
 */
export async function bulkSaveAnswerDrafts(
  attemptId: string,
  answers: Array<{ questionId: string; answerText?: string; answerJson?: Record<string, any> }>
) {
  const user = await requireAuthenticatedUser()

  const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } })
  if (!attempt) throw new Error('Attempt not found')

  // Check ownership
  if (attempt.studentId && user?.id !== attempt.studentId) {
    throw new Error('Unauthorized')
  }

  // perform create or update per answer
  const results = await Promise.all(
    answers.map(async a => {
      const existing = await prisma.attemptAnswer.findFirst({ where: { attemptId, questionId: a.questionId } })
      if (existing) {
        return prisma.attemptAnswer.update({
          where: { id: existing.id },
          data: {
            answerText: a.answerText ?? undefined,
            answerJson: a.answerJson ?? undefined
          }
        })
      }

      return prisma.attemptAnswer.create({
        data: {
          attemptId,
          questionId: a.questionId,
          answerText: a.answerText ?? undefined,
          answerJson: a.answerJson ?? undefined
        }
      })
    })
  )

  return results
}

/**
 * Update answer with feedback (for grading)
 */
export async function updateAnswerFeedback(
  answerId: string,
  feedback: {
    score: number
    feedback?: string
  }
) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const answer = await prisma.attemptAnswer.findUnique({
    where: { id: answerId },
    include: { attempt: { include: { test: true } } }
  })

  if (!answer) throw new Error('Answer not found')

  const updated = await prisma.attemptAnswer.update({
    where: { id: answerId },
    data: {
      score: feedback.score,
      feedback: feedback.feedback || null,
      gradedBy: user.id,
      gradedAt: new Date()
    }
  })

  return updated
}

/**
 * Get test attempt progress (for progress bar)
 */
export async function getTestAttemptProgress(attemptId: string) {
  const user = await requireAuthenticatedUser()

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: {
            select: { id: true, _count: { select: { questions: true } } }
          }
        }
      },
      answers: true
    }
  })

  if (!attempt) throw new Error('Attempt not found')

  if (attempt.studentId && attempt.studentId !== user.id && !['teacher', 'academic_manager', 'super_admin'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  let totalQuestions = 0
  let answeredQuestions = 0

  for (const section of attempt.test.sections) {
    totalQuestions += section._count.questions
  }

  answeredQuestions = attempt.answers.filter(a => a.answerJson || a.answerText).length

  return {
    totalQuestions,
    answeredQuestions,
    percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
  }
}

/**
 * Force submit attempt (when time expires)
 */
export async function forceSubmitTestAttempt(attemptId: string) {
  const user = await requireAuthenticatedUser()

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: { include: { question: true } }, test: true }
  })

  if (!attempt) throw new Error('Attempt not found')
  if (attempt.status !== 'in_progress') throw new Error('Attempt already submitted')

  if (attempt.studentId && attempt.studentId !== user.id && !['teacher', 'academic_manager', 'super_admin'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  // Auto-score existing answers
  let totalScore = 0
  for (const answer of attempt.answers) {
    if (!answer.score) {
      // Try to auto-score
      if (answer.question.type === 'mcq' || answer.question.type === 'true_false') {
        const correctOption = await prisma.questionOption.findFirst({
          where: { questionId: answer.questionId, isCorrect: true }
        })

        if ((answer.answerJson as { selectedId?: string })?.selectedId === correctOption?.id) {
          const score = answer.question.score || 1
          await prisma.attemptAnswer.update({
            where: { id: answer.id },
            data: { score }
          })
          totalScore += score
        }
      }
    } else {
      totalScore += answer.score
    }
  }

  // Mark as submitted
  const updated = await prisma.testAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'submitted',
      submittedAt: new Date(),
      totalScore
    }
  })

  return updated
}

/**
 * Delete test
 */
export async function deleteTest(testId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const test = await prisma.test.findUnique({ where: { id: testId } })
  if (test?.createdBy !== user.id) throw new Error('Unauthorized')

  await prisma.test.delete({ where: { id: testId } })
  return { success: true }
}
