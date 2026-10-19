// Group B — projects, teams, dashboards and reports (owner: Tshepiso).
// Task-related project paths (/projects/:id/tasks, /projects/:id/gantt) live in taskRoutes.ts.
import { Router } from "express";
import { ProjectController } from "../controllers/ProjectController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

// Access guards (roles match the Prisma Role enum): verifyToken first, then the role check.
const authenticated = [AuthMiddleware.verifyToken];
const adminOnly = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN")];
const adminOrMentor = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "MENTOR")];
const staff = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "WIL_HANDLER", "MENTOR")]; // everyone except interns
const anyRole = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "WIL_HANDLER", "MENTOR", "INTERN")];
// Resource-level check: interns only reach their own data, mentors only their own projects / interns / tasks.
const ownershipCheck = AuthMiddleware.authorizationCheck;

const router = Router();

// ---- Projects ---------------------------------------------------------------------
// Query: ?department= &status=PLANNED|IN_PROGRESS|COMPLETED|ON_HOLD &search=
// Admin sees all; mentors see theirs; interns see the project they are assigned to.
router.get("/projects", anyRole, ProjectController.getProjects);
router.post("/projects", adminOrMentor, ProjectController.createProject);
router.get("/projects/me", authenticated, ProjectController.getMyProject); // intern "My Project" page
// Team builder: filter interns (GET /interns/filter), then group them and assign to the project.
router.post("/projects/assign", adminOrMentor, ProjectController.assignInterns); // body: { projectId, internIds[] }
router.get("/projects/:id", anyRole, ownershipCheck, ProjectController.getProject);
router.put("/projects/:id", adminOrMentor, ownershipCheck, ProjectController.updateProject);
router.put("/projects/:id/status", adminOrMentor, ownershipCheck, ProjectController.updateProjectStatus);
router.delete("/projects/:id", adminOnly, ProjectController.deleteProject);

// ---- Project team (members + their roles) ---------------------------------------------
router.get("/projects/:id/members", anyRole, ownershipCheck, ProjectController.getMembers);
router.post("/projects/:id/members", adminOrMentor, ownershipCheck, ProjectController.assignInterns);
router.put("/projects/:id/members/:internId", adminOrMentor, ownershipCheck, ProjectController.updateMemberRole);
router.delete("/projects/:id/members/:internId", adminOrMentor, ownershipCheck, ProjectController.removeIntern);

// ---- Mentors (supervisor dropdown) -------------------------------------------------------
router.get("/mentors", staff, ProjectController.getMentors);

// ---- Dashboards & reports --------------------------------------------------------------------
// The summary returned depends on the caller's role (admin / handler / mentor); :id is an optional role key.
router.get("/dashboards", staff, ProjectController.getDashboard);
router.get("/dashboards/:id", staff, ProjectController.getDashboard);
// Interns, intakes, projects, assignments, progress. Query: ?from= &to= &campusId=
router.get("/reports", adminOnly, ProjectController.getReports);
router.get("/reports/export", adminOnly, ProjectController.exportReport); // ?format=pdf|xlsx|csv

export default router;
