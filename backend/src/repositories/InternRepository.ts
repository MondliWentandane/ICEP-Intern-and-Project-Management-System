
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export interface InternFilters {
  departmentId?: string;
  skill?: string;
  status?: "ACTIVE" | "COMPLETED" | "WITHDRAWN";
}

/** Audit-log actions written when an internship ends or is reinstated. */
export const INTERNSHIP_ACTIONS = ["INTERNSHIP_COMPLETED", "INTERNSHIP_RESIGNED", "INTERNSHIP_DISMISSED", "INTERNSHIP_REINSTATED"];
export type InternshipAction = "INTERNSHIP_COMPLETED" | "INTERNSHIP_RESIGNED" | "INTERNSHIP_DISMISSED";

export class InternRepository {
  async findAll(filters: InternFilters = {}) {
    const where: Prisma.InternWhereInput = {};

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.skill) {
      where.skills = {
        some: {
          skill: {
            name: {
              contains: filters.skill,
              mode: "insensitive",
            },
          },
        },
      };
    }

    return prisma.intern.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        department: true,
        campus: true,
        intake: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.intern.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, isActive: true } },
        department: true,
        campus: true,
        intake: true,
        mentor: { include: { user: { select: { fullName: true } } } },
        skills: {
          include: {
            skill: true,
          },
        },
        documents: { select: { id: true, type: true, fileName: true } },
        assignments: {
          include: { project: { select: { id: true, name: true, status: true } } },
          orderBy: { assignedAt: "desc" },
        },
      },
    });
  }

  findByUserId(userId: string) {
    return prisma.intern.findUnique({ where: { userId }, select: { id: true, status: true, endDate: true } });
  }

  /** Interns still marked ACTIVE whose placement ended before `today` (a date-only value). */
  findEndedButActive(today: Date) {
    return prisma.intern.findMany({ where: { status: "ACTIVE", endDate: { lt: today } }, select: { id: true, endDate: true } });
  }

  /** Completed and withdrawn internships, newest end date first, for the Past Interns archive. */
  findPast() {
    return prisma.intern.findMany({
      where: { status: { in: ["COMPLETED", "WITHDRAWN"] } },
      include: {
        user: { select: { fullName: true, email: true } },
        campus: { select: { name: true } },
        department: { select: { name: true } },
        intake: { select: { name: true, startDate: true, endDate: true } },
        mentor: { include: { user: { select: { fullName: true } } } },
        assignments: { include: { project: { select: { name: true } } }, orderBy: { assignedAt: "desc" }, take: 1 },
      },
      orderBy: [{ endDate: "desc" }, { updatedAt: "desc" }],
    });
  }

  /** How each internship ended (latest INTERNSHIP_* audit entry per intern), with who ended it. */
  findEndings(internIds: string[]) {
    return prisma.auditLog.findMany({
      where: { entity: "Intern", entityId: { in: internIds }, action: { in: INTERNSHIP_ACTIONS } },
      include: { actor: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Ends an internship in one transaction: sets the status and end date, turns off the intern's
   * login, takes them off their project teams (history kept) and records why in the audit log.
   */
  close(intern: { id: string }, change: { status: "COMPLETED" | "WITHDRAWN"; endDate: Date; action: InternshipAction; reason: string | null; actorId: string | null }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.intern.update({ where: { id: intern.id }, data: { status: change.status, endDate: change.endDate } });
      await tx.user.update({ where: { id: updated.userId }, data: { isActive: false } });
      await tx.projectAssignment.updateMany({ where: { internId: intern.id, leftAt: null }, data: { leftAt: new Date() } });
      await tx.auditLog.create({
        data: {
          actorId: change.actorId, action: change.action, entity: "Intern", entityId: intern.id,
          metadata: { reason: change.reason, endDate: change.endDate.toISOString().slice(0, 10) },
        },
      });
      return updated;
    });
  }

  /** Undoes an ended internship (e.g. ended by mistake or extended): active again with a new end date. */
  reinstate(intern: { id: string }, endDate: Date, actorId: string | null) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.intern.update({ where: { id: intern.id }, data: { status: "ACTIVE", endDate } });
      await tx.user.update({ where: { id: updated.userId }, data: { isActive: true } });
      await tx.auditLog.create({
        data: { actorId, action: "INTERNSHIP_REINSTATED", entity: "Intern", entityId: intern.id, metadata: { endDate: endDate.toISOString().slice(0, 10) } },
      });
      return updated;
    });
  }
}

export default new InternRepository();