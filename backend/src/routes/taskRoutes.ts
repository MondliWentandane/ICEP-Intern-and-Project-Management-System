// Group B — tasks: Kanban board, Gantt, Calendar and approval (owner: Mash).
// Interns are read-only; mentors (and admins) create, assign, update and approve.
import { Router } from "express";
import { TaskController } from "../controllers/TaskController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

// Access guards (roles match the Prisma Role enum): verifyToken first, then the role check.
const adminOrMentor = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "MENTOR")];
const anyRole = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN", "WIL_HANDLER", "MENTOR", "INTERN")];
// Resource-level check: interns only reach their own data, mentors only their own projects / interns / tasks.
const ownershipCheck = AuthMiddleware.authorizationCheck;

const router = Router();

// ---- Project views (Kanban / Gantt) -----------------------------------------------------
router.get("/projects/:id/tasks", anyRole, ownershipCheck, TaskController.getProjectTasks); // Kanban + subtasks
router.get("/projects/:id/gantt", anyRole, ownershipCheck, TaskController.getGanttData); // start/end per task

// ---- Calendar: saved tasks with start/due date + time ---------------------------------------
router.get("/calendar", anyRole, TaskController.getCalendarEvents); // ?projectId= &from= &to=

// ---- Tasks ----------------------------------------------------------------------------------
// Query: ?projectId= &status=TODO|IN_PROGRESS|COMPLETED &assignedTo= &category=
router.get("/tasks", anyRole, TaskController.getTasks);
router.post("/tasks", adminOrMentor, ownershipCheck, TaskController.createTask);
router.get("/tasks/review", adminOrMentor, TaskController.getReviewQueue); // completed, awaiting approval
router.get("/tasks/:id", anyRole, ownershipCheck, TaskController.getTask);
router.put("/tasks/:id", adminOrMentor, ownershipCheck, TaskController.updateTask);
router.delete("/tasks/:id", adminOrMentor, ownershipCheck, TaskController.deleteTask);

router.put("/tasks/:id/status", adminOrMentor, ownershipCheck, TaskController.updateTaskStatus); // TODO / IN_PROGRESS / COMPLETED
router.put("/tasks/:id/assign", adminOrMentor, ownershipCheck, TaskController.assignTo);
router.put("/tasks/:id/approve", adminOrMentor, ownershipCheck, TaskController.approveTask); // sends task-approval notification

// ---- Subtasks (e.g. Task: Front-end development -> Subtask: UI/UX design) ----------------------
router.get("/tasks/:id/subtasks", anyRole, ownershipCheck, TaskController.getSubtasks);
router.post("/tasks/:id/subtasks", adminOrMentor, ownershipCheck, TaskController.createSubtask);

// ---- Progress updates and feedback ------------------------------------------------------------------
router.get("/tasks/:id/comments", anyRole, ownershipCheck, TaskController.getComments);
router.post("/tasks/:id/comments", anyRole, ownershipCheck, TaskController.addComment);

export default router;
