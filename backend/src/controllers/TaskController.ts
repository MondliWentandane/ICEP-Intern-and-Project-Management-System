
import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/AuthMiddleware";
import { TaskService } from "../services/TaskService";


const handleTaskError = (res: Response, error: unknown): void => {
    const message = error instanceof Error
        ? error.message
        : "Unexpected task error";

    const status =
        message.includes("not found") ||
        message.includes("not found") ||
        message.includes("not found") ||
        message === "Parent task not found"
            ? 404
            : message.includes("Permission denied") ||
              message.includes("not authorized")
                ? 403
                : message === "Unexpected task error"
                    ? 500
                    : 400;

    res.status(status).json({ message });
};

export class TaskController {

    static async createTask(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {

        try {
            // Get the authenticated mentor/admin ID
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    message: "Authentication required"
                });
                return;
            }

            // Get task details from the frontend
            const {
                title,
                projectId,
                description,
                assignedToId,
                priority,
                status,
                startDate,
                dueDate
            } = req.body;

            // Ask TaskService to create the task
            const task = await TaskService.createTask({
    title,
    projectId,
    description,
    assignedToId,
    priority,
    status,
    startDate,
    dueDate,
    createdById: userId
}, req.user!);

            // Send the created task to the frontend
            res.status(201).json({
                message: "Task created successfully",
                task
            });

        } catch (error) {
            console.error("Create task error:", error);
            handleTaskError(res, error);
        }
    }
    
static async getTask(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                message: "Authentication required"
            });
            return;
        }

       const taskId = req.params.id;

if (typeof taskId !== "string" || !taskId.trim()) {
    res.status(400).json({
        message: "Valid task ID is required"
    });
    return;
}

const task = await TaskService.getTask(
    taskId,
    req.user
);

        res.status(200).json({
            message: "Task retrieved successfully",
            task
        });

    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Unable to retrieve task";

        const status =
            message === "Task not found" ? 404 :
            message === "Permission denied" ||
            message.includes("not authorized") ? 403 : 500;

        res.status(status).json({ message });
    }
}


    static async getTasks(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required"
                });
                return;
            }

            const tasks = await TaskService.getTasks(req.user);
            res.status(200).json({ tasks });

        } catch (error) {
            res.status(403).json({
                message: error instanceof Error
                    ? error.message
                    : "Unable to retrieve tasks"
            });
        }
    }

    static async getProjectTasks(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required"
                });
                return;
            }

            const projectId = req.params.id;

            if (typeof projectId !== "string") {
                res.status(400).json({
                    message: "Valid project ID is required"
                });
                return;
            }

            const tasks = await TaskService.getProjectTasks(
                projectId,
                req.user
            );

            res.status(200).json({ tasks });

        } catch (error) {
            res.status(403).json({
                message: error instanceof Error
                    ? error.message
                    : "Unable to retrieve project tasks"
            });
        }
    }

    static async getReviewQueue(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required"
                });
                return;
            }

            const tasks = await TaskService.getReviewQueue(req.user);

            res.status(200).json({ tasks });

        } catch (error) {
            res.status(403).json({
                message: error instanceof Error
                    ? error.message
                    : "Unable to retrieve review queue"
            });
        }
    }
    
    
    static async updateTask(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string") {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const task = await TaskService.updateTask(
                id,
                req.body,
                req.user
            );

            res.status(200).json({
                message: "Task updated successfully",
                task
            });
        } catch (error) {
            res.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Unable to update task"
            });
        }
    }

    static async deleteTask(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string") {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            await TaskService.deleteTask(id, req.user);

            res.status(200).json({
                message: "Task deleted successfully"
            });
        } catch (error) {
            res.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Unable to delete task"
            });
        }
    }

    static async updateTaskStatus(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string") {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const task = await TaskService.updateTaskStatus(
                id,
                req.body.status,
                req.user,
                req.body.blockedReason
            );

            res.status(200).json({
                message: "Task status updated successfully",
                task
            });
        } catch (error) {
            res.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Unable to update task status"
            });
        }
    }

    
    static async getGanttData(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required"
                });
                return;
            }

            const projectId = req.params.id;

            if (typeof projectId !== "string" || !projectId.trim()) {
                res.status(400).json({
                    message: "Valid project ID is required"
                });
                return;
            }

            const tasks = await TaskService.getGanttData(
                projectId,
                req.user
            );

            res.status(200).json({ tasks });

        } catch (error) {
            res.status(500).json({
                message: error instanceof Error
                    ? error.message
                    : "Unable to retrieve Gantt data"
            });
        }
    }

    static async getCalendarEvents(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required"
                });
                return;
            }

            const events = await TaskService.getCalendarEvents(
                req.user
            );

            res.status(200).json({ events });

        } catch (error) {
            res.status(500).json({
                message: error instanceof Error
                    ? error.message
                    : "Unable to retrieve calendar events"
            });
        }
    }

    
    static async assignTo(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string" || !id.trim()) {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const internId = req.body?.internId;

            if (internId !== null && typeof internId !== "string") {
                res.status(400).json({
                    message: "internId must be a string or null"
                });
                return;
            }

            const task = await TaskService.assignTo(
                id,
                internId,
                req.user
            );

            res.status(200).json({
                message: "Task assignment updated",
                task
            });
        } catch (error) {
            handleTaskError(res, error);
        }
    }

    static async approveTask(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string" || !id.trim()) {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const task = await TaskService.approveTask(
                id,
                req.user
            );

            res.status(200).json({
                message: "Task approved successfully",
                task
            });
        } catch (error) {
            handleTaskError(res, error);
        }
    }

    static async requestTaskChanges(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;
            if (typeof id !== "string" || !id.trim()) {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const task = await TaskService.requestTaskChanges(
                id,
                req.body?.feedback,
                req.user
            );

            res.status(200).json({
                message: "Task returned with feedback",
                task
            });
        } catch (error) {
            handleTaskError(res, error);
        }
    }

    static async getSubtasks(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string" || !id.trim()) {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const subtasks = await TaskService.getSubtasks(
                id,
                req.user
            );

            res.status(200).json({ subtasks });
        } catch (error) {
            handleTaskError(res, error);
        }
    }

    static async createSubtask(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string" || !id.trim()) {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const subtask = await TaskService.createSubtask(
                id,
                req.body,
                req.user
            );

            res.status(201).json({
                message: "Subtask created successfully",
                subtask
            });
        } catch (error) {
            handleTaskError(res, error);
        }
    }

    static async getComments(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string" || !id.trim()) {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const comments = await TaskService.getComments(
                id,
                req.user
            );

            res.status(200).json({ comments });
        } catch (error) {
            handleTaskError(res, error);
        }
    }

    static async addComment(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const id = req.params.id;

            if (typeof id !== "string" || !id.trim()) {
                res.status(400).json({ message: "Invalid task ID" });
                return;
            }

            const comment = await TaskService.addComment(
                id,
                req.body?.body,
                req.user
            );

            res.status(201).json({
                message: "Comment added successfully",
                comment
            });
        } catch (error) {
            handleTaskError(res, error);
        }
    }

}
