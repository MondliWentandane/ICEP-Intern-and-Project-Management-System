import { TaskStatus } from "@prisma/client";
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

        if (user.role === "MENTOR") {
            const mentor = await TaskRepository.getMentorByUserId(user.id);
            if (!mentor || project.supervisorId !== mentor.id) {
                throw new Error("You are not authorized to manage this project");
            }
            return project;
        }

        // ENFORCE SCRUM MASTER RULE
        if (user.role === "INTERN") {
            const intern = await TaskRepository.getInternByUserId(user.id);
            if (!intern) throw new Error("Permission denied");

            const assignment = await TaskRepository.getProjectAssignment(projectId, intern.id);

            // The intern must be on the team AND have the Scrum Master role
            if (!assignment || assignment.leftAt !== null || assignment.projectRole !== "Scrum Master") {
                throw new Error("You must be the designated Scrum Master to manage tasks for this project.");
            }
            return project;
        }

        throw new Error("Permission denied");
    }

    // Create a new task
    static async createTask(data: {
        title: string;
        projectId: string;
        description?: string | null;
        priority?: "LOW" | "MEDIUM" | "HIGH";
        status?: TaskStatus;
        startDate?: string | Date | null;
        dueDate?: string | Date | null;
        assignedToId?: string | null;
        position?: number;
        createdById: string;
    }, user: TaskUser) {

        if (typeof data.title !== "string" || !data.title.trim()) {
            throw new Error("Task title is required");
        }

        if (typeof data.projectId !== "string" || !data.projectId.trim()) {
            throw new Error("Project ID is required");
        }

        if (data.priority !== undefined &&
            !["LOW", "MEDIUM", "HIGH"].includes(data.priority)) {
            throw new Error("Invalid task priority");
        }

        const parseOptionalDate = (value: string | Date | null | undefined, label: string) => {
            if (value == null || value === "") return null;
            const parsed = value instanceof Date ? value : new Date(value);
            if (Number.isNaN(parsed.getTime())) throw new Error(label + " must be a valid date");
            return parsed;
        };
        const startDate = parseOptionalDate(data.startDate, "Start date");
        const dueDate = parseOptionalDate(data.dueDate, "Due date");

        if (startDate && dueDate && dueDate < startDate) {
            throw new Error("Due date must be on or after the start date");
        }
        if (data.status && !Object.values(TaskStatus).includes(data.status)) {
            throw new Error("Invalid task status");
        }
        if (data.position !== undefined && (!Number.isInteger(data.position) || data.position < 0)) {
            throw new Error("Task order must be a non-negative integer");
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

        const taskCount = await TaskRepository.countProjectTasks(data.projectId);
        const position = Math.min(data.position ?? taskCount, taskCount);
        const task = await TaskRepository.createTask({
            title: data.title.trim(),
            projectId: data.projectId,
            description: data.description,
            priority: data.priority,
            status: data.status ?? TaskStatus.TODO,
            startDate,
            dueDate,
            assignedToId: data.assignedToId || null,
            position,
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

            const tasks = await TaskRepository.getInternBoardTasks(intern.id);
            return tasks.map(task => ({
                ...task,
                canUpdateStatus:
                    task.assignedToId === intern.id &&
                    task.project.status !== "COMPLETED" &&
                    task.status !== "COMPLETED"
            }));
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

            // Return ALL project tasks so the intern can see the team's progress
            return TaskRepository.getProjectTasks(projectId);
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

        if (user.role === "INTERN") {
            const intern = await TaskRepository.getInternByUserId(user.id);
            if (!intern) throw new Error("Permission denied");
            return TaskRepository.getTasks({
                status: "COMPLETED",
                approvedAt: null,
                project: {
                    assignments: {
                        some: { internId: intern.id, projectRole: "Scrum Master", leftAt: null }
                    }
                }
            });
        }

        throw new Error("Permission denied");
    }

    static async updateTask(
        id: string,
        data: {
            title?: string;
            description?: string | null;
            priority?: "LOW" | "MEDIUM" | "HIGH";
            progress?: number;
            startDate?: string | Date | null;
            dueDate?: string | Date | null;
            assignedToId?: string | null;
            position?: number;
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

        if (data.position !== undefined && (!Number.isInteger(data.position) || data.position < 0)) {
            throw new Error("Task order must be a non-negative integer");
        }

        if (data.priority !== undefined &&
            !["LOW", "MEDIUM", "HIGH"].includes(data.priority)) {
            throw new Error("Invalid task priority");
        }

        const parseTaskDate = (value: string | Date | null | undefined) => {
            if (value === undefined) return undefined;
            if (value === null || value === "") return null;
            const parsed = value instanceof Date ? value : new Date(value);
            if (Number.isNaN(parsed.getTime())) throw new Error("Task dates must be valid");
            return parsed;
        };
        const startDate = parseTaskDate(data.startDate);
        const dueDate = parseTaskDate(data.dueDate);
        const nextStartDate = startDate === undefined ? task.startDate : startDate;
        const nextDueDate = dueDate === undefined ? task.dueDate : dueDate;
        if (nextStartDate && nextDueDate && nextDueDate < nextStartDate) {
            throw new Error("Due date must be on or after the start date");
        }

        if (data.assignedToId !== undefined && data.assignedToId !== null) {
            if (typeof data.assignedToId !== "string" || !data.assignedToId.trim()) {
                throw new Error("Invalid intern ID");
            }

            const intern = await TaskRepository.getIntern(data.assignedToId);
            const assignment = intern
                ? await TaskRepository.getProjectAssignment(task.projectId, intern.id)
                : null;

            if (!assignment || assignment.leftAt !== null) {
                throw new Error("Intern is not actively assigned to this project");
            }
        }

        let updatedTask = await TaskRepository.updateTask(id, {
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
            }),
            ...(startDate !== undefined && {
                startDate
            }),
            ...(dueDate !== undefined && {
                dueDate
            }),
            ...(data.assignedToId !== undefined && {
                assignedToId: data.assignedToId
            })
        });
        if (data.position !== undefined && data.position !== task.position) {
            updatedTask = await TaskRepository.reorderTask(task.projectId, id, data.position);
        }

        if (data.assignedToId && data.assignedToId !== task.assignedToId) {
            await notificationService.taskAssigned(id);
        } else if (
            (data.title !== undefined && data.title !== task.title) ||
            (data.description !== undefined && data.description !== task.description) ||
            (data.priority !== undefined && data.priority !== task.priority) ||
            (startDate !== undefined && startDate?.getTime() !== task.startDate?.getTime()) ||
            (dueDate !== undefined && dueDate?.getTime() !== task.dueDate?.getTime())
        ) {
            await notificationService.taskUpdated(id);
        }

        return updatedTask;
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
        status: TaskStatus,
        user: TaskUser,
        blockedReason?: string
    ) {
        const task = await TaskRepository.getTask(id);

        if (!task) {
            throw new Error("Task not found");
        }

        if (!Object.values(TaskStatus).includes(status)) {
            throw new Error("Invalid task status");
        }

        if (status === TaskStatus.BLOCKED && (typeof blockedReason !== "string" || !blockedReason.trim())) {
            throw new Error("A reason is required when blocking a task");
        }
        if (blockedReason && blockedReason.trim().length > 1000) {
            throw new Error("The blocking reason must be 1000 characters or fewer");
        }

        if (user.role === "INTERN") {
            const intern = await TaskRepository.getInternByUserId(user.id);
            const assignment = intern
                ? await TaskRepository.getProjectAssignment(task.projectId, intern.id)
                : null;

            if (
                !intern ||
                task.assignedToId !== intern.id ||
                !assignment ||
                assignment.leftAt !== null
            ) {
                throw new Error("Permission denied");
            }

            if (task.project.status === "COMPLETED") {
                throw new Error("Tasks in completed projects cannot be changed");
            }

            const allowedNext: Record<TaskStatus, TaskStatus[]> = {
                TODO: ["IN_PROGRESS", "BLOCKED"],
                IN_PROGRESS: ["COMPLETED", "BLOCKED"],
                BLOCKED: ["IN_PROGRESS"],
                COMPLETED: [],
            };

            if (!allowedNext[task.status].includes(status)) {
                throw new Error("Interns can only begin, submit, block, or resume their own tasks");
            }
        } else {
            await this.checkProjectAccess(task.projectId, user);
        }

        const updated = await TaskRepository.updateTaskStatus(id, status, blockedReason?.trim() ?? null);
        if (status === TaskStatus.BLOCKED && task.status !== TaskStatus.BLOCKED) {
            await notificationService.taskBlocked(id, blockedReason!.trim(), user.id);
        }
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
            description: task.description,
            category: task.category,
            projectId: task.projectId,
            assignedToId: task.assignedToId,
            assigneeName: task.assignedTo?.user.fullName ?? null,
            startDate: task.startDate,
            endDate: task.dueDate,
            progress: task.progress,
            position: task.position,
            status: task.status,
            blockedReason: task.blockedReason,
            approvedAt: task.approvedAt,
            parentId: task.parentId
        }));
    }

    // Calendar events from tasks visible to the user
    static async getCalendarEvents(user: TaskUser) {
        const tasks = await this.getTasks(user);
        const intern = user.role === "INTERN" ? await TaskRepository.getInternByUserId(user.id) : null;
        const calendarTasks = user.role === "INTERN"
            ? tasks.filter(task => task.assignedToId === intern?.id)
            : tasks;

        return calendarTasks
            .filter(task => task.startDate || task.dueDate)
            .map(task => ({
                id: task.id,
                title: task.title,
                projectId: task.projectId,
                projectName: task.project.name,
                assignedToId: task.assignedToId,
                assigneeName: task.assignedTo?.user.fullName ?? null,
                startDate: task.startDate,
                dueDate: task.dueDate,
                status: task.status,
                approvedAt: task.approvedAt
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

    // Request changes for a submitted task
    static async requestTaskChanges(
        id: string,
        feedback: string,
        user: TaskUser
    ) {
        const task = await TaskRepository.getTask(id);

        if (!task) {
            throw new Error("Task not found");
        }

        await this.checkProjectAccess(task.projectId, user);

        if (task.status !== "COMPLETED") {
            throw new Error("Can only request changes on completed tasks");
        }

        if (task.approvedAt) {
            throw new Error("Cannot request changes on an already approved task");
        }

        if (typeof feedback !== "string" || !feedback.trim()) {
            throw new Error("Feedback is required to request changes");
        }

        const updated = await TaskRepository.requestTaskChanges(
            id,
            user.id,
            `Changes requested: ${feedback.trim()}`
        );

        await notificationService.taskReturned(id);

        return updated;
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
