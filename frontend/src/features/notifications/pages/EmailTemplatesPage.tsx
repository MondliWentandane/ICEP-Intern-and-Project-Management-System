import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------ Styles ------------------------------ */

const CSS = `
.np{--bg:#f4f6f8;--card:#fff;--text:#12263f;--muted:#6b7a90;--border:#e5e9ef;--navy:#16345a;--navy-d:#12263f;--navy-soft:#e8edf4;--green:#17713a;--green-bg:#dcf7e6;--red:#c2300a;--red-bg:#fde4dc;--blue:#1d4fd8;--blue-bg:#dbe8fd;--amber:#8a4b08;--amber-bg:#fdf0c2;
 background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;font-size:15px;padding:24px;min-height:100%}
@media (prefers-color-scheme: dark){.np{--bg:#0e1a2b;--card:#15253b;--text:#e9eef5;--muted:#93a3ba;--border:#24364f;--navy:#3b6aa8;--navy-d:#2f5a94;--navy-soft:#1f3350;--green-bg:#17402b;--green:#7ee0a3;--red-bg:#4a2018;--red:#ff9c80;--blue-bg:#1d3560;--blue:#9dbcff;--amber-bg:#4a3a12;--amber:#f2c66b}}
.np,.np *{box-sizing:border-box}
.np button{font-family:inherit}
.np-head{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:flex-start;margin-bottom:28px}
.np-head h1{margin:0 0 6px;font-size:26px}.np-head p{margin:0;color:var(--muted)}
.np-card{background:var(--card);border:1px solid var(--border);border-radius:14px}
.np-outlook{display:flex;align-items:center;gap:28px;padding:18px 20px}
.np-outlook b{display:block}.np-outlook small{color:var(--muted)}
.np-btn{height:40px;padding:0 16px;border-radius:10px;border:1px solid var(--border);background:var(--card);color:var(--text);font-weight:600;font-size:14px;cursor:pointer;white-space:nowrap}
.np-btn:hover{background:var(--bg)}.np-btn:disabled{opacity:.6;cursor:default}
.np-btn.sm{height:36px;padding:0 14px}
.np-btn.dark{background:var(--navy-d);color:#fff;border-color:var(--navy-d)}.np-btn.dark:hover{background:var(--navy)}
.np-btn.line{border:1.5px solid var(--navy-d)}
.np-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;max-width:1000px;margin-bottom:28px}
.np-stat{padding:18px 20px}.np-stat b{display:block;font-size:30px}.np-stat span{color:var(--muted)}
.np-tabs{display:flex;gap:22px;border-bottom:1px solid var(--border);margin-bottom:24px}
.np-tab{background:none;border:0;padding:10px 2px;font-size:17px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.np-tab.on{color:var(--text);font-weight:700;border-color:var(--navy-d)}
.np-split{display:grid;grid-template-columns:minmax(280px,380px) 1fr;gap:24px;align-items:start}
.np-bar{display:flex;gap:12px;margin-bottom:16px}
.np-input,.np-select,.np-text{width:100%;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:10px;padding:0 14px;font:inherit;height:44px}
.np-text{height:auto;padding:12px 14px;resize:vertical;line-height:1.6;min-height:170px}
.np-list{display:flex;flex-direction:column;gap:12px}
.np-item{text-align:left;width:100%;padding:16px 18px;border-radius:14px;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer;display:grid;grid-template-columns:1fr auto;gap:2px 10px}
.np-item:hover{border-color:var(--navy)}.np-item.on{border:2px solid var(--navy-d);padding:15px 17px}
.np-item b{grid-column:1/-1}.np-item small{color:var(--muted)}
.np-item .np-pill{grid-row:2/4;grid-column:2;align-self:end}
.np-pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700}
.np-pill.Active,.np-pill.Sent.ok{background:var(--green-bg);color:var(--green)}
.np-pill.Draft{background:var(--amber-bg);color:var(--amber)}
.np-pill.Sent{background:var(--blue-bg);color:var(--blue)}
.np-pill.Failed{background:var(--red-bg);color:var(--red)}
.np-editor{padding:24px}
.np-editor h2{margin:0 0 2px;font-size:20px}.np-editor .sub{color:var(--muted);margin-bottom:18px}
.np-editor label{display:block;margin:14px 0 6px;color:var(--muted);font-size:14px}
.np-edit-grid{display:grid;grid-template-columns:1fr minmax(240px,340px);gap:24px}
.np-preview{border:1px solid var(--border);border-radius:12px;padding:16px;font-size:14px;align-self:start;margin-top:14px;overflow-wrap:anywhere}
.np-preview h4{margin:0 0 14px;font-size:13px;color:var(--muted)}
.np-preview p{margin:0 0 14px;white-space:pre-wrap}.np-preview a{color:var(--blue);text-decoration:none}
.np-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:24px}
.np-filters{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}.np-filters .np-select{width:200px}
.np-group{margin:0 0 10px;font-size:13px;letter-spacing:.04em;font-weight:700;color:var(--muted);text-transform:uppercase}
.np-row{display:flex;align-items:center;gap:20px;padding:16px 20px;margin-bottom:12px}
.np-row .info{flex:1;min-width:0}.np-row b{display:block}.np-row small{color:var(--muted);overflow-wrap:anywhere}
.np-empty{padding:40px;text-align:center;color:var(--muted)}
.np-overlay{position:fixed;inset:0;background:rgba(10,20,35,.55);display:grid;place-items:center;padding:20px;z-index:50}
.np-modal{width:min(560px,100%);padding:24px}.np-modal h3{margin:0 0 4px}
.np-modal dl{display:grid;grid-template-columns:110px 1fr;gap:10px 12px;margin:18px 0}.np-modal dt{color:var(--muted)}.np-modal dd{margin:0;overflow-wrap:anywhere}
.np-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--navy-d);color:#fff;padding:12px 20px;border-radius:10px;font-weight:600;z-index:60;box-shadow:0 6px 20px rgba(0,0,0,.25)}
@media(max-width:900px){.np-split,.np-edit-grid{grid-template-columns:1fr}.np-stats{grid-template-columns:repeat(2,1fr)}}
.np-stats.three{grid-template-columns:repeat(3,minmax(0,1fr));max-width:760px}
@media(max-width:900px){.np-stats.three{grid-template-columns:1fr}}
`;

/* ------------------------------- Types ------------------------------- */

type TemplateStatus = "Active" | "Draft";

interface Template {
  id: number;
  name: string;
  trigger: string;
  subject: string;
  body: string;
  status: TemplateStatus;
  edited: string;
}

/* ---------------------------- Sample data ---------------------------- */

const INITIAL_TEMPLATES: Template[] = [
  {
    id: 1, name: "Application Received", trigger: "Applicant submits form", status: "Active", edited: "Today",
    subject: "We received your ICEP application, {{first_name}}",
    body: "Dear {{first_name}} {{last_name}},\n\nThank you for applying for the ICEP WIL placement at {{campus}}. We have received your application and will be in touch soon.\n\nRegards, Nimabatho",
  },
  {
    id: 2, name: "Interview Invitation", trigger: "Applicant moved to Interviewer", status: "Active", edited: "03 Oct 2026",
    subject: "Interview invitation - ICEP WIL placement",
    body: "Dear {{first_name}} {{last_name}},\n\nYou have been shortlisted for an interview for the ICEP WIL placement at {{campus}}. Please reply to confirm your availability.\n\nRegards, Nimabatho",
  },
  {
    id: 3, name: "Application Accepted + Set Password", trigger: "Mentor clicks Accept (page 7)", status: "Active", edited: "03 Oct 2026",
    subject: "Welcome to ICEP, {{first_name}} - set your password",
    body: "Dear {{first_name}} {{last_name}},\n\nCongratulations. Your application for the ICEP WIL placement at {{campus}} has been accepted for the 2027 intake.\n\nPlease set your password using this link:\n\n{{ set password link }}\n\nThis link expires in 48 hours.\n\nRegards, Nimabatho",
  },
  {
    id: 4, name: "Application Rejected", trigger: "Mentor clicks Reject (page 7)", status: "Active", edited: "26 Sep 2026",
    subject: "Update on your ICEP application",
    body: "Dear {{first_name}} {{last_name}},\n\nThank you for your interest in the ICEP WIL placement at {{campus}}. Unfortunately we are unable to offer you a placement this intake.\n\nRegards, Nimabatho",
  },
  {
    id: 5, name: "Intern Welcome", trigger: "Intern account created", status: "Draft", edited: "18 Sep 2026",
    subject: "Welcome aboard, {{first_name}}",
    body: "Dear {{first_name}},\n\nWelcome to the ICEP programme at {{campus}}. Your mentor will contact you shortly.\n\nRegards, Nimabatho",
  },
  {
    id: 6, name: "Intake Reminder", trigger: "Intake opens in 7 days", status: "Draft", edited: "12 Sep 2026",
    subject: "Intake opens soon",
    body: "Dear {{first_name}},\n\nThe next ICEP intake at {{campus}} opens in 7 days.\n\nRegards, Nimabatho",
  },
];

const SAMPLE: Record<string, string> = { first_name: "Thabo", last_name: "Mokoena", campus: "Soshanguve" };
const fill = (s: string) => s.replace(/\{\{\s*(first_name|last_name|campus)\s*\}\}/g, (_, k: string) => SAMPLE[k]);
const LINK_RE = /(\{\{\s*set password link\s*\}\})/;

/* --------------------------- Template editor -------------------------- */

interface EditorProps {
  template: Template;
  onSave: (t: Template, asDraft: boolean) => void;
}

function TemplateEditor({ template, onSave }: EditorProps) {
  const [form, setForm] = useState(template);
  const set = (k: keyof Template, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="np-card np-editor">
      <h2>{form.name || "Untitled template"}</h2>
      <div className="sub">Send via Outlook</div>
      <div className="np-edit-grid">
        <div>
          <label htmlFor="np-name">Template name</label>
          <input id="np-name" className="np-input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <label htmlFor="np-trigger">Trigger</label>
          <input id="np-trigger" className="np-input" value={form.trigger} onChange={(e) => set("trigger", e.target.value)} />
          <label htmlFor="np-subject">Subject</label>
          <input id="np-subject" className="np-input" value={form.subject} onChange={(e) => set("subject", e.target.value)} />
          <label htmlFor="np-body">Body</label>
          <textarea id="np-body" className="np-text" rows={9} value={form.body} onChange={(e) => set("body", e.target.value)} />
        </div>
        <div className="np-preview">
          <h4>Live preview (sample data)</h4>
          <p><b>Subject: {fill(form.subject)}</b></p>
          {fill(form.body).split("\n\n").map((para, i) => (
            <p key={i}>
              {para.split(LINK_RE).map((part, j) =>
                LINK_RE.test(part) ? <a key={j} href="#preview" onClick={(e) => e.preventDefault()}>{part}</a> : part
              )}
            </p>
          ))}
        </div>
      </div>
      <div className="np-actions">
        <button type="button" className="np-btn" onClick={() => onSave(form, true)}>Save draft</button>
        <button type="button" className="np-btn dark" onClick={() => onSave(form, false)}>Save changes</button>
      </div>
    </div>
  );
}

/* ------------------------------ Main page ----------------------------- */

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [selectedId, setSelectedId] = useState(3);
  const [search, setSearch] = useState("");
  const [outlook, setOutlook] = useState<"connected" | "connecting">("connected");
  const [toast, setToast] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const notify = (msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(""), 2200);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => !q || t.name.toLowerCase().includes(q) || t.trigger.toLowerCase().includes(q));
  }, [templates, search]);

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  const reconnect = () => {
    setOutlook("connecting");
    window.setTimeout(() => {
      setOutlook("connected");
      notify("Outlook reconnected");
    }, 1200);
  };

  const newTemplate = () => {
    const id = Math.max(0, ...templates.map((t) => t.id)) + 1;
    setTemplates([{ id, name: "Untitled template", trigger: "", subject: "", body: "", status: "Draft", edited: "Today" }, ...templates]);
    setSelectedId(id);
    setSearch("");
  };

  const saveTemplate = (t: Template, asDraft: boolean) => {
    const next: Template = { ...t, status: asDraft ? "Draft" : "Active", edited: "Today" };
    setTemplates((all) => all.map((x) => (x.id === next.id ? next : x)));
    notify(asDraft ? "Draft saved" : "Changes saved");
  };

  const stats: [number, string][] = [
    [templates.length, "Templates"],
    [templates.filter((t) => t.status === "Active").length, "Active"],
    [templates.filter((t) => t.status === "Draft").length, "Drafts"],
  ];

  return (
    <div className="np">
      <style>{CSS}</style>

      <div className="np-head">
        <div>
          <h1>Email Templates</h1>
          <p>Create and manage the email templates sent to applicants and interns.</p>
        </div>
        <div className="np-card np-outlook">
          <div>
            <b>Outlook: {outlook === "connected" ? "Connected" : "Connecting…"}</b>
            <small>wi.williamson@tut.ac.za</small>
          </div>
          <button type="button" className="np-btn line sm" disabled={outlook === "connecting"} onClick={reconnect}>
            Reconnect
          </button>
        </div>
      </div>

      <div className="np-stats three">
        {stats.map(([n, label]) => (
          <div key={label} className="np-card np-stat">
            <b>{n}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="np-split">
        <div>
          <div className="np-bar">
            <input className="np-input" placeholder="Search templates" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="np-btn dark" style={{ height: 44 }} onClick={newTemplate}>
              + New
            </button>
          </div>
          <div className="np-list">
            {visible.length === 0 && <div className="np-card np-empty">No templates found.</div>}
            {visible.map((t) => (
              <button key={t.id} type="button" className={`np-item${t.id === selected.id ? " on" : ""}`} onClick={() => setSelectedId(t.id)}>
                <b>{t.name}</b>
                <small>{t.trigger || "No trigger set"}</small>
                <small>Edited {t.edited}</small>
                <span className={`np-pill ${t.status}`}>{t.status}</span>
              </button>
            ))}
          </div>
        </div>
        <TemplateEditor key={selected.id} template={selected} onSave={saveTemplate} />
      </div>

      {toast && <div className="np-toast" role="status">{toast}</div>}
    </div>
  );
}

export default EmailTemplatesPage;