'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser, requireRoles } from '../auth/actions'
import type { QuestionType, QuestionSkill, QuestionDifficulty } from '@prisma/client'

/**
 * Create question folder
 */
export async function createQuestionFolder(title: string, parentId?: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const folder = await prisma.questionFolder.create({
    data: {
      title,
      parentId: parentId || null,
      createdBy: user.id
    }
  })

  return folder
}

/**
 * Get question folders (with hierarchy)
 */
export async function getQuestionFolders(userId?: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const folders = await prisma.questionFolder.findMany({
    where: {
      createdBy: userId || user.id
    },
    include: {
      children: true,
      _count: { select: { questions: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return folders
}

/**
 * Create question
 */
export async function createQuestion({
  folderId,
  type,
  skill,
  difficulty,
  title,
  tags,
  config_json,
  score = 1
}: {
  folderId?: string
  type: QuestionType
  skill?: QuestionSkill
  difficulty?: QuestionDifficulty
  title?: string
  tags?: string[]
  config_json?: Record<string, any>
  score?: number
}) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const question = await prisma.question.create({
    data: {
      folderId: folderId || null,
      type,
      skill,
      difficulty,
      title,
      content: config_json?.content || '',
      explanation: config_json?.explanation,
      score,
      configJson: config_json || {},
      createdBy: user.id,
      tags: {
        create: tags?.map(tagName => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: { name: tagName }
            }
          }
        })) || []
      }
    },
    include: {
      tags: { include: { tag: true } },
      media: true
    }
  })

  return question
}

/**
 * Get all questions (with filters)
 */
export async function getQuestions({
  folderId,
  skill,
  difficulty,
  type,
  userId
}: {
  folderId?: string
  skill?: QuestionSkill
  difficulty?: QuestionDifficulty
  type?: QuestionType
  userId?: string
} = {}) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const questions = await prisma.question.findMany({
    where: {
      createdBy: userId || user.id,
      folderId: folderId || undefined,
      skill: skill || undefined,
      difficulty: difficulty || undefined,
      type: type || undefined
    },
    include: {
      options: true,
      tags: { include: { tag: true } },
      media: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return questions
}

/**
 * Get single question
 */
export async function getQuestion(questionId: string) {
  await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      options: true,
      tags: { include: { tag: true } },
      media: true,
      creator: { select: { id: true, fullName: true } }
    }
  })

  if (!question) throw new Error('Question not found')

  return question
}

/**
 * Update question
 */
export async function updateQuestion(
  questionId: string,
  data: Partial<{
    folderId?: string
    type: QuestionType
    skill?: QuestionSkill
    difficulty?: QuestionDifficulty
    title?: string
    tags?: string[]
    config_json?: Record<string, any>
    score?: number
  }>
) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const question = await prisma.question.findUnique({
    where: { id: questionId }
  })

  if (question?.createdBy !== user.id) {
    throw new Error('Unauthorized')
  }

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      type: data.type,
      skill: data.skill,
      difficulty: data.difficulty,
      title: data.title,
      content: data.config_json?.content || question.content,
      explanation: data.config_json?.explanation,
      score: data.score ?? question.score,
      configJson: data.config_json ? data.config_json : (question.configJson as any)
    },
    include: {
      tags: { include: { tag: true } },
      media: true
    }
  })

  return updated
}

/**
 * Delete question
 */
export async function deleteQuestion(questionId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const question = await prisma.question.findUnique({
    where: { id: questionId }
  })

  if (question?.createdBy !== user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.question.delete({
    where: { id: questionId }
  })

  return { success: true }
}

/**
 * Duplicate question
 */
export async function duplicateQuestion(questionId: string, folderId?: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const original = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      options: { select: { content: true, isCorrect: true } },
      tags: { select: { tagId: true } }
    }
  })

  if (!original) throw new Error('Question not found')

  const duplicated = await prisma.question.create({
    data: {
      folderId: folderId || original.folderId || null,
      type: original.type,
      skill: original.skill,
      difficulty: original.difficulty,
      title: original.title ? `${original.title} (Copy)` : undefined,
      content: original.content,
      explanation: original.explanation,
      score: original.score,
      createdBy: user.id,
      options: {
        create: original.options
      },
      tags: {
        create: original.tags.map(t => ({
          tagId: t.tagId
        }))
      }
    },
    include: {
      options: true,
      tags: { include: { tag: true } }
    }
  })

  return duplicated
}

/**
 * Get assessments (tests) for user
 */
export async function getAssessments() {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const tests = await prisma.test.findMany({
    where: {
      createdBy: user.id
    },
    include: {
      sections: { include: { questions: { include: { question: true } } } },
      attempts: { select: { _count: true } },
      class: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return tests
}

/**
 * Get all tags
 */
export async function getAllTags() {
  await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const tags = await prisma.questionTag.findMany({
    orderBy: { name: 'asc' }
  })

  return tags.map((t) => t.name)
}

/**
 * Move question to folder
 */
export async function moveQuestion(questionId: string, targetFolderId?: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const question = await prisma.question.findUnique({
    where: { id: questionId }
  })

  if (question?.createdBy !== user.id) {
    throw new Error('Unauthorized')
  }

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      folderId: targetFolderId || null
    },
    include: {
      options: true,
      tags: { include: { tag: true } },
      media: true
    }
  })

  return updated
}

/**
 * Delete question folder
 */
export async function deleteQuestionFolder(folderId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const folder = await prisma.questionFolder.findUnique({
    where: { id: folderId }
  })

  if (folder?.createdBy !== user.id) {
    throw new Error('Unauthorized')
  }

  // Move all questions to parent folder before deleting
  await prisma.question.updateMany({
    where: { folderId },
    data: { folderId: folder.parentId || null }
  })

  // Delete folder
  await prisma.questionFolder.delete({
    where: { id: folderId }
  })

  return { success: true }
}

/**
 * Update question folder
 */
export async function updateQuestionFolder(folderId: string, title: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const folder = await prisma.questionFolder.findUnique({
    where: { id: folderId }
  })

  if (folder?.createdBy !== user.id) {
    throw new Error('Unauthorized')
  }

  const updated = await prisma.questionFolder.update({
    where: { id: folderId },
    data: { title },
    include: {
      children: true,
      _count: { select: { questions: true } }
    }
  })

  return updated
}
