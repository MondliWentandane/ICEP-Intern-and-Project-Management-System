
import { Router } from "express";
import { TaskController } from "../controllers/TaskController";
import {
    authenticateToken,
    authorizeRoles
} from "../middlewares/AuthMiddleware";

// Only administrators and mentors can manage tasks
const adminOrMentor = [
    authenticateToken,
    authorizeRoles("ADMIN", "MENTOR")
];

// All authenticated roles can access permitted task information
const anyRole = [
    authenticateToken,
    authorizeRoles("ADMIN", "WIL_HANDLER", "MENTOR", "INTERN")
];

const router = Router();

// ================= PROJECT VIEWS =================

// Kanban board
router.get(
    "/projects/:id/tasks",
    anyRole,
    TaskController.getProjectTasks
);

// Gantt chart
router.get(
    "/projects/:id/gantt",
    anyRole,
    TaskController.getGanttData
);

// ================= CALENDAR =================

router.get(
    "/calendar",
    anyRole,
    TaskController.getCalendarEvents
);

// ================= TASKS =================

// Get tasks
router.get(
    "/tasks",
    anyRole,
    TaskController.getTasks
);

// Create task
router.post("/tasks", anyRole, TaskController.createTask);

// Completed tasks waiting for approval
router.get(
    "/tasks/review",
    adminOrMentor,
    TaskController.getReviewQueue
);

// Get a specific task
router.get(
    "/tasks/:id",
    anyRole,
    TaskController.getTask
);

// Update task
router.put("/tasks/:id", anyRole, TaskController.updateTask);

// Delete task
router.delete("/tasks/:id", anyRole, TaskController.deleteTask);

// Update task status
router.put("/tasks/:id/status", anyRole, TaskController.updateTaskStatus);

// Assign task to an intern
router.put("/tasks/:id/assign", anyRole, TaskController.assignTo);

// Approve completed task
router.put("/tasks/:id/approve", anyRole, TaskController.approveTask);

// ================= SUBTASKS =================

// Get subtasks
router.get(
    "/tasks/:id/subtasks",
    anyRole,
    TaskController.getSubtasks
);

// Create subtask
router.post("/tasks/:id/subtasks", anyRole, TaskController.createSubtask);

// ================= COMMENTS =================

// Get comments
router.get(
    "/tasks/:id/comments",
    anyRole,
    TaskController.getComments
);

// Add comment
router.post(
    "/tasks/:id/comments",
    anyRole,
    TaskController.addComment
);

export default router;
