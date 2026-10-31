import { prisma } from "../config/prisma";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { notificationService } from "./NotificationService";

const repository = new ProjectRepository();
const statuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"];
const badRequest = (message: string) => Object.assign(new Error(message), { statusCode: 400 });

/** One team member as the Projects page sends it: the intern and their role in this group. */
export type MemberInput = { internId: string; projectRole?: string | null };
const cleanRole = (role?: string | null) => (typeof role === "string" && role.trim() ? role.trim() : null);

export class ProjectService {
  list(filters: { status?: string; departmentId?: string; supervisorId?: string; creatorUserId?: string; internUserId?: string }) {
    if (filters.status && !statuses.includes(filters.status)) {
      throw Object.assign(new Error("Invalid project status"), { statusCode: 400 });
    }
    return repository.list(filters);
  }
  async get(id: string) {
    const project = await repository.findById(id);
    if (!project) throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    return project;
  }
  /** The signed-in mentor's own Mentor row (supervisor + department for the projects they create). */
  mentorFor(userId?: string) {
    return userId ? prisma.mentor.findUnique({ where: { userId }, select: { id: true, departmentId: true } }) : Promise.resolve(null);
  }
  async create(input: Parameters<ProjectRepository["create"]>[0] & { members?: MemberInput[] }) {
    const { members, ...data } = input;
    // A mentor's project belongs to their department and they supervise it; the form does not ask for either.
    const mentor = await this.mentorFor(data.createdById);
    if (mentor) {
      data.departmentId ||= mentor.departmentId;
      data.supervisorId ||= mentor.id;
    }
    if (!data.departmentId) {
      const first = await prisma.department.findFirst({ orderBy: { name: "asc" }, select: { id: true } });
      if (first) data.departmentId = first.id;
    }
    if (!data.name?.trim() || !data.departmentId) {
      throw Object.assign(new Error("Project name and departmentId are required"), { statusCode: 400 });
    }
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      throw Object.assign(new Error("endDate must not be before startDate"), { statusCode: 400 });
    }
    if (data.status && !statuses.includes(data.status)) {
      throw Object.assign(new Error("Invalid project status"), { statusCode: 400 });
    }
    const project = await repository.create({ ...data, name: data.name.trim() });
    // setMembers already returns the saved project with its assignments. Reuse that result so a
    // redundant follow-up read cannot make a successfully persisted create look like a failure.
    const savedProject = members?.length
      ? await this.setMembers(project.id, members, data.createdById, false)
      : project;
    // Notifications run after the write and must not hold the HTTP response open. The frontend
    // has a bounded request timeout; a notification query that is slow should not make a saved
    // project look like a failed create.
    void notificationService.projectCreated(project.id, data.createdById);
    if (members?.length) {
      const uniqueMembers = new Map(members.map((member) => [member.internId, member]));
      for (const member of uniqueMembers.values()) {
        void notificationService.projectAssigned(project.id, member.internId, member.projectRole, data.createdById);
      }
    }
    return savedProject;
  }
  async update(id: string, input: Parameters<ProjectRepository["update"]>[1] & { members?: MemberInput[] }, actorUserId?: string) {
    const { members, ...data } = input;
    const current = await this.get(id);
    const startDate = data.startDate === null ? undefined : data.startDate ?? current.startDate ?? undefined;
    const endDate = data.endDate === null ? undefined : data.endDate ?? current.endDate ?? undefined;
    if (startDate && endDate && endDate < startDate) {
      throw Object.assign(new Error("endDate must not be before startDate"), { statusCode: 400 });
    }
    if (data.status && !statuses.includes(data.status)) {
      throw Object.assign(new Error("Invalid project status"), { statusCode: 400 });
    }
    await repository.update(id, data);
    if (members) await this.setMembers(id, members, actorUserId);
    return this.get(id);
  }
  async delete(id: string) { await this.get(id); await repository.delete(id); }
  async assign(projectId: string, internId: string, projectRole?: string | null, actorUserId?: string) {
    await this.get(projectId);
    if (!internId?.trim()) throw Object.assign(new Error("internId is required"), { statusCode: 400 });
    const role = cleanRole(projectRole);
    const assignment = await repository.assign(projectId, internId, role, actorUserId);
    await notificationService.projectAssigned(projectId, internId, role, actorUserId);
    return assignment;
  }

  /** Changes one member's role (PUT /projects/:id/members/:internId). */
  async updateRole(projectId: string, internId: string, projectRole?: string | null, actorUserId?: string) {
    await this.get(projectId);
    const current = (await repository.activeMembers(projectId)).find((m) => m.internId === internId);
    if (!current) throw Object.assign(new Error("This intern is not on the project team"), { statusCode: 404 });
    const role = cleanRole(projectRole);
    const assignment = await repository.updateRole(projectId, internId, role);

    // Notification logic
    if (role !== current.projectRole) {
      await notificationService.projectRoleChanged(projectId, internId, current.projectRole, role, actorUserId);

      // NEW: Specific notification for Scrum Master assignment
      if (role === "Scrum Master") {
        const internUser = await prisma.intern.findUnique({ where: { id: internId }, select: { user: { select: { id: true, role: true } } } });
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
        if (internUser && project) {
          await prisma.notification.create({
            data: {
              userId: internUser.user.id,
              type: "PROJECT_ASSIGNED",
              title: "Designated as Scrum Master",
              message: `You have been designated as the Scrum Master for "${project.name}". You can now manage tasks and the Gantt schedule for this project.`,
              link: `/intern/project`
            }
          });
        }
      }
    }
    return assignment;
  }

  /**
   * Makes the team exactly `members` (PUT /projects/:id/members): new interns are added, roles are updated,
   * interns left out are removed. An intern can be on several projects' teams at once.
   * Every intern affected gets a notification saying what changed.
   */
  async setMembers(projectId: string, members: MemberInput[], actorUserId?: string, notify = true) {
    if (!Array.isArray(members)) throw badRequest("members must be a list of { internId, projectRole }");
    const wanted = new Map<string, string | null>();
    for (const member of members) {
      if (!member || typeof member.internId !== "string" || !member.internId.trim()) throw badRequest("Every member needs an internId");
      wanted.set(member.internId.trim(), cleanRole(member.projectRole));
    }
    const found = await prisma.intern.count({ where: { id: { in: [...wanted.keys()] } } });
    if (found !== wanted.size) throw badRequest("One or more interns do not exist");

    const current = new Map((await repository.activeMembers(projectId)).map((m) => [m.internId, m.projectRole]));
    for (const [internId, role] of wanted) {
      if (!current.has(internId)) {
        await repository.assign(projectId, internId, role, actorUserId);
        if (notify) await notificationService.projectAssigned(projectId, internId, role, actorUserId);
      } else if (current.get(internId) !== role) {
        await repository.updateRole(projectId, internId, role);
        if (notify) await notificationService.projectRoleChanged(projectId, internId, current.get(internId) ?? null, role, actorUserId);
      }
    }
    for (const internId of current.keys()) {
      if (!wanted.has(internId)) {
        await repository.removeAssignment(projectId, internId);
        if (notify) await notificationService.projectRemoved(projectId, internId, actorUserId);
      }
    }
    return this.get(projectId);
  }
  async removeAssignment(projectId: string, internId: string, actorUserId?: string) {
    await this.get(projectId);
    if (!internId?.trim()) throw Object.assign(new Error("internId is required"), { statusCode: 400 });
    const removed = await repository.removeAssignment(projectId, internId);
    await notificationService.projectRemoved(projectId, internId, actorUserId);
    return removed;
  }
}
