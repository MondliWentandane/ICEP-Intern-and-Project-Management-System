
import { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export class TaskRepository {
  static async createTask(data: Prisma.TaskUncheckedCreateInput) {
    return prisma.task.create({ data });
  }

  static async getTask(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        subtasks: true,
        comments: true
      }
    });
  }

  static async getTasks(where: Prisma.TaskWhereInput = {}) {
    return prisma.task.findMany({
      where,
      include: {
        project: { select: { name: true } },
        assignedTo: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getInternBoardTasks(internId: string) {
    return prisma.task.findMany({
      where: {
        project: {
          assignments: {
            some: { internId, leftAt: null }
          }
        }
      },
      include: {
        project: true,
        assignedTo: {
          include: {
            user: {
              select: { fullName: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getProjectTasks(projectId: string) {
    return prisma.task.findMany({
      where: { projectId },
      include: {
        project: true,
        subtasks: true,
        assignedTo: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }]
    });
  }

  static async countProjectTasks(projectId: string) {
    return prisma.task.count({ where: { projectId } });
  }

  static async reorderTask(projectId: string, taskId: string, requestedPosition: number) {
    return prisma.$transaction(async (transaction) => {
      const ordered = await transaction.task.findMany({
        where: { projectId },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      const oldIndex = ordered.findIndex((task) => task.id === taskId);
      if (oldIndex < 0) throw new Error("Task not found in this project");
      const [task] = ordered.splice(oldIndex, 1);
      const nextIndex = Math.max(0, Math.min(requestedPosition, ordered.length));
      ordered.splice(nextIndex, 0, task);
      for (const [position, item] of ordered.entries()) {
        await transaction.task.update({ where: { id: item.id }, data: { position } });
      }
      return transaction.task.findUniqueOrThrow({ where: { id: taskId } });
    });
  }

  static async updateTask(
    id: string,
    data: Prisma.TaskUncheckedUpdateInput
  ) {
    return prisma.task.update({
      where: { id },
      data
    });
  }

  static async deleteTask(id: string) {
    return prisma.task.delete({
      where: { id }
    });
  }

  static async updateTaskStatus(id: string, status: TaskStatus, blockedReason: string | null = null) {
    return prisma.task.update({
      where: { id },
      data: {
        status,
        blockedReason: status === "BLOCKED" ? blockedReason : null,
        completedAt: status === "COMPLETED" ? new Date() : null,
        approvedAt: null,
        approvedById: null
      }
    });
  }

  static async assignTask(id: string, internId: string | null) {
    return prisma.task.update({
      where: { id },
      data: { assignedToId: internId }
    });
  }

  static async approveTask(id: string, approvedById: string) {
    return prisma.task.update({
      where: { id },
      data: {
        approvedAt: new Date(),
        approvedById
      }
    });
  }

  static async requestTaskChanges(id: string, authorId: string, feedback: string) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.task.updateMany({
        where: { id, status: "COMPLETED", approvedAt: null },
        data: { status: "IN_PROGRESS", completedAt: null }
      });

      if (result.count !== 1) {
        throw new Error("Task is no longer waiting for review");
      }

      await transaction.taskComment.create({
        data: { taskId: id, authorId, body: feedback }
      });

      return transaction.task.findUniqueOrThrow({ where: { id } });
    });
  }

  static async getReviewQueue() {
    return prisma.task.findMany({
      where: {
        status: "COMPLETED",
        approvedAt: null
      },
      include: {
        project: { select: { name: true } },
        assignedTo: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  static async getSubtasks(parentId: string) {
    return prisma.task.findMany({
      where: { parentId },
      orderBy: { position: "asc" }
    });
  }

  static async getComments(taskId: string) {
    return prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" }
    });
  }

  static async addComment(
    taskId: string,
    authorId: string,
    body: string
  ) {
    return prisma.taskComment.create({
      data: { taskId, authorId, body }
    });
  }

  static async getProject(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId }
    });
  }

  static async getMentorByUserId(userId: string) {
    return prisma.mentor.findUnique({
      where: { userId }
    });
  }

  static async getIntern(internId: string) {
    return prisma.intern.findUnique({
      where: { id: internId }
    });
  }

  static async getProjectAssignment(
    projectId: string,
    internId: string
  ) {
    return prisma.projectAssignment.findUnique({
      where: {
        projectId_internId: { projectId, internId }
      }
    });
  }

  
    static async getInternByUserId(userId: string) {
        return prisma.intern.findUnique({
            where: { userId }
        });
    }

}
