// In-app notifications (the bell and the Notifications page). Every notification belongs to ONE user,
// and GET /notifications only returns the caller's own, so each person sees what concerns them:
//   ADMIN + WIL_HANDLER  new applications, internships that ended
//   MENTOR               tasks submitted for review, their interns' internships ending
//   INTERN               welcome on acceptance, project and task updates, reinstatement
//   new staff            a welcome when their account is created
// Notifying never throws: a failed notification must not undo the action that triggered it.
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

  /** The intern: they were added to a project team. */
  projectAssigned: (projectId: string, internId: string) => safely("project assigned", async () => {
    const [project, intern] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } }),
      prisma.intern.findUnique({ where: { id: internId }, select: { user: { select: { id: true, role: true } } } }),
    ]);
    if (!project || !intern) return;
    await send([intern.user], {
      type: "PROJECT_ASSIGNED", title: "Added to a project",
      message: `You've been added to the project "${project.name}".`,
      link: (base) => `${base}/projects/${project.id}`,
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

  /** The project's supervising mentor: an intern marked a task completed, ready for review. */
  taskSubmitted: (taskId: string) => safely("task submitted", async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        assignedTo: { select: { user: { select: { fullName: true } } } },
        project: { select: { name: true, supervisor: { select: { user: { select: { id: true, role: true } } } } } },
      },
    });
    if (!task?.project.supervisor) return;
    await send([task.project.supervisor.user], {
      type: "SYSTEM", title: "Task ready for review",
      message: `${task.assignedTo?.user.fullName ?? "An intern"} completed "${task.title}" on ${task.project.name}.`,
      link: (base) => `${base}/tasks/review`,
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
      message: `Your mentor approved "${task.title}".`,
      link: (base) => `${base}/tasks`,
    });
  }),
};

export default notificationService;
