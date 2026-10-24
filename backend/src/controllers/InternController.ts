import { Request, Response } from "express";
import internService, { InternshipError } from "../services/InternService";
import type { AuthenticatedRequest } from "../middlewares/AuthMiddleware";
import { InternFilters } from "../repositories/InternRepository";

class InternController {
  async getAllInterns(req: Request, res: Response) {
    try {
      const filters: InternFilters = {};

      const { departmentId, skill, status } = req.query;

      if (typeof departmentId === "string" && departmentId.trim()) {
        filters.departmentId = departmentId.trim();
      }

      if (typeof skill === "string" && skill.trim()) {
        filters.skill = skill.trim();
      }

      if (
        typeof status === "string" &&
        ["ACTIVE", "COMPLETED", "WITHDRAWN"].includes(status)
      ) {
        filters.status = status as InternFilters["status"];
      } else if (status !== undefined) {
        return res.status(400).json({
          message: "Invalid status filter.",
          allowedValues: ["ACTIVE", "COMPLETED", "WITHDRAWN"],
        });
      }

      const interns = await internService.getAllInterns(filters);

      return res.status(200).json({
        message: "Interns retrieved successfully.",
        count: interns.length,
        data: interns,
      });
    } catch (error) {
      console.error("Error retrieving interns:", error);

      return res.status(500).json({
        message: "Failed to retrieve interns.",
      });
    }
  }

  async getInternById(req: Request, res: Response) {
    try {
      const id = req.params.id;

if (typeof id !== "string") {
  res.status(400).json({ message: "Invalid intern ID" });
  return;
}

const intern = await internService.getInternById(id);

      return res.status(200).json({
        message: "Intern retrieved successfully.",
        data: intern,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Intern not found.") {
        return res.status(404).json({
          message: error.message,
        });
      }

      console.error("Error retrieving intern:", error);

      return res.status(500).json({
        message: "Failed to retrieve intern.",
      });
    }
  }

  /** PUT /interns/:id/status  { outcome: COMPLETED | RESIGNED | DISMISSED, reason?, endDate? }  or  { outcome: REINSTATE, endDate } */
  async updateStatus(req: Request, res: Response) {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const actorId = (req as AuthenticatedRequest).user?.id ?? null;
    const body = req.body ?? {};
    try {
      const intern = body.outcome === "REINSTATE"
        ? await internService.reinstate(id, body, actorId)
        : await internService.endInternship(id, body, actorId);
      return res.status(200).json({ message: "Internship updated.", data: intern });
    } catch (error) {
      if (error instanceof InternshipError) return res.status(error.status).json({ message: error.message });
      console.error("Error updating internship status:", error);
      return res.status(500).json({ message: "Failed to update the internship." });
    }
  }

  /** GET /past-interns */
  async getPastInterns(_req: Request, res: Response) {
    try {
      const interns = await internService.getPastInterns();
      return res.status(200).json({ message: "Past interns retrieved successfully.", count: interns.length, data: interns });
    } catch (error) {
      console.error("Error retrieving past interns:", error);
      return res.status(500).json({ message: "Failed to retrieve past interns." });
    }
  }
}

export default new InternController();