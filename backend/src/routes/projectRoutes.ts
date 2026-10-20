// Group B — projects, teams, dashboards and reports (owner: Tshepiso).
// Task-related project paths (/projects/:id/tasks, /projects/:id/gantt) live in taskRoutes.ts.
import { Router } from "express";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignProjectMember,
  removeProjectMember,
} from "../controllers/ProjectController";
import { AuthMiddleware, notImplemented } from "./guards";

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
router.get("/projects", anyRole, listProjects);
router.post("/projects", adminOrMentor, createProject);
router.get("/projects/me", authenticated, notImplemented("GET /projects/me")); // intern "My Project" page
// Team builder: filter interns (GET /interns/filter), then group them and assign to the project.
router.post("/projects/assign", adminOrMentor, notImplemented("POST /projects/assign")); // body: { projectId, internIds[] }
router.get("/projects/:id", anyRole, ownershipCheck, getProject);
router.put("/projects/:id", adminOrMentor, ownershipCheck, updateProject);
router.put("/projects/:id/status", adminOrMentor, ownershipCheck, updateProject);
router.delete("/projects/:id", adminOnly, deleteProject);

// ---- Project team (members + their roles) ---------------------------------------------
router.get("/projects/:id/members", anyRole, ownershipCheck, notImplemented("GET /projects/:id/members"));
router.post("/projects/:id/members", adminOrMentor, ownershipCheck, assignProjectMember);
router.put("/projects/:id/members/:internId", adminOrMentor, ownershipCheck, notImplemented("PUT /projects/:id/members/:internId"));
router.delete("/projects/:id/members/:internId", adminOrMentor, ownershipCheck, removeProjectMember);

// ---- Mentors (supervisor dropdown) -------------------------------------------------------
router.get("/mentors", staff, notImplemented("GET /mentors"));

// ---- Dashboards & reports --------------------------------------------------------------------
// The summary returned depends on the caller's role (admin / handler / mentor); :id is an optional role key.
router.get("/dashboards", staff, notImplemented("GET /dashboards"));
router.get("/dashboards/:id", staff, notImplemented("GET /dashboards/:id"));
// Interns, intakes, projects, assignments, progress. Query: ?from= &to= &campusId=
router.get("/reports", adminOnly, notImplemented("GET /reports"));
router.get("/reports/export", adminOnly, notImplemented("GET /reports/export")); // ?format=pdf|xlsx|csv

export default router;
