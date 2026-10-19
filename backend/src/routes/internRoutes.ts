// Group A — interns, past interns, campuses, intakes and lookups (owner: Reason).
import { Router } from "express";
import { InternController } from "../controllers/InternController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

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
router.get("/interns", staff, InternController.getInterns);
router.get("/interns/filter", staff, InternController.filterInterns);
router.get("/interns/me", authenticated, InternController.getMyProfile); // intern's own profile
router.post("/interns", adminOnly, InternController.createIntern); // "Add intern"
router.get("/interns/:id", anyRole, ownershipCheck, InternController.getIntern);
router.put("/interns/:id", adminOrHandler, InternController.updateIntern);
router.put("/interns/:id/status", adminOrHandler, InternController.updateInternStatus); // ACTIVE / COMPLETED / WITHDRAWN
router.get("/interns/:id/projects", anyRole, ownershipCheck, InternController.getInternProjects); // current + previous
router.get("/interns/:id/cv", staff, InternController.downloadCv); // "View / download CV" button
router.get("/interns/:id/documents", adminOrHandler, InternController.getInternDocuments);

// ---- Past interns (archive of COMPLETED internships) ---------------------------------
router.get("/past-interns", adminOrHandler, InternController.getPastInterns);

// ---- Campuses & intakes ---------------------------------------------------------------
router.get("/campuses", staff, InternController.getCampuses);
router.post("/campuses", adminOnly, InternController.createCampus);
router.get("/campuses/:id", adminOrHandler, InternController.getCampus);
router.put("/campuses/:id", adminOnly, InternController.updateCampus);
router.get("/campuses/:id/interns", adminOrHandler, InternController.getCampusInterns); // ?intakeId=

router.get("/intakes", staff, InternController.getIntakes);
router.post("/intakes", adminOrHandler, InternController.createIntake);
router.put("/intakes/:id", adminOrHandler, InternController.updateIntake);

// ---- Lookups for filters and forms -------------------------------------------------------
router.get("/departments", authenticated, InternController.getDepartments);
router.get("/skills", authenticated, InternController.getSkills);

export default router;
