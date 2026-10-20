// WIL (Work-Integrated Learning) placement letter, issued once an applicant is accepted as an intern.
// Built in the browser as a standalone HTML document; "Download" opens the print dialog so the
// person can print it or choose "Save as PDF".
// TODO: swap for a letter served by the API once the backend provides one.

export interface PlacementLetterDetails {
  fullName: string
  reference: string
  studentNumber?: string
  institution?: string
  qualification?: string
  positionTitle: string
  department?: string
  campus: string
  intake?: string
  startDate?: string
  endDate?: string
  issuedAt: string
  signatory?: string
}

const longDate = (iso: string) => new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export const placementLetterFileName = (fullName: string) =>
  `WIL_Placement_Letter_${fullName.trim().replace(/[^a-z0-9]+/gi, '_')}`

export function buildPlacementLetterHtml(details: PlacementLetterDetails): string {
  const e = (value: string) => escapeHtml(value)
  const period = details.startDate && details.endDate ? `${longDate(details.startDate)} to ${longDate(details.endDate)}` : undefined
  const rows: [string, string | undefined][] = [
    ['Student', details.fullName],
    ['Student number', details.studentNumber],
    ['Institution', details.institution],
    ['Qualification', details.qualification],
    ['Placement role', details.positionTitle],
    ['Department', details.department],
    ['Campus', `${details.campus} Campus`],
    ['Intake', details.intake],
    ['Placement period', period],
  ]
  const institution = details.institution ?? 'your institution'

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${e(placementLetterFileName(details.fullName))}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #1A202C; font-size: 13px; line-height: 1.55; background: #fff; }
  .page { width: 210mm; min-height: 297mm; padding: 0 22mm 18mm; margin: 0 auto; position: relative; }
  .head { background: #1B3A5C; color: #fff; margin: 0 -22mm 10mm; padding: 9mm 22mm; display: flex; justify-content: space-between; align-items: flex-end; }
  .head strong { font-size: 26px; letter-spacing: 1px; display: block; }
  .head span { font-size: 11px; opacity: .85; }
  .meta p { margin: 0; }
  h1 { font-size: 15px; color: #1B3A5C; margin: 8mm 0 5mm; letter-spacing: .3px; }
  p { margin: 0 0 4mm; text-align: justify; }
  table { border-collapse: collapse; width: 100%; margin: 2mm 0 6mm; }
  td { padding: 2mm 3mm; border-bottom: 1px solid #D1D9E2; vertical-align: top; }
  td:first-child { width: 42mm; font-weight: 700; color: #1B3A5C; }
  .sign { margin-top: 14mm; }
  .sign .line { width: 60mm; border-top: 1px solid #718096; margin: 14mm 0 2mm; }
  .sign small { color: #718096; }
  .foot { position: absolute; left: 22mm; right: 22mm; bottom: 10mm; text-align: center; font-size: 10px; color: #718096; }
</style></head>
<body><div class="page">
  <div class="head"><div><strong>ICEP</strong><span>Intern &amp; Project Management Programme</span></div><span>${e(details.campus)} Campus</span></div>
  <div class="meta">
    <p>Date: ${e(longDate(details.issuedAt))}</p>
    <p>Reference: ${e(details.reference)}</p>
    <br>
    <p>${e(details.fullName)}</p>
    ${details.studentNumber ? `<p>Student number: ${e(details.studentNumber)}</p>` : ''}
    ${details.institution ? `<p>${e(details.institution)}</p>` : ''}
  </div>
  <h1>RE: WORK-INTEGRATED LEARNING (WIL) PLACEMENT LETTER</h1>
  <p>Dear ${e(details.fullName)},</p>
  <p>We are pleased to confirm that you have been accepted for a Work-Integrated Learning (WIL) placement with ICEP.
  This letter serves as official confirmation of your placement for the purposes of your WIL / experiential learning
  requirements at ${e(institution)}.</p>
  <table>${rows.filter(([, value]) => value).map(([label, value]) => `<tr><td>${e(label)}</td><td>${e(value!)}</td></tr>`).join('')}</table>
  <p>During your placement you will be assigned to project work under the guidance of a mentor, and your progress will be
  tracked on the ICEP Intern &amp; Project Management System. You are expected to comply with ICEP's policies, maintain
  confidentiality and keep regular attendance. ICEP will provide the reports and evaluations your institution requires
  to complete your WIL component.</p>
  <p>Congratulations, and welcome to ICEP.</p>
  <div class="sign">
    <p>Yours sincerely,</p>
    <div class="line"></div>
    <strong>${e(details.signatory ?? 'WIL Coordinator')}</strong><br><small>WIL Handler, ICEP</small>
  </div>
  <div class="foot">Issued by the ICEP Intern &amp; Project Management System · Reference ${e(details.reference)}</div>
</div></body></html>`
}

/** Opens the browser print dialog for the letter (the person can print it or choose "Save as PDF"). */
export function printPlacementLetter(details: PlacementLetterDetails) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
  frame.srcdoc = buildPlacementLetterHtml(details)
  frame.onload = () => {
    const view = frame.contentWindow
    if (!view) return
    view.addEventListener('afterprint', () => frame.remove())
    view.focus()
    view.print()
    // Fallback cleanup for browsers that don't fire afterprint.
    setTimeout(() => frame.remove(), 60_000)
  }
  document.body.appendChild(frame)
}
