
import { TaskRepository } from "../repositories/TaskRepository";
import { notificationService } from "./NotificationService";

type TaskUser = {
    id: string;
    role: string;
};

export class TaskService {

    // Check whether a user can manage a project
    static async checkProjectAccess(
        projectId: string,
        user: TaskUser
    ) {
        const project = await TaskRepository.getProject(projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        // Admins may manage any project
        if (user.role === "ADMIN") {
            return project;
        }

        if (user.role !== "MENTOR") {
            throw new Error("Permission denied");
        }

        // Find the mentor record linked to this user
        const mentor = await TaskRepository.getMentorByUserId(user.id);

        if (!mentor || project.supervisorId !== mentor.id) {
            throw new Error("You are not authorized to manage this project");
        }

        return project;
    }

    // Create a new task
    static async createTask(data: {
        title: string;
        projectId: string;
        description?: string;
        assignedToId?: string;
        createdById: string;
    }, user: TaskUser) {

        if (typeof data.title !== "string" || !data.title.trim()) {
            throw new Error("Task title is required");
        }

        if (typeof data.projectId !== "string" || !data.projectId.trim()) {
            throw new Error("Project ID is required");
        }

        await this.checkProjectAccess(data.projectId, user);

        // Verify the assigned intern belongs to the project
        if (data.assignedToId) {
            const intern = await TaskRepository.getIntern(data.assignedToId);

            if (!intern) {
                throw new Error("Assigned intern not found");
            }

            const assignment = await TaskRepository.getProjectAssignment(
                data.projectId,
                data.assignedToId
            );

            if (!assignment || assignment.leftAt !== null) {
                throw new Error("Intern is not actively assigned to this project");
            }
        }

        const task = await TaskRepository.createTask({
            title: data.title.trim(),
            projectId: data.projectId,
            description: data.description,
            assignedToId: data.assignedToId,
            createdById: user.id
        });
        if (data.assignedToId) await notificationService.taskAssigned(task.id);
        return task;
    }

    
    // Retrieve a task with authorization
    static async getTask(id: string, user: TaskUser) {

        const task = await TaskRepository.getTask(id);

        if (!task) {
            throw new Error("Task not found");
        }

        // Admins can access any task
        if (user.role === "ADMIN") {
            return task;
        }

        // Mentors must supervise the task's project
        if (user.role === "MENTOR") {
            await this.checkProjectAccess(task.projectId, user);
            return task;
        }

        // Interns may view tasks assigned to them
        if (user.role === "INTERN") {
            const intern = await TaskRepository.getInternByUserId(user.id);

            if (!intern || task.assignedToId !== intern.id) {
                throw new Error("Permission denied");
            }

            return task;
        }

        throw new Error("Permission denied");
    }
 
     
    // Retrieve all tasks visible to a user
    static async getTasks(user: TaskUser) {
        if (user.role === "ADMIN") {
            return TaskRepository.getTasks();
        }

        if (user.role === "MENTOR") {
            const mentor = await TaskRepository.getMentorByUserId(user.id);

            if (!mentor) {
                throw new Error("Permission denied");
            }

            return TaskRepository.getTasks({
                project: {
                    supervisorId: mentor.id
                }
            });
        }

        if (user.role === "INTERN") {
            const intern = await TaskRepository.getInternByUserId(user.id);

            if (!intern) {
                throw new Error("Permission denied");
            }

            return TaskRepository.getTasks({
                assignedToId: intern.id
            });
        }

        throw new Error("Permission denied");
    }

    // Retrieve tasks for a particular project
    static async getProjectTasks(
        projectId: string,
        user: TaskUser
    ) {
        if (user.role === "ADMIN" || user.role === "MENTOR") {
            await this.checkProjectAccess(projectId, user);
            return TaskRepository.getProjectTasks(projectId);
        }

        if (user.role === "INTERN") {
            const intern = await TaskRepository.getInternByUserId(user.id);

            if (!intern) {
                throw new Error("Permission denied");
            }

            const assignment =
                await TaskRepository.getProjectAssignment(
                    projectId,
                    intern.id
                );

            if (!assignment || assignment.leftAt !== null) {
                throw new Error("Permission denied");
            }

            return TaskRepository.getTasks({
                projectId,
                assignedToId: intern.id
            });
        }

        throw new Error("Permission denied");
    }

    // Retrieve completed tasks waiting for approval
    static async getReviewQueue(user: TaskUser) {
        if (user.role === "ADMIN") {
            return TaskRepository.getReviewQueue();
        }

        if (user.role === "MENTOR") {
            const mentor = await TaskRepository.getMentorByUserId(user.id);

            if (!mentor) {
                throw new Error("Permission denied");
            }

            return TaskRepository.getTasks({
                status: "COMPLETED",
                approvedAt: null,
                project: {
                    supervisorId: mentor.id
                }
            });
        }

        throw new Error("Permission denied");
    }
   
    static async updateTask(
        id: string,
        data: {
            title?: string;
            description?: string;
            priority?: "LOW" | "MEDIUM" | "HIGH";
            progress?: number;
        },
        user: TaskUser
    ) {
        const task = await TaskRepository.getTask(id);

        if (!task) {
            throw new Error("Task not found");
        }

        await this.checkProjectAccess(task.projectId, user);

        if (data.title !== undefined &&
            (typeof data.title !== "string" || !data.title.trim())) {
            throw new Error("Task title is required");
        }

        if (data.progress !== undefined &&
            (!Number.isInteger(data.progress) ||
             data.progress < 0 ||
             data.progress > 100)) {
            throw new Error("Progress must be between 0 and 100");
        }

        return TaskRepository.updateTask(id, {
            ...(data.title !== undefined && {
                title: data.title.trim()
            }),
            ...(data.description !== undefined && {
                description: data.description
            }),
            ...(data.priority !== undefined && {
                priority: data.priority
            }),
            ...(data.progress !== undefined && {
                progress: data.progress
            })
        });
    }

    static async deleteTask(id: string, user: TaskUser) {
        const task = await TaskRepository.getTask(id);

        if (!task) {
            throw new Error("Task not found");
        }

        await this.checkProjectAccess(task.projectId, user);

        return TaskRepository.deleteTask(id);
    }

    static async updateTaskStatus(
        id: string,
        status: "TODO" | "IN_PROGRESS" | "COMPLETED",
        user: TaskUser
    ) {
        const task = await TaskRepository.getTask(id);

        if (!task) {
            throw new Error("Task not found");
        }

        await this.checkProjectAccess(task.projectId, user);

        if (!["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)) {
            throw new Error("Invalid task status");
        }

        const updated = await TaskRepository.updateTaskStatus(id, status);
        // An intern finishing their task asks the supervising mentor to review it.
        if (status === "COMPLETED" && task.status !== "COMPLETED" && user.role === "INTERN") {
            await notificationService.taskSubmitted(id);
        }
        return updated;
    }
    
    
    // Gantt chart data for a project
    static async getGanttData(
        projectId: string,
        user: TaskUser
    ) {
        const tasks = await this.getProjectTasks(projectId, user);

        return tasks.map(task => ({
            id: task.id,
            title: task.title,
            startDate: task.startDate,
            endDate: task.dueDate,
            progress: task.progress,
            status: task.status,
            parentId: task.parentId
        }));
    }

    // Calendar events from tasks visible to the user
    static async getCalendarEvents(user: TaskUser) {
        const tasks = await this.getTasks(user);

        return tasks
            .filter(task => task.startDate || task.dueDate)
            .map(task => ({
                id: task.id,
                title: task.title,
                projectId: task.projectId,
                startDate: task.startDate,
                dueDate: task.dueDate,
                status: task.status
            }));
    }
   
    
    // Assign or unassign an intern
    static async assignTo(
        id: string,
        internId: string | null,
        user: TaskUser
    ) {
        const task = await TaskRepository.getTask(id);

        if (!task) {
            throw new Error("Task not found");
        }

        await this.checkProjectAccess(task.projectId, user);

        if (internId !== null) {
            if (typeof internId !== "string" || !internId.trim()) {
                throw new Error("Invalid intern ID");
            }

            const intern = await TaskRepository.getIntern(internId);

            if (!intern) {
                throw new Error("Intern not found");
            }

            const assignment =
                await TaskRepository.getProjectAssignment(
                    task.projectId,
                    internId
                );

            if (!assignment || assignment.leftAt !== null) {
                throw new Error(
                    "Intern is not actively assigned to this project"
                );
            }
        }

        const assigned = await TaskRepository.assignTask(id, internId);
        if (internId) await notificationService.taskAssigned(id);
        return assigned;
    }

    // Approve a completed task
    static async approveTask(id: string, user: TaskUser) {
        const task = await TaskRepository.getTask(id);

        if (!task) {
            throw new Error("Task not found");
        }

        await this.checkProjectAccess(task.projectId, user);

        if (task.status !== "COMPLETED") {
            throw new Error(
                "Only completed tasks can be approved"
            );
        }

        if (task.approvedAt) {
            throw new Error("Task already approved");
        }

        const approved = await TaskRepository.approveTask(id, user.id);
        await notificationService.taskApproved(id);
        return approved;
    }

    // Retrieve subtasks
    static async getSubtasks(id: string, user: TaskUser) {
        await this.getTask(id, user);

        const subtasks = await TaskRepository.getSubtasks(id);

        if (user.role === "INTERN") {
            const intern =
                await TaskRepository.getInternByUserId(user.id);

            return subtasks.filter(
                task => task.assignedToId === intern?.id
            );
        }

        return subtasks;
    }

    // Create a subtask
    static async createSubtask(
        parentId: string,
        data: {
            title: string;
            description?: string;
        },
        user: TaskUser
    ) {
        const parent = await TaskRepository.getTask(parentId);

        if (!parent) {
            throw new Error("Parent task not found");
        }

        await this.checkProjectAccess(parent.projectId, user);

        if (typeof data?.title !== "string" ||
            !data.title.trim()) {
            throw new Error("Subtask title is required");
        }

        if (data.description !== undefined &&
            typeof data.description !== "string") {
            throw new Error("Invalid description");
        }

        return TaskRepository.createTask({
            title: data.title.trim(),
            description: data.description,
            projectId: parent.projectId,
            parentId,
            createdById: user.id
        });
    }

    // Retrieve comments
    static async getComments(id: string, user: TaskUser) {
        await this.getTask(id, user);

        return TaskRepository.getComments(id);
    }

    // Add a comment
    static async addComment(
        id: string,
        body: string,
        user: TaskUser
    ) {
        await this.getTask(id, user);

        if (typeof body !== "string" || !body.trim()) {
            throw new Error("Comment cannot be empty");
        }

        return TaskRepository.addComment(
            id,
            user.id,
            body.trim()
        );
    }

    
}
