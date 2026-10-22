// Public careers positions (read-only) — used by the Careers page and the "Apply" pop-up.
// Returned in the same shape the frontend's CareerPosition type expects.
//
// Position.description holds the summary, optionally followed by a "Responsibilities:" list:
//   <summary paragraph>
//
//   Responsibilities:
//   - first item
//   - second item
// Position.requirements holds one requirement per line ("- " prefix optional).
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const include = { campus: true, department: true, intake: true } as const;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const listLines = (value: string) =>
  value.split(/\r?\n/).map((line) => line.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);

function category(departmentName: string) {
  const name = departmentName.toLowerCase();
  if (name.includes("cyber") || name.includes("security")) return "Cybersecurity";
  if (name.includes("system") || name.includes("infrastructure")) return "Systems Engineering";
  return "Software Development";
}

function monthsBetween(start: Date, end: Date) {
  const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth()) + 1;
  return Math.max(1, months);
}

type PositionRow = NonNullable<Awaited<ReturnType<typeof findOne>>>;
const findOne = (id: string) => prisma.position.findUnique({ where: { id }, include });

function toCareerPosition(position: PositionRow) {
  const [summary, ...rest] = position.description.split(/\r?\n\s*responsibilities:\s*\r?\n/i);
  return {
    id: position.id,
    title: position.title,
    category: category(position.department.name),
    campus: position.campus.name,
    durationMonths: monthsBetween(position.intake.startDate, position.intake.endDate),
    startDate: isoDate(position.intake.startDate),
    closingDate: isoDate(position.closingDate),
    openings: position.openings ?? 1,
    summary: summary.trim(),
    responsibilities: rest.length ? listLines(rest.join("\n")) : [],
    requirements: listLines(position.requirements),
  };
}

/** GET /positions — OPEN positions whose closing date has not passed. */
export async function listOpenPositions(_req: Request, res: Response) {
  try {
    const positions = await prisma.position.findMany({
      where: { status: "OPEN", closingDate: { gte: new Date(Date.now() - DAY_MS) } },
      include,
      orderBy: { closingDate: "asc" },
    });
    return res.json(positions.map(toCareerPosition));
  } catch (error) {
    console.error("GET /positions failed:", error);
    return res.status(500).json({ error: "Could not load positions" });
  }
}

/** GET /positions/:id — one position (the detail page also shows closed ones). */
export async function getPosition(req: Request, res: Response) {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const position = await findOne(id);
    if (!position || position.status === "DRAFT") return res.status(404).json({ error: "Position not found" });
    return res.json(toCareerPosition(position));
  } catch (error) {
    console.error("GET /positions/:id failed:", error);
    return res.status(500).json({ error: "Could not load the position" });
  }
}
