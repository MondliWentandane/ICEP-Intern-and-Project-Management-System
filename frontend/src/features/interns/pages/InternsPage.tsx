import { useMemo, useState } from "react";

/* ------------------------------ Styles ------------------------------ */

const CSS = `
.interns-page{
  --bg:#f4f6f8;--card:#fff;--text:#12263f;--muted:#6b7a90;--border:#e5e9ef;
  --navy:#16345a;--navy-d:#12263f;--navy-soft:#e8edf4;
  
}
@media (prefers-color-scheme: dark){
  .interns-page{--bg:#0e1a2b;--card:#15253b;--text:#e9eef5;--muted:#93a3ba;--border:#24364f;--navy:#3b6aa8;--navy-d:#2f5a94;--navy-soft:#1f3350}
}
.interns-page[data-theme="dark"]{--bg:#0e1a2b;--card:#15253b;--text:#e9eef5;--muted:#93a3ba;--border:#24364f;--navy:#3b6aa8;--navy-d:#2f5a94;--navy-soft:#1f3350}
.interns-page,.interns-page *{box-sizing:border-box}
.interns-page{background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;font-size:15px}
.interns-page .wrap{max-width:1200px;margin:0 auto;padding:24px}
.interns-page h1{font-size:22px;margin:0 0 20px}
.interns-page .filters{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:20px}
.interns-page .field{background:var(--card);border:1px solid var(--border);border-radius:10px;height:42px;padding:0 14px;color:var(--text);font:inherit}
.interns-page input.field{flex:1;min-width:220px}
.interns-page .clear{height:42px;background:var(--card);color:var(--muted);border:1px solid var(--border);border-radius:10px;padding:0 18px;font:500 15px Inter,sans-serif;cursor:pointer;white-space:nowrap;box-shadow:0 1px 2px rgba(18,38,63,.05)}
.interns-page .clear:hover{color:var(--text);background:var(--bg)}
.interns-page .clear:active{transform:translateY(1px)}
.interns-page .clear:focus-visible{outline:2px solid var(--navy);outline-offset:2px}
.interns-page .clear:disabled{opacity:.6;cursor:default}
.interns-page .card{background:var(--card);border-radius:14px;box-shadow:0 1px 3px rgba(18,38,63,.08);overflow:hidden}
.interns-page .scroll{overflow-x:auto}
.interns-page table{width:100%;border-collapse:collapse;min-width:820px}
.interns-page th{text-align:left;font-size:12px;letter-spacing:.04em;color:var(--muted);padding:18px 20px;border-bottom:1px solid var(--border);font-weight:600}
.interns-page td{padding:14px 20px;border-bottom:1px solid var(--border)}
.interns-page tr:last-child td{border-bottom:0}
.interns-page .who{display:flex;align-items:center;gap:12px;font-weight:500}
.interns-page .av{width:36px;height:36px;border-radius:50%;background:var(--navy-soft);color:var(--navy);font-size:12px;font-weight:700;display:grid;place-items:center;flex:none}
.interns-page .pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600}
.interns-page .Intern{background:#dcf7e6;color:#17713a}
.interns-page .Interviewee{background:#fdf0c2;color:#8a4b08}
.interns-page .Applicant{background:#dbe8fd;color:#1d3fa8}
.interns-page .PastIntern{background:#eceff3;color:#4a586b}
.interns-page .btn{background:var(--navy-d);color:#fff;border:0;border-radius:8px;padding:10px 14px;font:600 14px Inter,sans-serif;cursor:pointer;white-space:nowrap}
.interns-page .btn:hover{background:var(--navy)}
.interns-page .foot{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-top:1px solid var(--border);color:var(--muted);flex-wrap:wrap;gap:12px}
.interns-page .pager{display:flex;gap:8px;align-items:center}
.interns-page .pg{min-width:38px;height:38px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font:600 14px Inter,sans-serif;cursor:pointer;padding:0 12px}
.interns-page .pg.on{background:var(--navy-d);color:#fff;border-color:var(--navy-d)}
.interns-page .pg:disabled{color:var(--muted);cursor:default}
.interns-page .back{display:inline-flex;gap:8px;align-items:center;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:11px 16px;font:600 14px Inter,sans-serif;cursor:pointer;margin-bottom:24px}
.interns-page .grid{display:grid;grid-template-columns:340px 1fr;gap:24px;align-items:start}
@media(max-width:860px){.interns-page .grid{grid-template-columns:1fr}}
.interns-page .side{padding:32px 28px;text-align:center}
.interns-page .big{width:108px;height:108px;border-radius:50%;background:var(--navy);color:#fff;font-size:36px;font-weight:700;display:grid;place-items:center;margin:0 auto 14px}
.interns-page .side h2{margin:0;font-size:20px}
.interns-page .sid{color:var(--muted);margin:4px 0 12px}
.interns-page .info{text-align:left;border-top:1px solid var(--border);margin-top:24px;padding-top:20px}
.interns-page .lbl{font-size:12px;letter-spacing:.04em;color:var(--muted);font-weight:600;text-transform:uppercase;margin-top:18px}
.interns-page .lbl:first-child{margin-top:0}
.interns-page .val{margin-top:4px}
.interns-page .dl{width:100%;margin-top:36px;background:var(--card);border:1.5px solid var(--navy);color:var(--navy);border-radius:10px;padding:13px;font:600 15px Inter,sans-serif;cursor:pointer}
.interns-page .dl:hover{background:var(--navy-soft)}
.interns-page .dl:disabled{opacity:.7;cursor:default}
.interns-page .dl.ok{background:#dcf7e6;border-color:#17713a;color:#17713a}
.interns-page .dl-msg{font-size:13px;color:var(--muted);margin-top:8px;min-height:18px}
.interns-page .sec{margin-bottom:24px}
.interns-page .sec h3{margin:0;padding:20px 24px;font-size:17px;border-bottom:1px solid var(--border)}
.interns-page .kv{display:grid;grid-template-columns:1fr 1fr;gap:22px 24px;padding:22px 24px}
.interns-page .kv small{display:block;color:var(--muted);font-size:13px;margin-bottom:4px}
.interns-page .kv b{font-weight:600}
.interns-page .act{padding:20px 24px;display:flex;flex-direction:column;gap:22px}
.interns-page .act div{display:flex;align-items:center;gap:14px}
.interns-page .act i{width:12px;height:12px;border-radius:50%;background:var(--navy);flex:none}
.interns-page .act span{margin-left:auto;color:var(--muted);font-size:14px}
@media(max-width:560px){.interns-page .kv{grid-template-columns:1fr}}
`;

type Status = "Intern" | "Interviewee" | "Applicant" | "Past Intern";

interface Intern {
  id: number;
  name: string;
  studentNo: string;
  campus: string;
  status: Status;
}

const SEED: Omit<Intern, "id">[] = [
  { name: "Sarah Johnson", studentNo: "21901234", campus: "Pretoria", status: "Intern" },
  { name: "David Williams", studentNo: "21905678", campus: "Soshanguve South", status: "Interviewee" },
  { name: "Emily Chen", studentNo: "21909012", campus: "eMalahleni", status: "Applicant" },
  { name: "Mark Thompson", studentNo: "21903456", campus: "Mbombela", status: "Past Intern" },
  { name: "Aisha Banda", studentNo: "21902123", campus: "Polokwane", status: "Intern" },
  { name: "Kabelo Sithole", studentNo: "21904567", campus: "Ga-Rankuwa", status: "Intern" },
  { name: "Naledi Khumalo", studentNo: "21906789", campus: "Pretoria", status: "Intern" },
  { name: "Tshepo Mahlangu", studentNo: "21907890", campus: "Soshanguve North", status: "Past Intern" },
];

// Placeholder data (42 interns) – replace with your API response.
const FIRST = ["Sarah","David","Emily","Mark","Aisha","Kabelo","Naledi","Tshepo","Lerato","Thabo","Zanele","Pieter","Nomsa","Sipho"];
const LAST = ["Johnson","Williams","Chen","Thompson","Banda","Sithole","Khumalo","Mahlangu","Molefe","Nkosi","Naidoo","Botha","Dlamini","Mokoena"];
const CAMPUS_LIST = ["Pretoria","Soshanguve South","eMalahleni","Mbombela","Polokwane","Ga-Rankuwa","Soshanguve North"];
const STATUS_LIST: Status[] = ["Intern","Interviewee","Applicant","Past Intern","Intern","Intern"];

const INTERNS: Intern[] = Array.from({ length: 42 }, (_, i) => {
  const a = i % 8 < FIRST.length ? i % FIRST.length : 0;
  return {
    id: i,
    name: i < SEED.length ? SEED[i].name : `${FIRST[(i * 5) % FIRST.length]} ${LAST[(i * 3 + Math.floor(i / 14)) % LAST.length]}`,
    studentNo: i < SEED.length ? SEED[i].studentNo : String(21900000 + ((i * 397) % 9999)).padStart(8, "0"),
    campus: i < SEED.length ? SEED[i].campus : CAMPUS_LIST[(i * 2 + a) % CAMPUS_LIST.length],
    status: i < SEED.length ? SEED[i].status : STATUS_LIST[(i * 7) % STATUS_LIST.length],
  };
});

const STATUSES: Status[] = ["Intern", "Interviewee", "Applicant", "Past Intern"];
const CAMPUSES = Array.from(new Set(INTERNS.map((p) => p.campus)));

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("");

const pillClass = (s: Status) => `pill ${s.replace(" ", "")}`;

function downloadCv(p: Intern) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>CV - ${p.name}</title>
<style>body{font-family:Inter,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 24px;color:#12263f}
h1{margin:0;font-size:28px}h2{font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#16345a;border-bottom:2px solid #16345a;padding-bottom:4px;margin-top:28px}
p{margin:6px 0}.m{color:#6b7a90}</style></head><body>
<h1>${p.name}</h1>
<p class="m">Student No. ${p.studentNo} &middot; ${p.studentNo}@tut4life.ac.za &middot; +27 82 123 4567 &middot; ${p.campus} Campus</p>
<h2>Education</h2><p><b>BSc Computer Science</b>, 3rd Year</p><p>Information &amp; Communication Technology</p><p>Average mark: 78%</p>
<h2>Internship</h2><p><b>ICEP Web Portal</b></p><p>Mentor: John Doe</p><p>01 Feb 2024 &ndash; 30 Nov 2024</p>
</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${p.name.replace(/\s+/g, "_")}_CV.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------- Profile view ---------------------------- */

interface ProfileProps {
  intern: Intern;
  onBack: () => void;
}

function InternProfile({ intern, onBack }: ProfileProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    downloadCv(intern);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <section>
      <button type="button" className="back" onClick={onBack}>
        ← Back to Interns List
      </button>

      <div className="grid">
        <div className="card side">
          <div className="big">{initials(intern.name)}</div>
          <h2>{intern.name}</h2>
          <div className="sid">{intern.studentNo}</div>
          <span className={pillClass(intern.status)}>{intern.status}</span>

          <div className="info">
            <div className="lbl">Email address</div>
            <div className="val">{intern.studentNo}@tut4life.ac.za</div>
            <div className="lbl">Phone number</div>
            <div className="val">+27 82 123 4567</div>
            <div className="lbl">Campus</div>
            <div className="val">{intern.campus}</div>
          </div>

          <button type="button" className={`dl${downloaded ? " ok" : ""}`} onClick={handleDownload}>
            {downloaded ? "✓ CV downloaded" : "⬇ Download CV"}
          </button>
        </div>

        <div>
          <div className="card sec">
            <h3>Academic Background</h3>
            <div className="kv">
              <div><small>Qualification</small><b>BSc Computer Science</b></div>
              <div><small>Year of Study</small><b>3rd Year</b></div>
              <div><small>Faculty</small><b>Information &amp; Communication Technology</b></div>
              <div><small>Average Mark</small><b>78%</b></div>
            </div>
          </div>

          <div className="card sec">
            <h3>Internship Details</h3>
            <div className="kv">
              <div><small>Assigned Project</small><b>ICEP Web Portal</b></div>
              <div><small>Mentor</small><b>John Doe</b></div>
              <div><small>Start Date</small><b>01 Feb 2024</b></div>
              <div><small>Expected End Date</small><b>30 Nov 2024</b></div>
            </div>
          </div>

          <div className="card sec">
            <h3>Recent Activity</h3>
            <div className="act">
              <div><i />Submitted Weekly Report (Week 4)<span>2 days ago</span></div>
              <div><i />Attended Mentor Check-In<span>5 days ago</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- List view ------------------------------ */

export function InternsPage() {
  const [query, setQuery] = useState("");
  const [campus, setCampus] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [perPage, setPerPage] = useState(8);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTERNS.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.studentNo.includes(q)) &&
        (!campus || p.campus === campus) &&
        (!status || p.status === status)
    );
  }, [query, campus, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * perPage;
  const rows = filtered.slice(start, start + perPage);

  const clearFilters = () => {
    setQuery("");
    setCampus("");
    setStatus("");
    setPage(1);
  };

  const selected = INTERNS.find((p) => p.id === selectedId);

  return (
    <div className="interns-page">
      <style>{CSS}</style>
      <div className="wrap">
        {selected ? (
          <InternProfile intern={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <section>
            <div className="filters">
              <input
                className="field"
                placeholder="Search name or student number"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
              <select
                className="field"
                value={campus}
                onChange={(e) => {
                  setCampus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All campuses</option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="field"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "" | Status);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="button" className="clear" onClick={clearFilters}>
                Clear filters
              </button>
            </div>

            <div className="card">
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>STUDENT NO.</th>
                      <th>EMAIL</th>
                      <th>CAMPUS</th>
                      <th>STATUS</th>
                      <th>PROFILE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ color: "var(--muted)" }}>No interns found.</td>
                      </tr>
                    )}
                    {rows.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="who">
                            <span className="av">{initials(p.name)}</span>
                            {p.name}
                          </div>
                        </td>
                        <td>{p.studentNo}</td>
                        <td>{p.studentNo}@tut4life.ac.za</td>
                        <td>{p.campus}</td>
                        <td><span className={pillClass(p.status)}>{p.status}</span></td>
                        <td>
                          <button type="button" className="btn" onClick={() => setSelectedId(p.id)}>
                            View profile →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="foot">
                <span>
                  {filtered.length
                    ? `Showing ${start + 1}–${start + rows.length} of ${filtered.length} interns`
                    : "Showing 0 interns"}
                </span>
                <div className="pager">
                  <span>Rows per page</span>
                  <select
                    className="field"
                    style={{ height: 38 }}
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                  </select>
                  <button type="button" className="pg" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                    Previous
                  </button>
                  {Array.from(
                    { length: Math.min(pageCount, 3) },
                    (_, i) => Math.min(Math.max(current - 1, 1), Math.max(pageCount - 2, 1)) + i
                  ).map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`pg${n === current ? " on" : ""}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button type="button" className="pg" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default InternsPage;