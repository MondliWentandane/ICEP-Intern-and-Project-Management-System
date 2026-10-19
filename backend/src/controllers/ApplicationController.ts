import type { Request, Response } from "express";
import { ApplicationService } from "../services/ApplicationService";

const service = new ApplicationService();
const routeParam = (value: string | string[] | undefined): string =>
  typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
const isUniqueConstraintError = (error: unknown): error is { code: "P2002" } =>
  typeof error === "object" && error !== null && "code" in error &&
  (error as { code?: unknown }).code === "P2002";

const sendError = (res: Response, error: unknown) => {
  if (isUniqueConstraintError(error)) {
    return res.status(409).json({ error: "An application already exists for this email and position" });
  }
  const err = error as Error & { statusCode?: number };
  return res.status(err.statusCode ?? 500).json({ error: err.message || "Internal server error" });
};

export async function listApplications(req: Request, res: Response) {
  try { return res.json(await service.list({ status: req.query.status as string, positionId: req.query.positionId as string })); }
  catch (error) { return sendError(res, error); }
}
export async function getApplication(req: Request, res: Response) {
  try { return res.json(await service.get(routeParam(req.params.id))); }
  catch (error) { return sendError(res, error); }
}
export async function getApplicationStatus(req: Request, res: Response) {
  try { return res.json(await service.checkStatus(routeParam(req.params.referenceCode))); }
  catch (error) { return sendError(res, error); }
}
export async function createApplication(req: Request, res: Response) {
  try { return res.status(201).json(await service.create(req.body)); }
  catch (error) { return sendError(res, error); }
}
export async function reviewApplication(req: Request, res: Response) {
  try {
    const { status, interviewAt, rejectionReason } = req.body;
    if (!["PENDING", "INTERVIEWEE", "ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Invalid application status" });
    }
    return res.json(await service.review(routeParam(req.params.id), {
      status, interviewAt, rejectionReason,
      reviewedById: (req as Request & { user?: { id: string } }).user?.id,
    }));
  } catch (error) { return sendError(res, error); }
}



