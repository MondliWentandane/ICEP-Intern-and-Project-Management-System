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
const actor = (req: Request) => (req as Request & { user?: { id: string; role: string } }).user;
const parseDate = (value: unknown) => {
  if (value === null) return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw Object.assign(new Error("Dates must be valid ISO date strings"), { statusCode: 400 });
  }
  return new Date(value);
};

export async function listProjects(req: Request, res: Response) {
  try {
    const user = actor(req);
    let internUserId: string | undefined;
    if (user?.role === "INTERN") internUserId = user.id;
    if (user?.role === "MENTOR") {
      const mentor = await service.mentorFor(user.id);
      return res.json(await service.list({
        status: req.query.status as string,
        supervisorId: mentor?.id,
        creatorUserId: user.id,
      }));
    }

    return res.json(await service.list({
      status: req.query.status as string,
      ...(user?.role === "ADMIN" || user?.role === "WIL_HANDLER"
        ? { departmentId: req.query.departmentId as string | undefined, supervisorId: req.query.supervisorId as string | undefined }
        : {}),
      internUserId,
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
      createdById: actor(req)?.id,
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
    }, actor(req)?.id);
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
    return res.status(201).json(await service.assign(routeParam(req.params.id, "id"), internId, projectRole, actor(req)?.id));
  } catch (error) { return sendError(res, error); }
}
export async function removeProjectMember(req: Request, res: Response) {
  try {
    await service.removeAssignment(routeParam(req.params.id, "id"), routeParam(req.params.internId, "internId"), actor(req)?.id);
    return res.status(204).send();
  } catch (error) { return sendError(res, error); }
}
/** GET /projects/:id/members: the current team with each member's role. */
export async function listProjectMembers(req: Request, res: Response) {
  try { return res.json((await service.get(routeParam(req.params.id, "id"))).assignments); }
  catch (error) { return sendError(res, error); }
}
/** PUT /projects/:id/members  body: { members: [{ internId, projectRole }] } — sets the whole team. */
export async function setProjectMembers(req: Request, res: Response) {
  try {
    return res.json(await service.setMembers(routeParam(req.params.id, "id"), req.body?.members, actor(req)?.id));
  } catch (error) { return sendError(res, error); }
}
/** PUT /projects/:id/members/:internId  body: { projectRole } — changes one member's role. */
export async function updateProjectMember(req: Request, res: Response) {
  try {
    return res.json(await service.updateRole(
      routeParam(req.params.id, "id"), routeParam(req.params.internId, "internId"), req.body?.projectRole, actor(req)?.id,
    ));
  } catch (error) { return sendError(res, error); }
}
