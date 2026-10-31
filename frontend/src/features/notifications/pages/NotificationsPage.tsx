import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BikeLoader } from "@/components/ui/BikeLoader";
import { apiErrorMessage } from "@/features/applicants/data/applicationsApi";
import {
  useDeleteNotification, useEmailLog, useMarkAllNotificationsRead, useMarkNotificationRead, useMyNotifications,
  type AppNotification, type EmailLogEntry, type NotificationType,
} from "../data/notificationsApi";

/* ------------------------------ Styles ------------------------------ */

const CSS = `
/* ICEP style guide tokens (styles/tokens.css). Light only: no dark theme. */
.np{--bg:var(--icep-page);--card:var(--icep-card);--text:var(--icep-heading);--muted:var(--icep-secondary);--border:var(--icep-border);--navy:var(--icep-primary);--navy-soft:#E8EEF5;--green:#166534;--green-bg:var(--icep-active-tint);--red:#B91C1C;--red-bg:var(--icep-rejected-tint);--blue:#1E40AF;--blue-bg:var(--icep-completed-tint);--amber:#92400E;--amber-bg:var(--icep-pending-tint);
 color:var(--text);font-family:Inter,Arial,sans-serif;font-size:14px;min-height:100%}
.np,.np *{box-sizing:border-box}
.np button{font-family:inherit}
.np-head{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:flex-start;margin-bottom:24px}
.np-head h1{margin:0 0 6px;font-size:26px}.np-head p{margin:0;color:var(--muted)}
.np-card{background:var(--card);border:1px solid var(--border);border-radius:var(--icep-radius-lg);box-shadow:0 2px 10px rgba(26,32,44,.05)}
.np-btn{height:40px;padding:0 16px;border-radius:10px;border:1px solid var(--border);background:var(--card);color:var(--navy);font-weight:600;font-size:14px;cursor:pointer;white-space:nowrap;transition:background-color .2s,color .2s,border-color .2s}
.np-btn:hover:not(:disabled){background:var(--navy);color:#fff;border-color:var(--navy)}.np-btn:disabled{opacity:.55;cursor:default}
.np-btn.dark{background:var(--navy);color:#fff;border-color:var(--navy)}.np-btn.dark:hover{background:#12283F}
.np-btn:focus-visible{outline:2px solid var(--navy);outline-offset:2px}
.np-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:24px}
.np-stat{padding:18px 20px}.np-stat b{display:block;font-size:30px}.np-stat span{color:var(--muted)}
.np-tabs{display:flex;gap:22px;border-bottom:1px solid var(--border);margin-bottom:22px}
.np-tab{background:none;border:0;padding:10px 2px;font-size:16px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;display:inline-flex;gap:8px;align-items:center}
.np-tab.on{color:var(--text);font-weight:700;border-color:var(--navy)}
.np-count{min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:var(--icep-rejected);color:#fff;font-size:12px;font-weight:700;display:inline-grid;place-items:center}
.np-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.np-seg{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--card)}
.np-seg button{border:0;background:none;padding:9px 16px;font-weight:600;color:var(--muted);cursor:pointer}
.np-seg button.on{background:var(--navy);color:#fff}
.np-select{border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:10px;padding:0 14px;font:inherit;height:42px;width:220px}
.np-filters{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.np-group{margin:0 0 10px;font-size:13px;letter-spacing:.04em;font-weight:700;color:var(--muted);text-transform:uppercase}
.np-row{display:flex;align-items:center;gap:16px;padding:16px 20px;margin-bottom:10px;width:100%;text-align:left;color:inherit;font:inherit}
.np-row .info{flex:1;min-width:0}.np-row b{display:block}.np-row small,.np-row p{color:var(--muted);overflow-wrap:anywhere}
.np-row p{margin:2px 0 0;line-height:1.5}
.np-note{cursor:pointer;transition:border-color .2s,box-shadow .2s}
.np-note:hover{border-color:var(--navy);box-shadow:0 6px 16px rgba(27,58,92,.10)}
.np-note:focus-visible{outline:2px solid var(--navy);outline-offset:2px}
.np-note.unread{background:#FEF2F2;border-left:4px solid var(--red);padding-left:17px}
.np-note.unread b{color:var(--red)}
.np-dot{width:9px;height:9px;border-radius:50%;background:var(--red);flex:none}
.np-acts{display:flex;gap:8px;flex:none}
.np-act{height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--border);background:var(--card);color:var(--navy);font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap}
.np-act:hover{background:var(--navy);color:#fff;border-color:var(--navy)}
.np-act.del{color:var(--red)}.np-act.del:hover{background:var(--red);color:#fff;border-color:var(--red)}
.np-act:focus-visible{outline:2px solid var(--navy);outline-offset:2px}
.np-dot.read{background:transparent}
.np-time{color:var(--muted);font-size:13px;white-space:nowrap}
.np-pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.np-pill.APPLICATION_UPDATE{background:var(--amber-bg);color:var(--amber)}
.np-pill.PROJECT_ASSIGNED{background:var(--navy-soft);color:var(--navy)}
.np-pill.TASK_ASSIGNED{background:var(--blue-bg);color:var(--blue)}
.np-pill.TASK_APPROVED,.np-pill.SENT{background:var(--green-bg);color:var(--green)}
.np-pill.SYSTEM,.np-pill.PENDING{background:#EDF0F4;color:#4A5568}
.np-pill.FAILED{background:var(--red-bg);color:var(--red)}
.np-empty{padding:40px;text-align:center;color:var(--muted)}
.np-error{padding:14px 18px;margin-bottom:16px;color:var(--red);background:var(--red-bg);border-radius:10px}
.np-overlay{position:fixed;inset:0;background:rgba(10,20,35,.55);display:grid;place-items:center;padding:20px;z-index:50}
.np-modal{width:min(560px,100%);padding:24px}.np-modal h3{margin:0 0 6px}
.np-modal dl{display:grid;grid-template-columns:110px 1fr;gap:10px 12px;margin:18px 0}.np-modal dt{color:var(--muted)}.np-modal dd{margin:0;overflow-wrap:anywhere}
.np-actions{display:flex;justify-content:flex-end;gap:12px}
@media(max-width:900px){.np-stats{grid-template-columns:1fr}}
@media(max-width:560px){.np-row{flex-wrap:wrap}.np-select{width:100%}}
`;

/* ------------------------------ Helpers ------------------------------ */

const TYPE_LABELS: Record<NotificationType, string> = {
  APPLICATION_UPDATE: "Application",
  PROJECT_ASSIGNED: "Project",
  TASK_ASSIGNED: "Task",
  TASK_APPROVED: "Approved",
  SYSTEM: "Update",
};

const TEMPLATE_LABELS: Record<string, string> = {
  APPLICATION_ACCEPTED: "Application accepted + set password",
  APPLICATION_REJECTED: "Application rejected",
  INTERVIEW_INVITE: "Interview invitation",
  PASSWORD_RESET: "Set / reset password",
};
const templateLabel = (entry: EmailLogEntry) =>
  entry.template ? TEMPLATE_LABELS[entry.template.key] ?? entry.template.key.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "Other email";
const STATUS_LABELS = { SENT: "Sent", FAILED: "Failed", PENDING: "Pending" } as const;

const TZ = "Africa/Johannesburg";
const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (dayKey(date) === dayKey(today)) return "Today";
  if (dayKey(date) === dayKey(yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(date);
}
const timeOf = (iso: string) => new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));

/** Items grouped under Today / Yesterday / date headings, newest first. */
function byDay<T>(items: T[], at: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const label = dayLabel(at(item));
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  return [...groups];
}

const SUBTITLES: Record<string, string> = {
  ADMIN: "New applications, ended internships and system updates for you.",
  WIL_HANDLER: "New applications and ended internships that need your attention.",
  MENTOR: "Tasks to review and updates about your interns.",
  INTERN: "Your tasks, projects and internship updates.",
};

/* ------------------------- My notifications tab ------------------------- */

function MyNotifications() {
  const navigate = useNavigate();
  const { data = [], isLoading, isError, error } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();
  const [show, setShow] = useState<"all" | "unread">("all");

  const unread = data.filter((n) => !n.isRead).length;
  const visible = show === "unread" ? data.filter((n) => !n.isRead) : data;

  const open = (note: AppNotification) => {
    if (!note.isRead) markRead.mutate(note.id);
    if (note.link) navigate(note.link);
  };

  return (
    <>
      <div className="np-toolbar">
        <div className="np-seg" role="group" aria-label="Show">
          <button type="button" className={show === "all" ? "on" : ""} aria-pressed={show === "all"} onClick={() => setShow("all")}>All</button>
          <button type="button" className={show === "unread" ? "on" : ""} aria-pressed={show === "unread"} onClick={() => setShow("unread")}>Unread ({unread})</button>
        </div>
        <button type="button" className="np-btn" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate()}>Mark all as read</button>
      </div>

      {isError && <div className="np-error" role="alert">{apiErrorMessage(error, "Your notifications could not be loaded.")}</div>}
      {isLoading ? <div className="np-card np-empty"><BikeLoader label="Loading notifications" size={115} /></div> : visible.length === 0 ? (
        <div className="np-card np-empty">{show === "unread" ? "You're all caught up: no unread notifications." : "No notifications yet. Updates that concern you will appear here."}</div>
      ) : byDay(visible, (n) => n.createdAt).map(([day, notes]) => (
        <section key={day} style={{ marginBottom: 22 }}>
          <h3 className="np-group">{day}</h3>
          {notes.map((note) => (
            <div key={note.id} role="button" tabIndex={0} className={`np-card np-row np-note${note.isRead ? "" : " unread"}`} onClick={() => open(note)}
              onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(note); } }}
              aria-label={`${note.isRead ? "" : "Unread: "}${note.title}. ${note.message}`}>
              <span className={`np-dot${note.isRead ? " read" : ""}`} aria-hidden="true" />
              <div className="info">
                <b>{note.title}</b>
                <p>{note.message}</p>
              </div>
              <span className={`np-pill ${note.type}`}>{TYPE_LABELS[note.type] ?? "Update"}</span>
              <span className="np-time">{timeOf(note.createdAt)}</span>
              <span className="np-acts">
                {!note.isRead && (
                  <button type="button" className="np-act" aria-label={`Mark "${note.title}" as read`}
                    onClick={(e) => { e.stopPropagation(); markRead.mutate(note.id); }}>Mark as read</button>
                )}
                <button type="button" className="np-act del" aria-label={`Delete "${note.title}"`}
                  onClick={(e) => { e.stopPropagation(); remove.mutate(note.id); }}>Delete</button>
              </span>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

/* ---------------------------- Email log tab ---------------------------- */

function EmailLog() {
  const { data = [], isLoading, isError, error } = useEmailLog(true);
  const [template, setTemplate] = useState("");
  const [status, setStatus] = useState("");
  const [viewing, setViewing] = useState<EmailLogEntry | null>(null);

  const templates = useMemo(() => [...new Set(data.map(templateLabel))].sort(), [data]);
  const visible = data.filter((e) => (!template || templateLabel(e) === template) && (!status || e.status === status));
  const [thisMonth] = useState(() => dayKey(new Date()).slice(0, 7));
  const stats: [number, string][] = [
    [data.filter((e) => e.status === "SENT" && dayKey(new Date(e.createdAt)).startsWith(thisMonth)).length, "Sent this month"],
    [data.filter((e) => e.status === "FAILED").length, "Failed to send"],
    [data.filter((e) => e.status === "SENT" && dayLabel(e.createdAt) === "Today").length, "Sent today"],
  ];

  return (
    <>
      <div className="np-stats">
        {stats.map(([n, label]) => <div key={label} className="np-card np-stat"><b>{n}</b><span>{label}</span></div>)}
      </div>
      <div className="np-filters">
        <select className="np-select" value={template} onChange={(e) => setTemplate(e.target.value)} aria-label="Filter by email">
          <option value="">All emails</option>
          {templates.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="np-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>
        <button type="button" className="np-btn" style={{ height: 42 }} disabled={!template && !status} onClick={() => { setTemplate(""); setStatus(""); }}>Clear filters</button>
      </div>

      {isError && <div className="np-error" role="alert">{apiErrorMessage(error, "The email log could not be loaded.")}</div>}
      {isLoading ? <div className="np-card np-empty"><BikeLoader label="Loading email log" size={115} /></div> : visible.length === 0 ? (
        <div className="np-card np-empty">{data.length ? "No emails match these filters." : "No emails have been sent yet."}</div>
      ) : byDay(visible, (e) => e.createdAt).map(([day, entries]) => (
        <section key={day} style={{ marginBottom: 22 }}>
          <h3 className="np-group">{day}</h3>
          {entries.map((entry) => (
            <div key={entry.id} className="np-card np-row">
              <span className={`np-pill ${entry.status}`}>{STATUS_LABELS[entry.status]}</span>
              <div className="info">
                <b>{templateLabel(entry)}</b>
                <small>{entry.toEmail} • {timeOf(entry.createdAt)}</small>
              </div>
              <button type="button" className="np-btn" onClick={() => setViewing(entry)}>View</button>
            </div>
          ))}
        </section>
      ))}

      {viewing && (
        <div className="np-overlay" onClick={() => setViewing(null)}>
          <div className="np-card np-modal" role="dialog" aria-modal="true" aria-labelledby="np-email-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="np-email-title">{templateLabel(viewing)}</h3>
            <span className={`np-pill ${viewing.status}`}>{STATUS_LABELS[viewing.status]}</span>
            <dl>
              <dt>To</dt><dd>{viewing.toEmail}</dd>
              <dt>Subject</dt><dd>{viewing.subject}</dd>
              <dt>{viewing.status === "SENT" ? "Sent" : "Tried"}</dt><dd>{dayLabel(viewing.sentAt ?? viewing.createdAt)} at {timeOf(viewing.sentAt ?? viewing.createdAt)}</dd>
              {viewing.error && <><dt>Error</dt><dd>{viewing.error}</dd></>}
            </dl>
            <div className="np-actions"><button type="button" className="np-btn dark" onClick={() => setViewing(null)}>Close</button></div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Main page ----------------------------- */

/**
 * Everyone gets their own notifications (only theirs: the API filters by the signed-in user).
 * Admins and WIL Handlers also get the Email log: every email the system sent to applicants and interns.
 */
export function NotificationsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "INTERN";
  const canSeeEmailLog = role === "ADMIN" || role === "WIL_HANDLER";
  const [tab, setTab] = useState<"mine" | "emails">("mine");
  const { data = [] } = useMyNotifications();
  const unread = data.filter((n) => !n.isRead).length;

  return (
    <div className="np">
      <style>{CSS}</style>
      <div className="np-head">
        <div>
          <h1>Notifications</h1>
          <p>{SUBTITLES[role] ?? SUBTITLES.INTERN}</p>
        </div>
      </div>

      {canSeeEmailLog && (
        <div className="np-tabs" role="tablist" aria-label="Notifications">
          <button type="button" role="tab" aria-selected={tab === "mine"} className={`np-tab${tab === "mine" ? " on" : ""}`} onClick={() => setTab("mine")}>
            My notifications{unread > 0 && <span className="np-count">{unread}</span>}
          </button>
          <button type="button" role="tab" aria-selected={tab === "emails"} className={`np-tab${tab === "emails" ? " on" : ""}`} onClick={() => setTab("emails")}>Email log</button>
        </div>
      )}

      {canSeeEmailLog && tab === "emails" ? <EmailLog /> : <MyNotifications />}
    </div>
  );
}

export default NotificationsPage;
