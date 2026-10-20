import { ApplicationRepository } from "../repositories/ApplicationRepository";
import { prisma } from "../config/prisma";

const repository = new ApplicationRepository();
const transitions: Record<string, string[]> = {
  PENDING: ["INTERVIEWEE", "ACCEPTED", "REJECTED"],
  INTERVIEWEE: ["ACCEPTED", "REJECTED", "PENDING"],
  ACCEPTED: [],
  REJECTED: [],
};

export class ApplicationService {
  list(filters: { status?: string; positionId?: string }) { return repository.list(filters); }

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

  async create(input: Parameters<ApplicationRepository["create"]>[0]) {
    if (!input.fullName?.trim() || !input.email?.trim() || !input.positionId ||
        !input.studentNumber?.trim() || !input.institution?.trim() || !input.qualification?.trim()) {
      throw Object.assign(new Error("Required application fields are missing"), { statusCode: 400 });
    }
    const position = await prisma.position.findUnique({
      where: { id: input.positionId }, select: { status: true, closingDate: true },
    });
    if (!position || position.status !== "OPEN" || position.closingDate < new Date()) {
      throw Object.assign(new Error("This position is not accepting applications"), { statusCode: 400 });
    }
    return repository.create(input);
  }

  async review(id: string, data: {
    status: "INTERVIEWEE" | "ACCEPTED" | "REJECTED" | "PENDING";
    interviewAt?: string; rejectionReason?: string; reviewedById?: string;
  }) {
    const current = await this.get(id);
    if (!transitions[current.status].includes(data.status)) {
      throw Object.assign(new Error(`Cannot change application from ${current.status} to ${data.status}`), { statusCode: 400 });
    }
    if (data.status === "INTERVIEWEE" && !data.interviewAt) {
      throw Object.assign(new Error("interviewAt is required when scheduling an interview"), { statusCode: 400 });
    }
    if (data.status === "REJECTED" && !data.rejectionReason?.trim()) {
      throw Object.assign(new Error("rejectionReason is required when rejecting an application"), { statusCode: 400 });
    }
    return repository.update(id, {
      status: data.status,
      ...(data.interviewAt ? { interviewAt: new Date(data.interviewAt) } : {}),
      ...(data.status === "REJECTED" ? { rejectionReason: data.rejectionReason!.trim() } : {}),
      ...(data.reviewedById ? { reviewedById: data.reviewedById } : {}),
    });
  }
}

