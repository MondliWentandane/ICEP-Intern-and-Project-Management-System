// WIL (Work-Integrated Learning) placement letter as a PDF, attached to the acceptance email.
// Same wording and details as the letter the Track application page shows
// (frontend/src/features/placement-letter/placementLetter.ts), so both always match.
import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma";

const NAVY = "#1B3A5C";
const INK = "#1A202C";
const MUTED = "#718096";
const LINE = "#D1D9E2";

const longDate = (date: Date) =>
  new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" }).format(date);

export type PlacementLetterFile = { fileName: string; pdf: Buffer };

export class PlacementLetterService {
  /** Builds the letter for an ACCEPTED application. */
  async generate(applicationId: string): Promise<PlacementLetterFile> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        position: { include: { campus: true, department: true, intake: true } },
        reviewedBy: { select: { fullName: true } },
        intern: { select: { startDate: true, endDate: true } },
      },
    });
    if (!application) throw new Error(`Application ${applicationId} not found.`);
    if (application.status !== "ACCEPTED") throw new Error("A placement letter is only issued for accepted applications.");

    const { position } = application;
    const start = application.intern?.startDate ?? position.intake.startDate;
    const end = application.intern?.endDate ?? position.intake.endDate;
    const issuedAt = application.reviewedAt ?? new Date();
    const rows: [string, string][] = [
      ["Student", application.fullName],
      ["Student number", application.studentNumber],
      ["Institution", application.institution],
      ["Qualification", application.qualification],
      ["Placement role", position.title],
      ["Department", position.department.name],
      ["Campus", `${position.campus.name} Campus`],
      ["Intake", position.intake.name],
      ["Placement period", `${longDate(start)} to ${longDate(end)}`],
    ];

    const pdf = await render((doc) => {
      const left = 64;
      const width = doc.page.width - left * 2;

      // Letterhead band
      doc.rect(0, 0, doc.page.width, 92).fill(NAVY);
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(26).text("ICEP", left, 30);
      doc.font("Helvetica").fontSize(9).fillColor("#D7DFE9").text("Intern & Project Management Programme", left, 60);
      doc.fontSize(10).fillColor("#FFFFFF").text(`${position.campus.name} Campus`, left, 40, { width, align: "right" });

      doc.fillColor(INK).font("Helvetica").fontSize(11);
      doc.text(`Date: ${longDate(issuedAt)}`, left, 124);
      doc.text(`Reference: ${application.referenceCode}`);
      doc.moveDown();
      doc.text(application.fullName);
      doc.text(`Student number: ${application.studentNumber}`);
      doc.text(application.institution);

      doc.moveDown(1.6);
      doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY).text("RE: WORK-INTEGRATED LEARNING (WIL) PLACEMENT LETTER", left);
      doc.moveDown(0.8);
      doc.font("Helvetica").fontSize(11).fillColor(INK);
      doc.text(`Dear ${application.fullName},`);
      doc.moveDown(0.6);
      doc.text(
        "We are pleased to confirm that you have been accepted for a Work-Integrated Learning (WIL) placement with ICEP. " +
        "This letter serves as official confirmation of your placement for the purposes of your WIL / experiential learning " +
        `requirements at ${application.institution}.`,
        { width, align: "justify" },
      );
      doc.moveDown(0.8);

      // Details table
      for (const [label, value] of rows) {
        const y = doc.y;
        doc.font("Helvetica-Bold").fillColor(NAVY).text(label, left + 8, y + 6, { width: 150 });
        doc.font("Helvetica").fillColor(INK).text(value, left + 170, y + 6, { width: width - 178 });
        const bottom = Math.max(doc.y, y + 22) + 4;
        doc.moveTo(left, bottom).lineTo(left + width, bottom).lineWidth(0.6).strokeColor(LINE).stroke();
        doc.y = bottom;
      }
      doc.x = left;
      doc.moveDown(1);

      doc.font("Helvetica").fillColor(INK).text(
        "During your placement you will be assigned to project work under the guidance of a mentor, and your progress will be " +
        "tracked on the ICEP Intern & Project Management System. You are expected to comply with ICEP's policies, maintain " +
        "confidentiality and keep regular attendance. ICEP will provide the reports and evaluations your institution requires " +
        "to complete your WIL component.",
        left, doc.y, { width, align: "justify" },
      );
      doc.moveDown(0.8);
      doc.text("Congratulations, and welcome to ICEP.");
      doc.moveDown(1.6);
      doc.text("Yours sincerely,");
      doc.moveDown(2.2);
      doc.moveTo(left, doc.y).lineTo(left + 180, doc.y).lineWidth(0.8).strokeColor(MUTED).stroke();
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").fillColor(INK).text(application.reviewedBy?.fullName ?? "WIL Coordinator", left);
      doc.font("Helvetica").fillColor(MUTED).fontSize(10).text("WIL Handler, ICEP");

      // Footer sits in the bottom margin: lift the margin so it doesn't start a second page.
      doc.page.margins.bottom = 0;
      doc.fontSize(8.5).fillColor(MUTED).text(
        `Issued by the ICEP Intern & Project Management System · Reference ${application.referenceCode}`,
        left, doc.page.height - 48, { width, align: "center", lineBreak: false },
      );
    });

    const safeName = application.fullName.trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
    return { fileName: `WIL_Placement_Letter_${safeName}.pdf`, pdf };
  }
}

function render(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 64, info: { Title: "WIL Placement Letter", Author: "ICEP" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    draw(doc);
    doc.end();
  });
}

export const placementLetterService = new PlacementLetterService();

export default placementLetterService;
