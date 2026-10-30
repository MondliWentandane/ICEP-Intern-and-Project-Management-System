import type { NotificationType, Role } from "@prisma/client";
import { prisma } from "../config/prisma";

/** Each role's area in the frontend, e.g. /handler/applicants vs /admin/applicants. */
const ROLE_BASE: Record<Role, string> = { ADMIN: "/admin", WIL_HANDLER: "/handler", MENTOR: "/mentor", INTERN: "/intern" };

type Recipient = { id: string; role: Role };
type Message = { type: NotificationType; title: string; message: string; link?: (base: string) => string };

const longDate = (date: Date | null | undefined) =>
  date ? new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" }).format(date) : null;

async function send(recipients: Recipient[], { type, title, message, link }: Message) {
  const unique = [...new Map(recipients.map((user) => [user.id, user])).values()];
  if (!unique.length) return;
  await prisma.notification.createMany({
    data: unique.map((user) => ({ userId: user.id, type, title, message, link: link ? link(ROLE_BASE[user.role]) : null })),
  });
}

/** Active staff with one of these roles. */
const staffWithRoles = (roles: Role[]) =>
  prisma.user.findMany({ where: { role: { in: roles }, isActive: true }, select: { id: true, role: true } });

async function safely(what: string, work: () => Promise<void>) {
  try {
    await work();
  } catch (error) {
    console.error(`Notification failed (${what}):`, error);
  }
}

export const notificationService = {
  /** Admin and WIL Handlers: someone applied through the careers page. */
  applicationSubmitted: (applicationId: string) => safely("application submitted", async () => {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { fullName: true, referenceCode: true, position: { select: { title: true, campus: { select: { name: true } } } } },
    });
    if (!application) return;
    await send(await staffWithRoles(["ADMIN", "WIL_HANDLER"]), {
      type: "APPLICATION_UPDATE",
      title: "New application",
      message: `${application.fullName} applied for ${application.position.title} (${application.position.campus.name} campus). Reference ${application.referenceCode}.`,
      link: (base) => `${base}/applicants`,
    });
  }),

  /** The new intern: welcome, with their start date. */
  applicationAccepted: (applicationId: string) => safely("application accepted", async () => {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { position: { select: { title: true } }, intern: { select: { startDate: true, user: { select: { id: true, role: true } } } } },
    });
    if (!application?.intern) return;
    const start = longDate(application.intern.startDate);
    await send([application.intern.user], {
      type: "APPLICATION_UPDATE",
      title: "Welcome to ICEP",
      message: `You've been accepted as ${application.position.title}${start ? `, starting ${start}` : ""}. Your WIL placement letter was emailed to you.`,
      link: (base) => `${base}/project`,
    });
  }),

  /** Admin, WIL Handlers and the intern's mentor: an internship ended (by hand or automatically). */
  internshipEnded: (internId: string, outcome: string, reason: string | null) => safely("internship ended", async () => {
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      select: { user: { select: { fullName: true } }, mentor: { select: { user: { select: { id: true, role: true } } } } },
    });
    if (!intern) return;
    const message = `${intern.user.fullName}'s internship ended (${outcome}${reason ? `: ${reason}` : ""}). They can no longer log in.`;
    await send(await staffWithRoles(["ADMIN", "WIL_HANDLER"]), {
      type: "SYSTEM", title: "Internship ended", message, link: (base) => `${base}/past-interns`,
    });
    if (intern.mentor) {
      await send([intern.mentor.user], { type: "SYSTEM", title: "Your intern's internship ended", message, link: (base) => `${base}/dashboard` });
    }
  }),

  /** The intern: their internship is active again. */
  internshipReinstated: (internId: string, endDate: Date) => safely("internship reinstated", async () => {
    const intern = await prisma.intern.findUnique({ where: { id: internId }, select: { user: { select: { id: true, role: true } } } });
    if (!intern) return;
    await send([intern.user], {
      type: "SYSTEM", title: "Internship reinstated",
      message: `Your internship is active again until ${longDate(endDate)}. You can log in as usual.`,
      link: (base) => `${base}/project`,
    });
  }),

  /** A new WIL Handler or Mentor: welcome, so their list isn't empty and they know what they can do. */
  staffAccountCreated: (userId: string) => safely("staff account created", async () => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) return;
    const what = user.role === "MENTOR" ? "supervise projects, assign tasks and review your interns' work" : "review applications, manage interns and send emails";
    await send([user], { type: "SYSTEM", title: "Welcome to ICEP", message: `Your account is ready. You can ${what}.`, link: (base) => `${base}/dashboard` });
  }),

  /** Admins: a mentor (or another admin) created a project, with who will supervise it and the team size. */
  projectCreated: (projectId: string, actorUserId?: string) => safely("project created", async () => {
    const [project, actor] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true, name: true, groupName: true, endDate: true,
          department: { select: { name: true } },
          _count: { select: { assignments: { where: { leftAt: null } } } },
        },
      }),
      actorUserId ? prisma.user.findUnique({ where: { id: actorUserId }, select: { id: true, fullName: true } }) : null,
    ]);
    if (!project) return;
    const due = longDate(project.endDate);
    const members = project._count.assignments;
    const admins = (await staffWithRoles(["ADMIN"])).filter((admin) => admin.id !== actor?.id);
    await send(admins, {
      type: "PROJECT_ASSIGNED", title: "New project created",
      message: `${actor?.fullName ?? "A mentor"} created "${project.name}"${project.groupName ? ` for ${project.groupName}` : ""} (${project.department.name})`
        + `${members ? `, with ${members} member${members === 1 ? "" : "s"}` : ""}${due ? `, due ${due}` : ""}.`,
      link: (base) => `${base}/projects`,
    });
  }),

  /** The intern: they were added to a project team, with their role, group and who assigned them. */
  projectAssigned: (projectId: string, internId: string, projectRole?: string | null, actorUserId?: string) => safely("project assigned", async () => {
    const [project, intern, actor] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, groupName: true, endDate: true } }),
      prisma.intern.findUnique({
        where: { id: internId },
        select: {
          user: { select: { id: true, role: true } },
          assignments: { where: { leftAt: null, projectId: { not: projectId } }, select: { project: { select: { name: true } } } },
        },
      }),
      actorUserId ? prisma.user.findUnique({ where: { id: actorUserId }, select: { fullName: true } }) : null,
    ]);
    if (!project || !intern) return;
    const due = longDate(project.endDate);
    const others = intern.assignments.map((a) => a.project.name);
    await send([intern.user], {
      type: "PROJECT_ASSIGNED",
      title: projectRole ? `New role: ${projectRole}` : "Added to a project",
      message: `${actor?.fullName ?? "Your mentor"} added you to ${project.groupName ? `${project.groupName} on ` : ""}"${project.name}"`
        + `${projectRole ? ` as ${projectRole}` : ""}${due ? `. Due ${due}` : ""}.`
        + `${others.length ? ` You are also on: ${others.join(", ")}.` : ""}`,
      link: (base) => `${base}/projects/${project.id}`,
    });
  }),

  /** The intern: their role on a project changed. */
  projectRoleChanged: (projectId: string, internId: string, from: string | null, to: string | null, actorUserId?: string) => safely("project role changed", async () => {
    const [project, intern, actor] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, groupName: true } }),
      prisma.intern.findUnique({ where: { id: internId }, select: { user: { select: { id: true, role: true } } } }),
      actorUserId ? prisma.user.findUnique({ where: { id: actorUserId }, select: { fullName: true } }) : null,
    ]);
    if (!project || !intern) return;
    await send([intern.user], {
      type: "PROJECT_ASSIGNED",
      title: to ? `Role changed: ${to}` : "Role removed",
      message: `${actor?.fullName ?? "Your mentor"} changed your role on ${project.groupName ? `${project.groupName} / ` : ""}"${project.name}"`
        + ` from ${from ?? "no role"} to ${to ?? "no role"}.`,
      link: (base) => `${base}/projects/${project.id}`,
    });
  }),

  /** The intern: they were taken off a project team. */
  projectRemoved: (projectId: string, internId: string, actorUserId?: string) => safely("project removed", async () => {
    const [project, intern, actor] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, select: { name: true, groupName: true } }),
      prisma.intern.findUnique({ where: { id: internId }, select: { user: { select: { id: true, role: true } } } }),
      actorUserId ? prisma.user.findUnique({ where: { id: actorUserId }, select: { fullName: true } }) : null,
    ]);
    if (!project || !intern) return;
    await send([intern.user], {
      type: "PROJECT_ASSIGNED", title: "Removed from a project",
      message: `${actor?.fullName ?? "Your mentor"} removed you from ${project.groupName ? `${project.groupName} on ` : ""}"${project.name}".`,
      link: (base) => `${base}/project`,
    });
  }),

  /** The intern the task is assigned to. */
  taskAssigned: (taskId: string) => safely("task assigned", async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, project: { select: { name: true } }, assignedTo: { select: { user: { select: { id: true, role: true } } } } },
    });
    if (!task?.assignedTo) return;
    await send([task.assignedTo.user], {
      type: "TASK_ASSIGNED", title: "New task",
      message: `"${task.title}" on ${task.project.name} was assigned to you.`,
      link: (base) => `${base}/tasks`,
    });
  }),

  /** The assigned intern: task details, dates, priority, or assignment changed. */
  taskUpdated: (taskId: string) => safely("task updated", async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, project: { select: { name: true } }, assignedTo: { select: { user: { select: { id: true, role: true } } } } },
    });
    if (!task?.assignedTo) return;
    await send([task.assignedTo.user], {
      type: "TASK_ASSIGNED",
      title: "Task details updated",
      message: `Details for "${task.title}" on ${task.project.name} have changed.`,
      link: (base) => `${base}/tasks`,
    });
  }),

  /** The project's supervising mentor: an intern marked a task completed, ready for review. */
  taskSubmitted: (taskId: string) => safely("task submitted", async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        assignedTo: { select: { user: { select: { fullName: true } } } },
        project: {
          select: {
            name: true,
            supervisor: { select: { user: { select: { id: true, role: true } } } },
            assignments: {
              where: { leftAt: null, projectRole: "Scrum Master" },
              select: { intern: { select: { user: { select: { id: true, role: true } } } } },
            },
          },
        },
      },
    });
    if (!task) return;
    const recipients: Recipient[] = [
      ...(task.project.supervisor ? [task.project.supervisor.user] : []),
      ...task.project.assignments.map((assignment) => assignment.intern.user),
    ];
    await send(recipients, {
      type: "SYSTEM", title: "Task ready for review",
      message: `${task.assignedTo?.user.fullName ?? "An intern"} completed "${task.title}" on ${task.project.name}.`,
      link: (base) => `${base}/tasks/review`,
    });
  }),

  /** The supervising mentor and project Scrum Master: an intern blocked a task. */
  taskBlocked: (taskId: string, reason: string, actorUserId: string) => safely("task blocked", async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        project: {
          select: {
            name: true,
            supervisor: { select: { user: { select: { id: true, role: true } } } },
            assignments: {
              where: { leftAt: null, projectRole: "Scrum Master" },
              select: { intern: { select: { user: { select: { id: true, role: true } } } } },
            },
          },
        },
      },
    });
    if (!task) return;
    const recipients: Recipient[] = [
      ...(task.project.supervisor ? [task.project.supervisor.user] : []),
      ...task.project.assignments.map((assignment) => assignment.intern.user),
    ].filter((recipient) => recipient.id !== actorUserId);
    await send(recipients, {
      type: "SYSTEM",
      title: "Task blocked",
      message: `A blocker was reported for "${task.title}" on ${task.project.name}: ${reason}`,
      link: (base) => `${base}/tasks`,
    });
  }),

  /** The intern: their completed task was approved. */
  taskApproved: (taskId: string) => safely("task approved", async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, assignedTo: { select: { user: { select: { id: true, role: true } } } } },
    });
    if (!task?.assignedTo) return;
    await send([task.assignedTo.user], {
      type: "TASK_APPROVED", title: "Task approved",
      message: `Your reviewer approved "${task.title}".`,
      link: (base) => `${base}/tasks`,
    });
  }),

  /** The intern: their submitted task was returned for changes. */
  taskReturned: (taskId: string) => safely("task returned", async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, project: { select: { name: true } }, assignedTo: { select: { user: { select: { id: true, role: true } } } } },
    });
    if (!task?.assignedTo) return;
    await send([task.assignedTo.user], {
      type: "SYSTEM",
      title: "Changes requested on task",
      message: `Your reviewer requested changes on "${task.title}" (${task.project.name}). It has been moved back to In Progress.`,
      link: (base) => `${base}/tasks`,
    });
  }),
};

export default notificationService;
