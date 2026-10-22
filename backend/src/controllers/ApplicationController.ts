import type { Request, Response } from "express";
import { ApplicationService } from "../services/ApplicationService";

const service = new ApplicationService();
const routeParam = (value: string | string[] | undefined): string =>
  typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
const isPrismaErrorCode = (error: unknown, code: string): boolean =>
  typeof error === "object" && error !== null &&
  "code" in error && (error as { code?: unknown }).code === code;

const sendError = (res: Response, error: unknown) => {
  if (isPrismaErrorCode(error, "P2002")) {
    return res.status(409).json({ error: "An application already exists for this email and position" });
  }
  if (isPrismaErrorCode(error, "P2003")) {
    return res.status(400).json({ error: "A referenced record does not exist" });
  }
  if (isPrismaErrorCode(error, "P2025")) {
    return res.status(404).json({ error: "Application or password setup token not found" });
  }
  const err = error as Error & { statusCode?: number };
  return res.status(err.statusCode ?? 500).json({ error: err.message || "Internal server error" });
};

export async function listApplications(req: Request, res: Response) {
  try {
    return res.json(await service.list({
      status: req.query.status as string | undefined,
      positionId: req.query.positionId as string | undefined,
    }));
  } catch (error) { return sendError(res, error); }
}

export async function getPendingApplications(_req: Request, res: Response) {
  try { return res.json(await service.getPendingApplications()); }
  catch (error) { return sendError(res, error); }
}

export async function getApplication(req: Request, res: Response) {
  try { return res.json(await service.get(routeParam(req.params.id))); }
  catch (error) { return sendError(res, error); }
}

/** POST /applications/track — public. Body: { email, reference } */
export async function trackApplication(req: Request, res: Response) {
  try { return res.json(await service.track(req.body?.email, req.body?.reference)); }
  catch (error) { return sendError(res, error); }
}

export async function getApplicationStatus(req: Request, res: Response) {
  try { return res.json(await service.checkStatus(routeParam(req.params.referenceCode))); }
  catch (error) { return sendError(res, error); }
}

// Careers "Apply" form: multipart fields + cv / idDocument / academicRecord PDFs (parsed by multer in the route).
export async function createApplication(req: Request, res: Response) {
  try {
    const files = req.files && !Array.isArray(req.files) ? req.files : undefined;
    const created = await service.submit(req.body ?? {}, files);
    // Only what the "Application submitted" screen needs; no ID number or storage paths go back to the browser.
    return res.status(201).json({
      id: created.id,
      referenceCode: created.referenceCode,
      status: created.status,
      createdAt: created.createdAt,
      fullName: created.fullName,
      email: created.email,
      position: { id: created.position.id, title: created.position.title, campus: created.position.campus.name },
    });
  }
  catch (error) { return sendError(res, error); }
}

export async function getApplicationDocuments(req: Request, res: Response) {
  try { return res.json(await service.getDocuments(routeParam(req.params.id))); }
  catch (error) { return sendError(res, error); }
}

export async function downloadApplicationDocument(req: Request, res: Response) {
  try {
    const { document, content } = await service.downloadDocument(routeParam(req.params.id), routeParam(req.params.documentId));
    res.setHeader("Content-Type", document.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${document.fileName.replace(/"/g, "")}"`);
    return res.send(content);
  } catch (error) { return sendError(res, error); }
}

export async function updateApplicationProfile(req: Request, res: Response) {
  try { return res.json(await service.updateProfile(routeParam(req.params.id), req.body)); }
  catch (error) { return sendError(res, error); }
}

export async function setApplicantPassword(req: Request, res: Response) {
  try {
    await service.setPassword(req.body?.token, req.body?.password);
    return res.status(204).send();
  } catch (error) { return sendError(res, error); }
}

export async function acceptApplicant(req: Request, res: Response) {
  try {
    const reviewedById = (req as Request & { user?: { id: string } }).user?.id;
    return res.json(await service.acceptApplicant(routeParam(req.params.id), reviewedById));
  } catch (error) { return sendError(res, error); }
}

export async function rejectApplicant(req: Request, res: Response) {
  try {
    const reviewedById = (req as Request & { user?: { id: string } }).user?.id;
    return res.json(await service.rejectApplicant(
      routeParam(req.params.id), req.body?.rejectionReason, reviewedById,
    ));
  } catch (error) { return sendError(res, error); }
}

export async function reviewApplication(req: Request, res: Response) {
  try {
    const { status, interviewAt, interviewVenue, rejectionReason } = req.body ?? {};
    if (!["PENDING", "INTERVIEWEE", "ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Invalid application status" });
    }
    return res.json(await service.updateStatus(routeParam(req.params.id), {
      status, interviewAt, interviewVenue, rejectionReason,
      reviewedById: (req as Request & { user?: { id: string } }).user?.id,
    }));
  } catch (error) { return sendError(res, error); }
}
export class ApplicationController {
  static registerApplicant = createApplication;
  static trackApplication = trackApplication;
  static getPendingApplicants = getPendingApplications;
  static getApplicants = listApplications;
  static getApplicant = getApplication;
  static acceptApplicant = acceptApplicant;
  static rejectApplicant = rejectApplicant;
  static updateProfile = updateApplicationProfile;
  static setPassword = setApplicantPassword;
  static getDocuments = getApplicationDocuments;
  static downloadDocument = downloadApplicationDocument;
}
