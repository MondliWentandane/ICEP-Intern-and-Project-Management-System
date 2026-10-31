import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export type TeamMemberInput = { internId: string; projectRole: string };
export type TeamInput = { name: string; description: string; members: TeamMemberInput[] };
export type TeamActor = { id: string; role: string };

const teamRoles = ["Backend Developer", "Frontend Developer", "Scrum Master", "UI/UX Designer", "Tester"];
const teamInclude = {
  members: {
    include: { intern: { include: { user: { select: { fullName: true, email: true } } } } },
    orderBy: { addedAt: "asc" },
  },
} satisfies Prisma.TeamInclude;

const httpError = (statusCode: number, message: string) => Object.assign(new Error(message), { statusCode });

export class TeamService {
  list(user: TeamActor) {
    return prisma.team.findMany({
      where: user.role === "ADMIN" ? {} : { createdById: user.id },
      include: teamInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: TeamInput, user: TeamActor) {
    const members = await this.validate(input);
    return prisma.team.create({
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        createdById: user.id,
        members: {
          create: members.map((member) => ({
            projectRole: member.projectRole,
            intern: { connect: { id: member.internId } },
          })),
        },
      },
      include: teamInclude,
    });
  }

  async update(id: string, input: TeamInput, user: TeamActor) {
    const current = await prisma.team.findUnique({ where: { id }, select: { id: true, createdById: true } });
    if (!current) throw httpError(404, "Team not found");
    this.assertOwner(current.createdById, user);
    const members = await this.validate(input);

    return prisma.team.update({
      where: { id },
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        members: {
          deleteMany: {},
          create: members.map((member) => ({
            projectRole: member.projectRole,
            intern: { connect: { id: member.internId } },
          })),
        },
      },
      include: teamInclude,
    });
  }

  async delete(id: string, user: TeamActor) {
    const current = await prisma.team.findUnique({ where: { id }, select: { id: true, createdById: true } });
    if (!current) throw httpError(404, "Team not found");
    this.assertOwner(current.createdById, user);
    await prisma.team.delete({ where: { id } });
  }

  private assertOwner(createdById: string | null, user: TeamActor) {
    if (user.role !== "ADMIN" && createdById !== user.id) {
      throw httpError(403, "You do not have permission to manage this team");
    }
  }

  private async validate(input: TeamInput) {
    if (typeof input?.name !== "string" || input.name.trim().length < 3 || input.name.trim().length > 120) {
      throw httpError(400, "Team name must be between 3 and 120 characters");
    }
    if (typeof input.description !== "string" || input.description.trim().length < 20 || input.description.trim().length > 1000) {
      throw httpError(400, "Team description must be between 20 and 1000 characters");
    }
    if (!Array.isArray(input.members) || input.members.length < 2) {
      throw httpError(400, "Choose at least two team members");
    }

    const members = input.members.map((member) => ({
      internId: typeof member?.internId === "string" ? member.internId.trim() : "",
      projectRole: typeof member?.projectRole === "string" ? member.projectRole.trim() : "",
    }));
    if (members.some((member) => !member.internId || !teamRoles.includes(member.projectRole))) {
      throw httpError(400, "Every team member needs a valid role");
    }
    const memberIds = members.map((member) => member.internId);
    if (new Set(memberIds).size !== memberIds.length) {
      throw httpError(400, "A team cannot contain the same intern more than once");
    }
    if (members.filter((member) => member.projectRole === "Scrum Master").length !== 1) {
      throw httpError(400, "A team must have exactly one Scrum Master");
    }

    const activeInterns = await prisma.intern.count({
      where: { id: { in: memberIds }, status: "ACTIVE" },
    });
    if (activeInterns !== memberIds.length) {
      throw httpError(400, "Every selected member must be an active intern");
    }
    return members;
  }
}
