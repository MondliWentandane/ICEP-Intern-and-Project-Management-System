import type { Request, Response } from "express";
import { userService } from "../services/UserService";

const isPrismaErrorCode = (error: unknown, code: string): boolean =>
  typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === code;

const sendError = (res: Response, error: unknown, fallback: string) => {
  if (isPrismaErrorCode(error, "P2002")) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }
  const err = error as Error & { statusCode?: number };
  if (!err.statusCode) console.error(fallback, error);
  return res.status(err.statusCode ?? 500).json({ error: err.statusCode ? err.message : fallback });
};

const routeParam = (value: string | string[] | undefined): string =>
  typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";

export class UserController {
  /** GET /users (Admin) */
  static async listUsers(_req: Request, res: Response) {
    try { return res.json(await userService.listUsers()); }
    catch (error) { return sendError(res, error, "Could not load users."); }
  }

  /** POST /users (Admin). Body: { fullName, email, role: ADMIN | WIL_HANDLER | MENTOR, phone?, departmentId? (required for MENTOR) } */
  static async createUser(req: Request, res: Response) {
    try { return res.status(201).json(await userService.createUser(req.body ?? {})); }
    catch (error) { return sendError(res, error, "Could not create the user."); }
  }

  /** POST /users/:id/resend-invite (Admin) */
  static async resendInvite(req: Request, res: Response) {
    try {
      await userService.resendInvite(routeParam(req.params.id));
      return res.json({ message: "Password setup email sent." });
    } catch (error) { return sendError(res, error, "Could not send the password setup email."); }
  }

  /** GET /departments (any logged-in user): lookup for forms and filters */
  static async listDepartments(_req: Request, res: Response) {
    try { return res.json(await userService.listDepartments()); }
    catch (error) { return sendError(res, error, "Could not load departments."); }
  }
}

export default UserController;
