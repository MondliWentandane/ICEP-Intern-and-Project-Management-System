import { createHash } from "node:crypto";
import bcrypt from "bcrypt";
import {
  ApplicationRepository,
  type ApplicationProfileUpdate,
  type ApplicationStatusValue,
} from "../repositories/ApplicationRepository";
import { prisma } from "../config/prisma";
import { readDocument, removeDocument, storeDocument, type StoredFile } from "./DocumentStorage";

type UploadedFiles = Record<string, Express.Multer.File[] | undefined> | undefined;
const badRequest = (message: string) => Object.assign(new Error(message), { statusCode: 400 });
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const digits = (value: unknown) => text(value).replace(/\s+/g, "");
const DAY_MS = 24 * 60 * 60 * 1000;

/** "2nd year" / "2" -> 2 */
function parseYear(value: unknown): number | undefined {
  const match = text(value).match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

/** Skills arrive as a JSON array string, repeated form fields, or a comma-separated list. */
function parseSkills(value: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      list = Array.isArray(parsed) ? parsed : [value];
    } catch {
      list = value.split(",");
    }
  }
  const names = list.map((item) => text(item)).filter(Boolean);
  return [...new Map(names.map((name) => [name.toLowerCase(), name])).values()].slice(0, 15);
}

/** Positions stay open for applications until the end of their closing date. */
const isAcceptingApplications = (position: { status: string; closingDate: Date } | null) =>
  Boolean(position && position.status === "OPEN" && position.closingDate.getTime() + DAY_MS > Date.now());

const repository = new ApplicationRepository();
const transitions: Record<ApplicationStatusValue, ApplicationStatusValue[]> = {
  PENDING: ["INTERVIEWEE", "ACCEPTED", "REJECTED"],
  INTERVIEWEE: ["ACCEPTED", "REJECTED", "PENDING"],
  ACCEPTED: [],
  REJECTED: [],
};

export class ApplicationService {
  list(filters: { status?: string; positionId?: string }) { return repository.list(filters); }

  getPendingApplications() { return repository.findPending(); }
  getPendingApplicants() { return this.getPendingApplications(); }

  async get(id: string) {
    const application = await repository.findById(id);
    if (!application) throw Object.assign(new Error("Application not found"), { statusCode: 404 });
    return application;
  }

  async checkStatus(referenceCode: string) {
    const application = await repository.findByReference(referenceCode);
    if (!application) throw Object.assign(new Error("Application not found"), { statusCode: 404 });
    return application;
  }

  /**
   * Public "Track application": the applicant proves it is theirs with the email they applied with
   * plus the reference number. A wrong email and an unknown reference give the same answer, so the
   * lookup cannot be used to find out who has applied.
   */
  async track(email: unknown, reference: unknown) {
    const normalisedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const referenceCode = typeof reference === "string" ? reference.trim().toUpperCase() : "";
    if (!normalisedEmail || !referenceCode) {
      throw Object.assign(new Error("Enter the email address and reference number you applied with."), { statusCode: 400 });
    }
    const application = await repository.findForTracking(referenceCode);
    if (!application || application.email.toLowerCase() !== normalisedEmail) {
      throw Object.assign(new Error("No application matches that email address and reference number."), { statusCode: 404 });
    }
    const { position, documents, reviewedBy, interviewAt, interviewVenue, ...rest } = application;
    return {
      ...rest,
      positionTitle: position.title,
      campus: position.campus.name,
      department: position.department.name,
      intake: position.intake,
      interview: interviewAt ? { at: interviewAt, venue: interviewVenue } : null,
      documents: documents.map((document) => document.type),
      // Signs the WIL placement letter once accepted.
      reviewerName: reviewedBy?.fullName ?? null,
    };
  }

  createApplication(input: Parameters<ApplicationRepository["create"]>[0]) { return this.create(input); }

  async create(input: Parameters<ApplicationRepository["create"]>[0]) {
    if (!input.fullName?.trim() || !input.email?.trim() || !input.positionId ||
        !input.studentNumber?.trim() || !input.institution?.trim() || !input.qualification?.trim()) {
      throw Object.assign(new Error("Required application fields are missing"), { statusCode: 400 });
    }
    const position = await prisma.position.findUnique({
      where: { id: input.positionId },
      select: { status: true, closingDate: true },
    });
    if (!isAcceptingApplications(position)) {
      throw Object.assign(new Error("This position is not accepting applications"), { statusCode: 400 });
    }
    return repository.create(input);
  }

  /**
   * Public application form (multipart/form-data from the careers "Apply" pop-up).
   * Saves the applicant's details, skills and the three PDF documents, status PENDING.
   */
  async submit(body: Record<string, unknown>, files: UploadedFiles) {
    const positionId = text(body.positionId);
    const fullName = text(body.fullName) || [text(body.firstName), text(body.surname)].filter(Boolean).join(" ");
    const email = text(body.email).toLowerCase();
    const phone = digits(body.phone);
    const idNumber = digits(body.idNumber);
    const studentNumber = text(body.studentNumber);
    const qualification = text(body.qualification);
    const institution = text(body.institution) || "Tshwane University of Technology";
    const yearOfStudy = parseYear(body.yearOfStudy);

    if (!positionId) throw badRequest("Choose the position you are applying for.");
    if (!fullName) throw badRequest("Enter your name and surname.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest("Enter a valid email address.");
    if (phone && !/^(\+27|0)[6-8]\d{8}$/.test(phone)) throw badRequest("Enter a South African mobile number.");
    if (idNumber && !/^\d{13}$/.test(idNumber)) throw badRequest("Your ID number must be 13 digits.");
    if (!studentNumber) throw badRequest("Enter your student number.");
    if (!qualification) throw badRequest("Enter your qualification.");

    const cv = files?.cv?.[0];
    const idDocument = files?.idDocument?.[0];
    const academicRecord = files?.academicRecord?.[0];
    if (!cv || !idDocument || !academicRecord) {
      throw badRequest("Upload your CV, ID document and academic record (PDF).");
    }

    const position = await prisma.position.findUnique({
      where: { id: positionId },
      select: { status: true, closingDate: true },
    });
    if (!isAcceptingApplications(position)) throw badRequest("This position is not accepting applications.");

    const existing = await prisma.application.findFirst({ where: { email, positionId }, select: { id: true } });
    if (existing) {
      throw Object.assign(new Error("You have already applied for this position with this email address."), { statusCode: 409 });
    }

    // Skills are stored by name; new ones are added to the skills table.
    const skillIds: string[] = [];
    for (const name of parseSkills(body.skills)) {
      const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
      skillIds.push(skill.id);
    }

    const referenceCode = await this.newReferenceCode();
    const stored: Array<StoredFile & { type: "CV" | "ID_COPY" | "ACADEMIC_RECORD" }> = [];
    try {
      stored.push({ type: "CV", ...(await storeDocument(referenceCode, cv)) });
      stored.push({ type: "ID_COPY", ...(await storeDocument(referenceCode, idDocument)) });
      stored.push({ type: "ACADEMIC_RECORD", ...(await storeDocument(referenceCode, academicRecord)) });

      return await repository.create({
        referenceCode, positionId, fullName, email,
        phone: phone || undefined, idNumber: idNumber || undefined,
        studentNumber, institution, qualification, yearOfStudy,
        skillIds, documents: stored,
      });
    } catch (error) {
      await Promise.all(stored.map((file) => removeDocument(file.fileUrl)));
      throw error;
    }
  }

  /** e.g. ICEP-2026-04821 (what the applicant uses to track the application). */
  private async newReferenceCode() {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = `ICEP-${year}-${String(Math.floor(10000 + Math.random() * 90000))}`;
      if (!(await repository.referenceExists(code))) return code;
    }
    return `ICEP-${year}-${Date.now().toString().slice(-8)}`;
  }

  async getDocuments(id: string) {
    const application = await this.get(id);
    return application.documents.map(({ id: documentId, type, fileName, mimeType, sizeBytes, uploadedAt }) =>
      ({ id: documentId, type, fileName, mimeType, sizeBytes, uploadedAt }));
  }

  async downloadDocument(id: string, documentId: string) {
    const document = await repository.findDocument(id, documentId);
    if (!document) throw Object.assign(new Error("Document not found"), { statusCode: 404 });
    return { document, content: await readDocument(document.fileUrl) };
  }

  async updateProfile(id: string, input: ApplicationProfileUpdate) {
    const application = await this.get(id);
    if (application.status !== "PENDING" && application.status !== "INTERVIEWEE") {
      throw Object.assign(new Error("Only pending or interviewee applications can be edited"), { statusCode: 409 });
    }
    for (const [field, value] of Object.entries({
      fullName: input.fullName,
      email: input.email,
      studentNumber: input.studentNumber,
      institution: input.institution,
      qualification: input.qualification,
    })) {
      if (value !== undefined && !value.trim()) {
        throw Object.assign(new Error(field + " cannot be empty"), { statusCode: 400 });
      }
    }
    return repository.updateProfile(id, {
      ...input,
      ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.studentNumber !== undefined ? { studentNumber: input.studentNumber.trim() } : {}),
      ...(input.institution !== undefined ? { institution: input.institution.trim() } : {}),
      ...(input.qualification !== undefined ? { qualification: input.qualification.trim() } : {}),
    });
  }

  async setPassword(token: string, password: string) {
    if (!token?.trim() || !password) {
      throw Object.assign(new Error("A password setup token and password are required"), { statusCode: 400 });
    }
    if (password.length < 8) {
      throw Object.assign(new Error("Password must be at least 8 characters long"), { statusCode: 400 });
    }
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await repository.setPasswordFromToken(tokenHash, passwordHash);
    if (!updated) {
      throw Object.assign(new Error("Password setup token is invalid, expired, or already used"), { statusCode: 400 });
    }
  }

  async updateStatus(id: string, data: {
    status: ApplicationStatusValue;
    interviewAt?: string;
    interviewVenue?: string;
    rejectionReason?: string;
    reviewedById?: string;
  }) {
    const current = await this.get(id);
    if (!transitions[current.status as ApplicationStatusValue].includes(data.status)) {
      throw Object.assign(
        new Error("Cannot change application from " + current.status + " to " + data.status),
        { statusCode: 400 },
      );
    }
    if (data.status === "INTERVIEWEE" &&
        (!data.interviewAt || Number.isNaN(Date.parse(data.interviewAt)))) {
      throw Object.assign(new Error("A valid interviewAt date is required when scheduling an interview"), { statusCode: 400 });
    }
    if (data.status === "REJECTED" && !data.rejectionReason?.trim()) {
      throw Object.assign(new Error("rejectionReason is required when rejecting an application"), { statusCode: 400 });
    }
    return repository.updateStatus(id, {
      status: data.status,
      ...(data.interviewAt ? { interviewAt: new Date(data.interviewAt) } : {}),
      ...(data.interviewVenue?.trim() ? { interviewVenue: data.interviewVenue.trim() } : {}),
      ...(data.status === "REJECTED" ? { rejectionReason: data.rejectionReason!.trim() } : {}),
      ...(data.reviewedById ? { reviewedById: data.reviewedById } : {}),
    });
  }

  acceptApplication(id: string, reviewedById?: string) { return this.acceptApplicant(id, reviewedById); }

  acceptApplicant(id: string, reviewedById?: string) {
    return this.updateStatus(id, { status: "ACCEPTED", reviewedById });
  }

  rejectApplication(id: string, rejectionReason: string, reviewedById?: string) { return this.rejectApplicant(id, rejectionReason, reviewedById); }

  rejectApplicant(id: string, rejectionReason: string, reviewedById?: string) {
    // The reason is optional on the Applicants page.
    return this.updateStatus(id, { status: "REJECTED", rejectionReason: rejectionReason?.trim() || "No reason given", reviewedById });
  }
}

