import { ProjectRepository } from "../repositories/ProjectRepository";
import { notificationService } from "./NotificationService";

const repository = new ProjectRepository();
const statuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"];

export class ProjectService {
  list(filters: { status?: string; departmentId?: string; supervisorId?: string }) {
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
  async create(input: Parameters<ProjectRepository["create"]>[0]) {
    if (!input.name?.trim() || !input.departmentId) {
      throw Object.assign(new Error("Project name and departmentId are required"), { statusCode: 400 });
    }
    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      throw Object.assign(new Error("endDate must not be before startDate"), { statusCode: 400 });
    }
    if (input.status && !statuses.includes(input.status)) {
      throw Object.assign(new Error("Invalid project status"), { statusCode: 400 });
    }
    return repository.create({ ...input, name: input.name.trim() });
  }
  async update(id: string, input: Parameters<ProjectRepository["update"]>[1]) {
    const current = await this.get(id);
    const startDate = input.startDate === null ? undefined : input.startDate ?? current.startDate ?? undefined;
    const endDate = input.endDate === null ? undefined : input.endDate ?? current.endDate ?? undefined;
    if (startDate && endDate && endDate < startDate) {
      throw Object.assign(new Error("endDate must not be before startDate"), { statusCode: 400 });
    }
    if (input.status && !statuses.includes(input.status)) {
      throw Object.assign(new Error("Invalid project status"), { statusCode: 400 });
    }
    return repository.update(id, input);
  }
  async delete(id: string) { await this.get(id); await repository.delete(id); }
  async assign(projectId: string, internId: string, projectRole?: string) {
    await this.get(projectId);
    if (!internId?.trim()) throw Object.assign(new Error("internId is required"), { statusCode: 400 });
    const assignment = await repository.assign(projectId, internId, projectRole);
    await notificationService.projectAssigned(projectId, internId);
    return assignment;
  }
  async removeAssignment(projectId: string, internId: string) {
    await this.get(projectId);
    if (!internId?.trim()) throw Object.assign(new Error("internId is required"), { statusCode: 400 });
    return repository.removeAssignment(projectId, internId);
  }
}