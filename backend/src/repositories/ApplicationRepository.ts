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

  /**
   * Accepting an applicant makes them an intern: a user account with role INTERN and no password yet,
   * plus their intern profile (campus, intake and department from the position). Their documents and
   * skills move across to the profile. Runs as one transaction, and does nothing if it already exists.
   */
  createInternFromApplication(applicationId: string) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        include: { position: { include: { intake: true } }, skills: true, intern: true },
      });
      if (!application) throw Object.assign(new Error("Application not found"), { statusCode: 404 });
      if (application.intern) return application.intern;

      const email = application.email.trim().toLowerCase();
      const existing = await tx.user.findUnique({ where: { email }, include: { intern: true } });
      if (existing && existing.role !== "INTERN") {
        throw Object.assign(new Error("This email address already belongs to a staff account, so it can't become an intern account."), { statusCode: 409 });
      }
      if (existing?.intern) {
        throw Object.assign(new Error("This applicant already has an intern profile from another application."), { statusCode: 409 });
      }
      const sameStudent = await tx.intern.findUnique({
        where: { institution_studentNumber: { institution: application.institution, studentNumber: application.studentNumber } },
        select: { id: true },
      });
      if (sameStudent) {
        throw Object.assign(new Error("An intern with this student number at this institution already exists."), { statusCode: 409 });
      }
      const user = existing ?? await tx.user.create({
        data: { fullName: application.fullName, email, phone: application.phone, role: "INTERN", passwordHash: null },
      });

      const intern = await tx.intern.create({
        data: {
          userId: user.id,
          applicationId: application.id,
          studentNumber: application.studentNumber,
          institution: application.institution,
          qualification: application.qualification,
          yearOfStudy: application.yearOfStudy,
          campusId: application.position.campusId,
          intakeId: application.position.intakeId,
          departmentId: application.position.departmentId,
          startDate: application.position.intake.startDate,
          endDate: application.position.intake.endDate,
          skills: { create: application.skills.map(({ skillId }) => ({ skillId })) },
        },
      });
      // The CV etc. now also show on the Intern Profile page.
      await tx.document.updateMany({ where: { applicationId: application.id }, data: { internId: intern.id } });
      return intern;
    });
  }

  /** Everything the public "Track application" page may show. No ID number, phone or internal notes. */
  findForTracking(referenceCode: string) {
    return prisma.application.findUnique({
      where: { referenceCode },
      select: {
        referenceCode: true, email: true, fullName: true, status: true,
        studentNumber: true, institution: true, qualification: true,
        interviewAt: true, interviewVenue: true, reviewedAt: true, createdAt: true, updatedAt: true,
        position: { select: {
          title: true,
          campus: { select: { name: true } },
          department: { select: { name: true } },
          intake: { select: { name: true, startDate: true, endDate: true } },
        } },
        documents: { select: { type: true } },
        reviewedBy: { select: { fullName: true } },
      },
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

