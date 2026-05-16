'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser, requireAuthenticatedUser, requireRoles } from '../auth/actions'

/**
 * Create course
 */
export async function createCourse({
  title,
  description,
  level
}: {
  title: string
  description?: string
  level?: string
}) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const course = await prisma.course.create({
    data: {
      title,
      description,
      level,
      createdBy: user.id
    }
  })

  return course
}

/**
 * Get courses
 */
export async function getCourses() {
  const user = await requireAuthenticatedUser()

  const courses = await prisma.course.findMany({
    where: {
      createdBy: user.id
    },
    include: {
      classes: { select: { _count: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return courses
}

/**
 * Create class (within a course)
 */
export async function createClass({
  courseId,
  title,
  startDate,
  endDate
}: {
  courseId: string
  title: string
  startDate: Date
  endDate: Date
}) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  // Verify user owns the course
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  })

  if (course?.createdBy !== user.id) {
    throw new Error('Unauthorized')
  }

  // Generate unique code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()

  const classItem = await prisma.class.create({
    data: {
      courseId,
      title,
      code,
      teacherId: user.id,
      startDate,
      endDate
    }
  })

  return classItem
}

/**
 * Get classes
 */
export async function getClasses() {
  const user = await requireAuthenticatedUser()

  const classes = await prisma.class.findMany({
    where: {
      teacherId: user.id
    },
    include: {
      course: { select: { title: true } },
      _count: {
        select: {
          students: true,
          tests: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return classes
}

/**
 * Add student to class
 */
export async function addStudentToClass(classId: string, studentId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const classItem = await prisma.class.findUnique({
    where: { id: classId }
  })

  if (classItem?.teacherId !== user.id) {
    throw new Error('Unauthorized')
  }

  // Check if already enrolled
  const existing = await prisma.classStudent.findUnique({
    where: {
      classId_studentId: { classId, studentId }
    }
  })

  if (existing) {
    return existing
  }

  const enrollment = await prisma.classStudent.create({
    data: {
      classId,
      studentId
    }
  })

  return enrollment
}

/**
 * Join class by code (student action)
 */
export async function joinClassByCode(code: string) {
  const user = await requireRoles(['student'])

  const classItem = await prisma.class.findUnique({
    where: { code }
  })

  if (!classItem) {
    throw new Error('Class not found')
  }

  // Check if already enrolled
  const existing = await prisma.classStudent.findUnique({
    where: {
      classId_studentId: { classId: classItem.id, studentId: user.id }
    }
  })

  if (existing) {
    return existing
  }

  const enrollment = await prisma.classStudent.create({
    data: {
      classId: classItem.id,
      studentId: user.id
    }
  })

  return enrollment
}

/**
 * Get student classes
 */
export async function getStudentClasses() {
  const user = await requireRoles(['student'])

  const enrollments = await prisma.classStudent.findMany({
    where: {
      studentId: user.id
    },
    include: {
      class: {
        include: {
          course: { select: { title: true } },
          tests: { select: { _count: true } }
        }
      }
    },
    orderBy: { joinedAt: 'desc' }
  })

  return enrollments.map(e => e.class)
}

/**
 * Get class details
 */
export async function getClassDetails(classId: string) {
  const user = await requireAuthenticatedUser()

  const classItem = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      course: true,
      students: {
        include: {
          student: { select: { id: true, fullName: true, email: true } }
        }
      },
      tests: {
        include: {
          sections: { select: { _count: true } },
          attempts: { select: { _count: true } }
        }
      }
    }
  })

  if (!classItem) throw new Error('Class not found')

  // Verify access (teacher or admin)
  if (classItem.teacherId !== user.id && user.role !== 'super_admin' && user.role !== 'academic_manager') {
    throw new Error('Unauthorized')
  }

  return classItem
}

/**
 * Get course details
 */
export async function getCourse(courseId: string) {
  const user = await requireAuthenticatedUser()

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      classes: { include: { students: { include: { student: true } }, tests: true } }
    }
  })

  if (!course) throw new Error('Course not found')

  // verify owner or admin
  if (course.createdBy !== user.id && user.role !== 'super_admin' && user.role !== 'academic_manager') {
    throw new Error('Unauthorized')
  }

  return course
}

/**
 * Update course
 */
export async function updateCourse(courseId: string, data: { title?: string; description?: string; level?: string }) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new Error('Course not found')
  if (course.createdBy !== user.id && user.role !== 'super_admin' && user.role !== 'academic_manager') throw new Error('Unauthorized')

  const updated = await prisma.course.update({ where: { id: courseId }, data })
  return updated
}

/**
 * Delete course
 */
export async function deleteCourse(courseId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new Error('Course not found')
  if (course.createdBy !== user.id && user.role !== 'super_admin' && user.role !== 'academic_manager') throw new Error('Unauthorized')

  await prisma.course.delete({ where: { id: courseId } })
  return { success: true }
}

/**
 * Remove student from class
 */
export async function removeStudentFromClass(classId: string, studentId: string) {
  const user = await requireRoles(['teacher', 'academic_manager', 'super_admin'])

  const classItem = await prisma.class.findUnique({ where: { id: classId } })
  if (!classItem) throw new Error('Class not found')
  if (classItem.teacherId !== user.id && user.role !== 'super_admin' && user.role !== 'academic_manager') throw new Error('Unauthorized')

  await prisma.classStudent.deleteMany({ where: { classId, studentId } })
  return { success: true }
}
