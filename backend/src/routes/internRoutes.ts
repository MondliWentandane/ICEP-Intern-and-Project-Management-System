// Group A — interns, past interns, campuses, intakes and lookups (owner: Reason).
import { Router, type Request, type Response } from "express";
import internController from "../controllers/InternController";
import { AuthMiddleware, notImplemented } from "./guards";

// Access guards (roles match the Prisma Role enum): verifyToken first, then the role check.
const authenticated = [AuthMiddleware.verifyToken];
const adminOnly = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN")];
const adminOrHandler = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "WIL_HANDLER")];
const staff = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "WIL_HANDLER", "MENTOR")]; // everyone except interns
const anyRole = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "WIL_HANDLER", "MENTOR", "INTERN")];
// Resource-level check: interns only reach their own data, mentors only their own projects / interns / tasks.
const ownershipCheck = AuthMiddleware.authorizationCheck;

const router = Router();

// ---- Interns ------------------------------------------------------------------
// Query: ?campusId= &intakeId= &department= &skills=a,b &status=interviewee|intern|past_intern &search=
// Mentors use skills/department to build teams (sequence diagram: GET /api/interns?skills=X&department=Y).
router.get("/interns", staff, (req: Request, res: Response) => internController.getAllInterns(req, res));
router.get("/interns/filter", staff, notImplemented("GET /interns/filter"));
router.get("/interns/me", authenticated, notImplemented("GET /interns/me")); // intern's own profile
router.post("/interns", adminOnly, notImplemented("POST /interns")); // "Add intern"
router.get("/interns/:id", anyRole, ownershipCheck, (req: Request, res: Response) => internController.getInternById(req, res));
router.put("/interns/:id", adminOrHandler, notImplemented("PUT /interns/:id"));
router.put("/interns/:id/status", adminOrHandler, (req: Request, res: Response) => internController.updateStatus(req, res)); // end (COMPLETED / RESIGNED / DISMISSED) or REINSTATE
router.get("/interns/:id/projects", anyRole, ownershipCheck, notImplemented("GET /interns/:id/projects")); // current + previous
router.get("/interns/:id/cv", staff, notImplemented("GET /interns/:id/cv")); // "View / download CV" button
router.get("/interns/:id/documents", adminOrHandler, notImplemented("GET /interns/:id/documents"));
// Staff can download an intern's documents; mentors only for interns they supervise (ownershipCheck).
router.get("/interns/:id/documents/:documentId/download", staff, ownershipCheck, (req: Request, res: Response) => internController.downloadDocument(req, res));

// ---- Past interns (archive of COMPLETED and WITHDRAWN internships) ------------------------
router.get("/past-interns", adminOrHandler, (req: Request, res: Response) => internController.getPastInterns(req, res));

// ---- Campuses & intakes ---------------------------------------------------------------
router.get("/campuses", staff, notImplemented("GET /campuses"));
router.post("/campuses", adminOnly, notImplemented("POST /campuses"));
router.get("/campuses/:id", adminOrHandler, notImplemented("GET /campuses/:id"));
router.put("/campuses/:id", adminOnly, notImplemented("PUT /campuses/:id"));
router.get("/campuses/:id/interns", adminOrHandler, notImplemented("GET /campuses/:id/interns")); // ?intakeId=

router.get("/intakes", staff, notImplemented("GET /intakes"));
router.post("/intakes", adminOrHandler, notImplemented("POST /intakes"));
router.put("/intakes/:id", adminOrHandler, notImplemented("PUT /intakes/:id"));

// ---- Lookups for filters and forms -------------------------------------------------------
router.get("/departments", authenticated, notImplemented("GET /departments"));
router.get("/skills", authenticated, notImplemented("GET /skills"));

export default router;
