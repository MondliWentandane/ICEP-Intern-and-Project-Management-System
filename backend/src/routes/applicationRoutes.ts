// Group A — applicant approval & onboarding (owner: Tshephang), plus Group A emails & notifications (owner: Siphesihle).
// Flow: Apply (PENDING) -> optional interview -> Accept (intern created + password-link email) or Reject.
import { Router } from "express";
import { ApplicationController, reviewApplication } from "../controllers/ApplicationController";
import multer, { type FileFilterCallback } from "multer";
import type { NextFunction, Request, Response } from "express";
import { EmailController } from "../controllers/EmailController";
import { getPosition, listOpenPositions } from "../controllers/PositionController";
import { AuthMiddleware, notImplemented } from "./guards";

// Access guards (roles match the Prisma Role enum): verifyToken first, then the role check.
const authenticated = [AuthMiddleware.verifyToken];
const adminOnly = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN")];
const adminOrHandler = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "WIL_HANDLER")];
const staff = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "WIL_HANDLER", "MENTOR")]; // everyone except interns

// ---- Application form uploads (PDF only, max 5 MB each, same as the frontend) -------------------
// Requires:  npm install multer   and   npm install -D @types/multer
// Field names match the frontend FormData keys; files arrive in memory (req.files) for Supabase Storage.
const pdfOnly = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
  if (isPdf) cb(null, true);
  else cb(new Error("Only PDF files are allowed."));
};
const parseApplicationUploads = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: pdfOnly,
}).fields([
  { name: "cv", maxCount: 1 },
  { name: "idDocument", maxCount: 1 },
  { name: "academicRecord", maxCount: 1 },
]);
// Upload problems (not a PDF, bigger than 5 MB, unknown field) answer 400 JSON instead of an HTML 500 page.
const applicationUploads = (req: Request, res: Response, next: NextFunction) => {
  parseApplicationUploads(req, res, (error: unknown) => {
    if (!error) return next();
    const code = (error as { code?: string }).code;
    const message = code === "LIMIT_FILE_SIZE" ? "Each file must be 5 MB or smaller."
      : code === "LIMIT_UNEXPECTED_FILE" ? "Unexpected file field in the upload."
      : (error as Error).message || "The upload could not be read.";
    res.status(400).json({ error: message });
  });
};

// "Schedule interview" = status change to INTERVIEWEE; reuses the controller's reviewApplication.
const asInterview = (req: Request, _res: Response, next: NextFunction) => {
  req.body = { ...(req.body ?? {}), status: "INTERVIEWEE" };
  next();
};

const router = Router();

// ---- Public: careers page + application form --------------------------------
router.get("/positions", listOpenPositions); // only OPEN positions
router.get("/positions/manage", adminOrHandler, notImplemented("GET /positions/manage")); // incl. DRAFT / CLOSED
router.get("/positions/:id", getPosition);

// Multipart form (fields + cv, idDocument, academicRecord). Creates the application as PENDING.
// /applications is what the frontend calls; /register is the path in the sequence diagram.
router.post("/applications", applicationUploads, ApplicationController.registerApplicant);
router.post("/register", applicationUploads, ApplicationController.registerApplicant);

// "View Application Status": applicant looks up with email + reference (no account needed).
router.post("/applications/track", notImplemented("POST /applications/track"));
router.post("/applications/track/link", notImplemented("POST /applications/track/link"));

// ---- Careers management (Admin / WIL Handler) ---------------------------------
router.post("/positions", adminOrHandler, notImplemented("POST /positions"));
router.put("/positions/:id", adminOrHandler, notImplemented("PUT /positions/:id"));
router.put("/positions/:id/status", adminOrHandler, notImplemented("PUT /positions/:id/status")); // DRAFT / OPEN / CLOSED

// ---- Applicants queue (Admin / WIL Handler) -----------------------------------
// Query: ?status=PENDING|INTERVIEWEE|ACCEPTED|REJECTED &campusId= &positionId= &search= &page= &limit=
router.get("/applicants", adminOrHandler, ApplicationController.getApplicants);
router.get("/applicants/pending", adminOrHandler, ApplicationController.getPendingApplicants);
router.post("/applicants", adminOrHandler, applicationUploads, ApplicationController.registerApplicant); // "Add applicant"
router.get("/applicants/:id", adminOrHandler, ApplicationController.getApplicant);
router.get("/applicants/:id/documents", adminOrHandler, ApplicationController.getDocuments);
router.get("/applicants/:id/documents/:documentId/download", adminOrHandler, ApplicationController.downloadDocument);
router.put("/applicants/:id/interview", adminOrHandler, asInterview, reviewApplication);
router.put("/applicants/:id/accept", adminOrHandler, ApplicationController.acceptApplicant);
router.put("/applicants/:id/reject", adminOrHandler, ApplicationController.rejectApplicant);

// ============================================================================================
// Emails (Outlook), in-app notifications and contact form — EmailController (owner: Siphesihle)
// Group A emails: acceptance, rejection, password link. Group B emails (project / task notifications)
// are sent by ProjectService / TaskService through EmailService -> OutlookService, not by these routes.
// ============================================================================================
router.post("/contact", EmailController.sendContactMessage); // public contact form

// In-app notifications (bell icon, "Notifications" page)
router.get("/notifications", authenticated, EmailController.getNotifications); // the caller's own
router.put("/notifications/read-all", authenticated, EmailController.markAllNotificationsRead);
router.put("/notifications/:id/read", authenticated, EmailController.markNotificationRead);

// Email templates ("Notifications / Emails" page)
router.get("/email-templates", staff, EmailController.getEmailTemplates);
router.get("/email-templates/:id", staff, EmailController.getEmailTemplate);
router.put("/email-templates/:id", adminOrHandler, EmailController.updateEmailTemplate);

// Sending (normally triggered by accept / reject; exposed for manual resend)
router.post("/emails/acceptance/:applicationId", adminOrHandler, EmailController.sendAcceptanceEmail); // includes set-password link
router.post("/emails/rejection/:applicationId", adminOrHandler, EmailController.sendRejectionEmail);
router.post("/emails/password-link", adminOrHandler, EmailController.sendPasswordLink); // body: { email }
router.get("/emails/logs", adminOnly, EmailController.getEmailLogs);

export default router;
