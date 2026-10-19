import { prisma } from "../config/prisma";

export const applicationInclude = {
  position: { include: { campus: true, department: true, intake: true } },
  skills: { include: { skill: true } },
  documents: true,
  reviewedBy: { select: { id: true, fullName: true, email: true } },
} as const;

export class ApplicationRepository {
  list(filters: { status?: string; positionId?: string } = {}) {
    return prisma.application.findMany({
      where: {
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.positionId ? { positionId: filters.positionId } : {}),
      },
      include: applicationInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string) {
    return prisma.application.findUnique({ where: { id }, include: applicationInclude });
  }

  findByReference(referenceCode: string) {
    return prisma.application.findUnique({
      where: { referenceCode },
      select: { referenceCode: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  create(data: {
    positionId: string; fullName: string; email: string; phone?: string;
    idNumber?: string; studentNumber: string; institution: string;
    qualification: string; yearOfStudy?: number; skillIds?: string[];
  }) {
    const { skillIds = [], ...application } = data;
    return prisma.application.create({
      data: {
        ...application,
        email: application.email.trim().toLowerCase(),
        skills: skillIds.length
          ? { create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })) }
          : undefined,
      },
      include: applicationInclude,
    });
  }

  update(id: string, data: {
    status?: "PENDING" | "INTERVIEWEE" | "ACCEPTED" | "REJECTED";
    interviewAt?: Date | null; rejectionReason?: string | null; reviewedById?: string;
  }) {
    return prisma.application.update({
      where: { id },
      data: {
        ...data,
        ...(data.status ? { reviewedAt: new Date() } : {}),
      },
      include: applicationInclude,
    });
  }
}
