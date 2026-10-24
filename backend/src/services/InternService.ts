import internRepository, {
  InternFilters,
  type InternshipAction,
} from "../repositories/InternRepository";

/** How the WIL Handler ends an internship. RESIGNED and DISMISSED are both stored as WITHDRAWN. */
export type InternshipOutcome = "COMPLETED" | "RESIGNED" | "DISMISSED";
const OUTCOMES: Record<InternshipOutcome, { status: "COMPLETED" | "WITHDRAWN"; action: InternshipAction }> = {
  COMPLETED: { status: "COMPLETED", action: "INTERNSHIP_COMPLETED" },
  RESIGNED: { status: "WITHDRAWN", action: "INTERNSHIP_RESIGNED" },
  DISMISSED: { status: "WITHDRAWN", action: "INTERNSHIP_DISMISSED" },
};
/** Outcome labels on the Past Interns page. */
const OUTCOME_LABELS: Record<string, "Completed" | "Withdrawn" | "Terminated"> = {
  INTERNSHIP_COMPLETED: "Completed",
  INTERNSHIP_RESIGNED: "Withdrawn",
  INTERNSHIP_DISMISSED: "Terminated",
};
const PLACEMENT_ENDED = "Placement period ended";

/** Errors the controller turns into 4xx responses. */
export class InternshipError extends Error {
  constructor(message: string, public status: 400 | 404 | 409) {
    super(message);
  }
}

/** Today's date in South Africa as a date-only value (Prisma returns @db.Date columns as UTC midnight). */
const today = () =>
  new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(new Date())}T00:00:00.000Z`);

const parseDate = (value: unknown, field: string): Date | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new InternshipError(`${field} must be a date like 2027-01-31.`, 400);
  }
  return new Date(`${value}T00:00:00.000Z`);
};
const ymd = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 10) : null);

class InternService {
  async getAllInterns(filters: InternFilters = {}) {
    return internRepository.findAll(filters);
  }

  async getInternById(id: string) {
    if (!id || id.trim() === "") {
      throw new Error("Intern ID is required.");
    }

    const intern = await internRepository.findById(id);

    if (!intern) {
      throw new Error("Intern not found.");
    }

    const [ending] = intern.status === "ACTIVE" ? [] : await internRepository.findEndings([intern.id]);
    return {
      ...intern,
      ending: ending && ending.action !== "INTERNSHIP_REINSTATED"
        ? { outcome: OUTCOME_LABELS[ending.action], reason: (ending.metadata as { reason?: string } | null)?.reason ?? null, endedBy: ending.actor?.fullName ?? null, endedAt: ending.createdAt }
        : null,
    };
  }

  /**
   * Ends an active internship: COMPLETED (finished), RESIGNED or DISMISSED (both WITHDRAWN).
   * The intern can no longer log in and moves to Past Interns. A reason is required unless completed.
   */
  async endInternship(id: string, input: { outcome?: unknown; reason?: unknown; endDate?: unknown }, actorId: string | null) {
    const outcome = typeof input.outcome === "string" ? (input.outcome.toUpperCase() as InternshipOutcome) : undefined;
    if (!outcome || !(outcome in OUTCOMES)) throw new InternshipError("Choose how the internship ended: COMPLETED, RESIGNED or DISMISSED.", 400);
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";
    if (outcome !== "COMPLETED" && reason.length < 3) throw new InternshipError("Give a reason for the resignation or dismissal.", 400);

    const intern = await internRepository.findById(id);
    if (!intern) throw new InternshipError("Intern not found.", 404);
    if (intern.status !== "ACTIVE") throw new InternshipError("This internship has already ended.", 409);

    const endDate = parseDate(input.endDate, "End date") ?? today();
    if (endDate > today()) throw new InternshipError("The end date can't be in the future. The internship ends automatically after its end date.", 400);
    // An intern who withdraws before their start date ends on the day it's recorded.
    const earliest = intern.startDate && intern.startDate < today() ? intern.startDate : today();
    if (intern.startDate && endDate < earliest) {
      throw new InternshipError(intern.startDate > today() ? "This internship hasn't started yet, so its last day can only be today." : "The end date can't be before the start date.", 400);
    }

    const { status, action } = OUTCOMES[outcome];
    return internRepository.close(intern, { status, endDate, action, reason: reason || null, actorId });
  }

  /** Makes an ended internship active again with a new end date (ended by mistake, or extended). */
  async reinstate(id: string, input: { endDate?: unknown }, actorId: string | null) {
    const intern = await internRepository.findById(id);
    if (!intern) throw new InternshipError("Intern not found.", 404);
    if (intern.status === "ACTIVE") throw new InternshipError("This internship is already active.", 409);
    const endDate = parseDate(input.endDate, "New end date");
    if (!endDate || endDate < today()) throw new InternshipError("Choose a new end date from today onwards.", 400);
    return internRepository.reinstate(intern, endDate, actorId);
  }

  /** Completed and withdrawn internships for the Past Interns page. */
  async getPastInterns() {
    const interns = await internRepository.findPast();
    const endings = interns.length ? await internRepository.findEndings(interns.map((intern) => intern.id)) : [];
    const latest = new Map<string, (typeof endings)[number]>();
    for (const ending of endings) if (ending.entityId && !latest.has(ending.entityId)) latest.set(ending.entityId, ending);

    return interns.map((intern) => {
      const ending = latest.get(intern.id);
      const outcome = (ending && OUTCOME_LABELS[ending.action]) || (intern.status === "COMPLETED" ? "Completed" : "Withdrawn");
      return {
        id: intern.id,
        name: intern.user.fullName,
        email: intern.user.email,
        campus: intern.campus.name,
        department: intern.department.name,
        intake: intern.intake.name,
        project: intern.assignments[0]?.project.name ?? null,
        mentor: intern.mentor?.user.fullName ?? null,
        startDate: ymd(intern.startDate ?? intern.intake.startDate),
        endDate: ymd(intern.endDate ?? intern.intake.endDate),
        outcome,
        reason: (ending?.metadata as { reason?: string } | null)?.reason ?? null,
        endedBy: ending ? (ending.actor?.fullName ?? "System") : null,
        endedAt: ending?.createdAt ?? null,
      };
    });
  }

  /**
   * Moves every ACTIVE intern whose placement period is over to COMPLETED (login turned off).
   * Runs when the server starts and then every hour.
   */
  async archiveFinishedInternships() {
    const ended = await internRepository.findEndedButActive(today());
    for (const intern of ended) {
      await internRepository.close(intern, { status: "COMPLETED", endDate: intern.endDate!, action: "INTERNSHIP_COMPLETED", reason: PLACEMENT_ENDED, actorId: null });
    }
    return ended.length;
  }

  /**
   * Login check for interns: true when their internship is over. An intern whose end date has
   * passed but who wasn't archived yet is archived now, so they can't get in before the hourly run.
   */
  async hasInternshipEnded(userId: string) {
    const intern = await internRepository.findByUserId(userId);
    if (!intern) return false;
    if (intern.status !== "ACTIVE") return true;
    if (intern.endDate && intern.endDate < today()) {
      await internRepository.close(intern, { status: "COMPLETED", endDate: intern.endDate, action: "INTERNSHIP_COMPLETED", reason: PLACEMENT_ENDED, actorId: null });
      return true;
    }
    return false;
  }
}

export default new InternService();
