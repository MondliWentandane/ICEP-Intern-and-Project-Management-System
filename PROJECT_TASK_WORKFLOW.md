# Project, Scrum Master, and Intern Workflow

## Purpose

This document describes the intended workflow for mentors, Scrum Masters, and interns across the project, task board, Gantt chart, and calendar screens. It is an implementation proposal based on the product discussion; it does not claim that every behavior is already implemented.

## Roles and responsibilities

### Mentor

- Creates and owns the project, defines its goal, and assigns interns to the project team.
- Designates one team member as Scrum Master for that project. The Scrum Master remains an intern account; the extra authority applies only to that project.
- Oversees the plan, team progress, task status, and upcoming deadlines.
- Can intervene to edit or reassign work, resolve blockers, or change the Scrum Master.
- Can view all tasks and the project schedule for projects they supervise.

### Scrum Master

- Coordinates the team's work for the project where they are designated.
- Creates tasks, sets descriptions, priorities, and due dates, and assigns each task to a team member.
- Maintains the project plan and Gantt schedule, including task dates and ordering or dependencies if supported.
- Monitors the team task board, follows up on overdue or blocked work, and reviews submitted work if the project uses approval.
- Cannot manage projects they do not supervise or gain general mentor/admin permissions by being Scrum Master.

### Intern / team member

- Sees tasks for their project, including task name, assignee, status, due date, and priority. Seeing team tasks helps each intern understand how their work fits into the project.
- Updates progress only on tasks assigned to them: To Do → In Progress → Submitted/Completed.
- Cannot create, assign, delete, or change another intern's task. Cannot edit the Gantt plan.
- Can comment or raise a blocker on a task, if those interactions are enabled.

## Proposed end-to-end process

1. **Create project:** The mentor enters the project name and problem statement, then assigns active interns to the team.
2. **Choose Scrum Master:** The mentor selects one team member as Scrum Master. Enforce one active Scrum Master per project; allow the mentor to replace them.
3. **Plan work:** The Scrum Master creates tasks, writes clear outcomes, sets priority and due date, and assigns each task to an intern. Tasks and assignments are saved to the backend.
4. **Publish the schedule:** Task dates appear on the Gantt chart and relevant deadlines appear on the calendar. Team members receive an in-app notification when a task is assigned or materially changed.
5. **Do the work:** Each intern opens the task board, reviews their tasks and the team's tasks, and updates only their own task status. Changes are saved and visible to the Scrum Master and mentor.
6. **Review completion:** If review is required, the intern marks work as submitted. The Scrum Master (or mentor) approves it or requests changes. Approval is distinct from the intern saying the work is finished.
7. **Handle blockers:** An intern flags a blocker and explains it. The Scrum Master follows up; the mentor can intervene. A blocker should not be represented as rejected work.
8. **Close project:** When all work is accepted and the mentor confirms the outcome, the project can be marked complete.

## Why there are three views

These screens answer different questions and should use the same persisted project/task data.

| Screen | Main question | Mentor | Scrum Master | Intern |
|---|---|---|---|---|
| **Task board** | What work exists, who owns it, and what is its current state? | Full board for supervised projects; oversight and intervention | Full board for their project; creates/assigns tasks and follows progress | Sees team tasks; changes status only on their own assigned tasks |
| **Gantt chart** | When is work planned, and how does the schedule fit together? | Views schedule and progress; can intervene | Maintains dates and plan for their project | View-only schedule, if an intern Gantt page is provided; otherwise no Gantt access is required for this workflow |
| **Calendar** | What deadlines or events are coming up, and when? | Deadlines across supervised projects and relevant events | Deadlines/events for their project and team | Their assigned task due dates and relevant project events |

The **board is for execution and status**, the **Gantt chart is for planning and sequencing over time**, and the **calendar is for dates and upcoming commitments**. They should not be three separate task systems: changing a task's due date or status should update the relevant views from the same backend record.
## Screen controls: what to show and remove

| Screen and user | Show | Hide or remove |
|---|---|---|
| **Intern task board** | Team project tasks; task details; status controls only on tasks assigned to that intern; comments/blocker reporting if enabled | **Remove the “Add task” button**; no create, assign, delete, or edit controls for another intern's tasks |
| **Scrum Master task board** | Full board for the project where they are designated Scrum Master; **“Add task”**; edit task details; assign/reassign tasks; set priority and due date; review submissions if that is part of the agreed process | No controls for projects where they are not the designated Scrum Master; no global user/admin controls |
| **Mentor task board** | Full board for projects they supervise; task creation/edit/assignment controls for oversight and intervention | No access to projects they do not supervise unless the user is an administrator |
| **Intern Gantt chart (if provided)** | Project timeline and task dates in read-only form | No add task, edit dates, change dependencies, or drag/reschedule controls |
| **Scrum Master Gantt chart** | Timeline plus project-scoped controls to plan or adjust task dates/order/dependencies | No editing outside their designated project |
| **Mentor Gantt chart** | Timeline for supervised projects; controls to intervene in the plan | No editing outside supervised projects, unless administrator |
| **Calendar** | Relevant task due dates and project events, scoped to the user's project access | Do not create a second independent task; calendar changes should update the underlying task only when the user's role allows task editing |

The existing **“Add task”** control on the intern task board must be removed. The button should appear for the Scrum Master on their project board and for the supervising mentor where oversight requires it. Do not rely on hiding the button alone: reject unauthorized create/update requests in the backend too.

## Suggested task states and review behavior

Keep work progress and review outcome clear. A simple flow is:

TO_DO → IN_PROGRESS → SUBMITTED → COMPLETED

- TO_DO: not started.
- IN_PROGRESS: being worked on.
- SUBMITTED: intern says the work is ready for review.
- COMPLETED: reviewer accepts the work.
- BLOCKED: work cannot continue; record a reason and notify the Scrum Master.
- If submitted work needs changes, return it to IN_PROGRESS with reviewer feedback rather than treating it as blocked.

If the existing application keeps only TODO, IN_PROGRESS, and COMPLETED plus a separate approval field, keep that model consistent across API and UI. Do not show “Rejected” as a task progress state unless the review flow supports it. Dashboard counts must have documented, understandable definitions.

## Dashboard task summary

For the example summary of **24 Total Tasks**, **8 Active now**, **12 Pending**, and **4 Blocked/Rejected**:

- **Total Tasks (24):** all non-deleted tasks in the dashboard's stated scope (for example, one project or all projects the viewer can access).
- **Active now (8):** tasks currently IN_PROGRESS.
- **Pending (12):** tasks not yet started (TODO).
- **Blocked/Rejected (4):** this combines unlike outcomes. Prefer separate **Blocked** and **Needs changes** counts, and define whether completed tasks are included in Total Tasks. Do not infer one combined count unless the data supports it.

The dashboard should state its scope (project, team, or all supervised projects) and use the same task-state definitions as the board.

## Access-control rules to implement

- Enforce permissions in backend routes/services, not only by hiding buttons.
- Store Scrum Master designation as a project-scoped assignment/permission, not as a global user role.
- Scrum Master task creation, assignment, schedule edits, and team-board access are limited to projects where they are designated Scrum Master and a current team member.
- Interns may read tasks for their current project team but may update only their own assigned task's allowed progress fields and comments/blocker details.
- Mentors may manage and view tasks only for projects they supervise; admins may have system-wide oversight according to the access policy.
- Validate that a task assignee belongs to the project team. Handle removed team members and completed projects explicitly.
- Record who changed task status, assignment, dates, and review outcome, with timestamps.

## Current implementation status and gaps

Project creation and team assignment are connected to the backend. Project members have a projectRole field, but it is currently a free-form role label; it does not grant Scrum Master permissions. Task routes currently allow task management to admins and mentors, not an intern acting as Scrum Master. The intern task board still uses local sample state rather than loading and saving real tasks. The intern My Project page is also currently a static placeholder. Therefore, this workflow requires project-scoped Scrum Master authorization and wiring the task board, Gantt chart, and calendar to persisted tasks before it works end to end.

## Suggested implementation order

1. Agree on task states and whether completion requires review.
2. Add a project-scoped Scrum Master designation and backend authorization checks.
3. Connect task creation and assignment to persisted project tasks; validate team membership.
4. Connect the intern task board: show team tasks, allow only own-task progress updates, and show review/blocker feedback.
5. Connect the Gantt chart and calendar to the same task records and enforce role-specific edit/read access.
6. Add dashboard counts from the same scoped data and verify access for mentor, Scrum Master, and regular intern accounts.

