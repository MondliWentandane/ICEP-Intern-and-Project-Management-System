import { prisma } from "../config/prisma";

export type ApplicationStatusValue = "PENDING" | "INTERVIEWEE" | "ACCEPTED" | "REJECTED";

export const applicationInclude = {
  position: { include: { campus: true, department: true, intake: true } },
  skills: { include: { skill: true } },
  documents: true,
  reviewedBy: { select: { id: true, fullName: true, email: true } },
} as const;

export type ApplicationProfileUpdate = {
  fullName?: string;
  email?: string;
  phone?: string | null;
  studentNumber?: string;
  institution?: string;
  qualification?: string;
  yearOfStudy?: number | null;
  skillIds?: string[];
};

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

  findByStatus(status: ApplicationStatusValue) {
    return prisma.application.findMany({
      where: { status }, include: applicationInclude, orderBy: { createdAt: "desc" },
    });
  }

  findPending() { return this.findByStatus("PENDING"); }

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
    referenceCode?: string;
    documents?: Array<{
      type: "CV" | "ID_COPY" | "ACADEMIC_RECORD";
      fileName: string; fileUrl: string; mimeType?: string; sizeBytes?: number;
    }>;
  }) {
    const { skillIds = [], documents = [], ...application } = data;
    return prisma.application.create({
      data: {
        ...application,
        email: application.email.trim().toLowerCase(),
        skills: skillIds.length
          ? { create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })) }
          : undefined,
        documents: documents.length ? { create: documents } : undefined,
      },
      include: applicationInclude,
    });
  }

  referenceExists(referenceCode: string) {
    return prisma.application.count({ where: { referenceCode } }).then((count) => count > 0);
  }

  findDocument(applicationId: string, documentId: string) {
    return prisma.document.findFirst({ where: { id: documentId, applicationId } });
  }

  updateProfile(id: string, data: ApplicationProfileUpdate) {
    const { skillIds, ...profile } = data;
    return prisma.application.update({
      where: { id },
      data: {
        ...profile,
        ...(profile.email ? { email: profile.email.trim().toLowerCase() } : {}),
        ...(skillIds ? {
          skills: {
            deleteMany: {},
            create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })),
          },
        } : {}),
      },
      include: applicationInclude,
    });
  }

  updateStatus(id: string, data: {
    status: ApplicationStatusValue;
    interviewAt?: Date | null;
    interviewVenue?: string | null;
    rejectionReason?: string | null;
    reviewedById?: string;
  }) {
    return prisma.application.update({
      where: { id },
      data: { ...data, reviewedAt: new Date() },
      include: applicationInclude,
    });
  }

  async setPasswordFromToken(tokenHash: string, passwordHash: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const token = await tx.passwordToken.findFirst({
        where: {
          tokenHash, purpose: "SET_PASSWORD", usedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true, userId: true },
      });
      if (!token) return false;

      const claimed = await tx.passwordToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return false;

      await tx.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      });
      return true;
    });
  }
}

