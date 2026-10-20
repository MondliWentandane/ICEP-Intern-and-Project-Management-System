import { createHash } from "node:crypto";
import bcrypt from "bcrypt";
import {
  ApplicationRepository,
  type ApplicationProfileUpdate,
  type ApplicationStatusValue,
} from "../repositories/ApplicationRepository";
import { prisma } from "../config/prisma";

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
    if (!position || position.status !== "OPEN" || position.closingDate < new Date()) {
      throw Object.assign(new Error("This position is not accepting applications"), { statusCode: 400 });
    }
    return repository.create(input);
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
    return this.updateStatus(id, { status: "REJECTED", rejectionReason, reviewedById });
  }
}

