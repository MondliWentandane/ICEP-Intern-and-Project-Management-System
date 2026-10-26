import { prisma } from "../config/prisma";

export const projectInclude = {
  department: true,
  supervisor: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  requiredSkills: { include: { skill: true } },
  assignments: {
    where: { leftAt: null },
    include: { intern: { include: { user: { select: { id: true, fullName: true, email: true } } } } },
  },
  _count: { select: { tasks: true } },
} as const;

export class ProjectRepository {
  list(filters: { status?: string; departmentId?: string; supervisorId?: string; internUserId?: string } = {}) {
    return prisma.project.findMany({
      where: {
        ...(filters.internUserId ? { assignments: { some: { leftAt: null, intern: { userId: filters.internUserId } } } } : {}),
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
        ...(filters.supervisorId ? { supervisorId: filters.supervisorId } : {}),
      },
      include: projectInclude, orderBy: { createdAt: "desc" },
    });
  }
  findById(id: string) { return prisma.project.findUnique({ where: { id }, include: projectInclude }); }
  create(input: {
    name: string; groupName?: string; description?: string; departmentId: string;
    status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
    startDate?: Date; endDate?: Date; supervisorId?: string; createdById?: string; skillIds?: string[];
  }) {
    const { skillIds = [], ...data } = input;
    return prisma.project.create({
      data: { ...data, requiredSkills: skillIds.length
        ? { create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })) }
        : undefined },
      include: projectInclude,
    });
  }
  update(id: string, input: {
    name?: string; groupName?: string | null; description?: string | null;
    departmentId?: string; status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
    startDate?: Date | null; endDate?: Date | null; supervisorId?: string | null;
    skillIds?: string[];
  }) {
    const { skillIds, ...data } = input;
    return prisma.project.update({
      where: { id },
      data: {
        ...data,
        ...(skillIds ? { requiredSkills: {
          deleteMany: {}, create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })),
        } } : {}),
      },
      include: projectInclude,
    });
  }
  delete(id: string) { return prisma.project.delete({ where: { id } }); }
  async assign(projectId: string, internId: string, projectRole?: string | null, assignedById?: string) {
    const existing = await prisma.projectAssignment.findUnique({
      where: { projectId_internId: { projectId, internId } },
    });
    if (existing?.leftAt) {
      return prisma.projectAssignment.update({
        where: { id: existing.id }, data: { leftAt: null, projectRole, assignedAt: new Date(), ...(assignedById ? { assignedById } : {}) },
        include: { intern: { include: { user: true } } },
      });
    }
    return prisma.projectAssignment.upsert({
      where: { projectId_internId: { projectId, internId } },
      create: { projectId, internId, projectRole, ...(assignedById ? { assignedById } : {}) },
      update: { projectRole },
      include: { intern: { include: { user: true } } },
    });
  }
  /** Current (not left) members of a project, with their roles. */
  activeMembers(projectId: string) {
    return prisma.projectAssignment.findMany({ where: { projectId, leftAt: null }, select: { internId: true, projectRole: true } });
  }
  updateRole(projectId: string, internId: string, projectRole: string | null) {
    return prisma.projectAssignment.update({
      where: { projectId_internId: { projectId, internId } },
      data: { projectRole },
      include: { intern: { include: { user: true } } },
    });
  }
  removeAssignment(projectId: string, internId: string) {
    return prisma.projectAssignment.update({
      where: { projectId_internId: { projectId, internId } },
      data: { leftAt: new Date() },
    });
  }
}