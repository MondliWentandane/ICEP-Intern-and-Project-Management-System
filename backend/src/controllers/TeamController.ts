import type { Response } from "express";
import { Prisma } from "@prisma/client";
import type { AuthenticatedRequest } from "../middlewares/AuthMiddleware";
import { TeamService, type TeamInput } from "../services/TeamService";

const service = new TeamService();

function sendError(res: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ error: "A conflicting team record already exists" });
    if (error.code === "P2003") return res.status(400).json({ error: "A selected intern does not exist" });
  }
  const err = error as Error & { statusCode?: number };
  return res.status(err.statusCode ?? 500).json({ error: err.message || "Internal server error" });
}

function actor(req: AuthenticatedRequest) {
  return req.user ? { id: req.user.id, role: req.user.role } : null;
}

export async function listTeams(req: AuthenticatedRequest, res: Response) {
  const user = actor(req);
  if (!user) return res.status(401).json({ error: "Authentication is required" });
  try { return res.json(await service.list(user)); }
  catch (error) { return sendError(res, error); }
}

export async function createTeam(req: AuthenticatedRequest, res: Response) {
  const user = actor(req);
  if (!user) return res.status(401).json({ error: "Authentication is required" });
  try { return res.status(201).json(await service.create(req.body as TeamInput, user)); }
  catch (error) { return sendError(res, error); }
}

export async function updateTeam(req: AuthenticatedRequest, res: Response) {
  const user = actor(req);
  if (!user) return res.status(401).json({ error: "Authentication is required" });
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) return res.status(400).json({ error: "Team ID is required" });
  try { return res.json(await service.update(id, req.body as TeamInput, user)); }
  catch (error) { return sendError(res, error); }
}

export async function deleteTeam(req: AuthenticatedRequest, res: Response) {
  const user = actor(req);
  if (!user) return res.status(401).json({ error: "Authentication is required" });
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) return res.status(400).json({ error: "Team ID is required" });
  try { await service.delete(id, user); return res.status(204).send(); }
  catch (error) { return sendError(res, error); }
}
