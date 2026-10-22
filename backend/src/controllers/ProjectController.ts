import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ProjectService } from "../services/ProjectService";

const service = new ProjectService();
const routeParam = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== "string" || !value) {
    throw Object.assign(new Error(`${name} is required`), { statusCode: 400 });
  }
  return value;
};
const sendError = (res: Response, error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ error: "A conflicting record already exists" });
    if (error.code === "P2003") return res.status(400).json({ error: "A referenced record does not exist" });
  }
  const err = error as Error & { statusCode?: number };
  return res.status(err.statusCode ?? 500).json({ error: err.message || "Internal server error" });
};
const parseDate = (value: unknown) => {
  if (value === null) return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw Object.assign(new Error("Dates must be valid ISO date strings"), { statusCode: 400 });
  }
  return new Date(value);
};

export async function listProjects(req: Request, res: Response) {
  try {
    return res.json(await service.list({
      status: req.query.status as string, departmentId: req.query.departmentId as string,
      supervisorId: req.query.supervisorId as string,
    }));
  } catch (error) { return sendError(res, error); }
}
export async function getProject(req: Request, res: Response) {
  try { return res.json(await service.get(routeParam(req.params.id, "id"))); }
  catch (error) { return sendError(res, error); }
}
export async function createProject(req: Request, res: Response) {
  try {
    const body = req.body;
    const project = await service.create({
      ...body,
      ...(body.startDate !== undefined ? { startDate: parseDate(body.startDate) ?? undefined } : {}),
      ...(body.endDate !== undefined ? { endDate: parseDate(body.endDate) ?? undefined } : {}),
      createdById: (req as Request & { user?: { id: string } }).user?.id,
    });
    return res.status(201).json(project);
  } catch (error) { return sendError(res, error); }
}
export async function updateProject(req: Request, res: Response) {
  try {
    const body = req.body;
    const project = await service.update(routeParam(req.params.id, "id"), {
      ...body,
      ...(body.startDate !== undefined ? { startDate: parseDate(body.startDate) } : {}),
      ...(body.endDate !== undefined ? { endDate: parseDate(body.endDate) } : {}),
    });
    return res.json(project);
  } catch (error) { return sendError(res, error); }
}
export async function deleteProject(req: Request, res: Response) {
  try { await service.delete(routeParam(req.params.id, "id")); return res.status(204).send(); }
  catch (error) { return sendError(res, error); }
}
export async function assignProjectMember(req: Request, res: Response) {
  try {
    const { internId, projectRole } = req.body;
    return res.status(201).json(await service.assign(routeParam(req.params.id, "id"), internId, projectRole));
  } catch (error) { return sendError(res, error); }
}
export async function removeProjectMember(req: Request, res: Response) {
  try {
    await service.removeAssignment(routeParam(req.params.id, "id"), routeParam(req.params.internId, "internId"));
    return res.status(204).send();
  } catch (error) { return sendError(res, error); }
}