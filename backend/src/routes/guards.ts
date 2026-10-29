// Shared route guards + helpers for every file in /routes.
//
// WHY THIS FILE EXISTS
// The route files were written against an `AuthMiddleware` class (verifyToken / authorizeRole /
// authorizationCheck) but middlewares/AuthMiddleware.ts really exports the functions
// `authenticateToken` and `authorizeRoles`, and has no resource-ownership check at all.
// This adapter maps the names the routes use onto the real middleware and implements the
// ownership check, so no file outside /routes has to change.
import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  authenticateToken,
  authorizeRoles,
  type AuthenticatedRequest,
} from "../middlewares/AuthMiddleware";
import { prisma } from "../config/prisma";

const param = (value: string | string[] | undefined): string =>
  typeof value === "string" ? value : Array.isArray(value) ? (value[0] ?? "") : "";

/**
 * Resource-level check used after verifyToken + authorizeRole.
 *  - ADMIN / WIL_HANDLER: always allowed.
 *  - INTERN : only their own intern record, or a project they are (still) assigned to.
 *  - MENTOR : only interns they supervise (directly or via a project they supervise),
 *             can read project details, and can mutate projects they supervise.
 * Applies to /interns/:id... and /projects/:id... (anything else is let through).
 */
const authorizationCheck: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ message: "Authentication is required." });
    return;
  }
  if (user.role === "ADMIN" || user.role === "WIL_HANDLER") {
    next();
    return;
  }

  const id = param(req.params.id);
  if (!id) {
    next();
    return;
  }

  try {
    let allowed = false;
    const isInternRoute = req.path.startsWith("/interns/");
    const isProjectRoute = req.path.startsWith("/projects/");

    if (isInternRoute) {
      if (user.role === "INTERN") {
        const intern = await prisma.intern.findUnique({ where: { id }, select: { userId: true } });
        allowed = intern?.userId === user.id;
      } else if (user.role === "MENTOR") {
        const count = await prisma.intern.count({
          where: {
            id,
            OR: [
              { mentor: { userId: user.id } },
              { assignments: { some: { project: { supervisor: { userId: user.id } } } } },
            ],
          },
        });
        allowed = count > 0;
      }
    } else if (isProjectRoute) {
      if (user.role === "INTERN") {
        const count = await prisma.projectAssignment.count({
          where: { projectId: id, leftAt: null, intern: { userId: user.id } },
        });
        allowed = count > 0;
      } else if (user.role === "MENTOR") {
        if (req.method === "GET") {
          allowed = (await prisma.project.count({ where: { id } })) > 0;
        } else {
          allowed = (await prisma.project.count({ where: { id, supervisor: { userId: user.id } } })) > 0;
        }
      }
    } else {
      allowed = true;
    }

    if (!allowed) {
      res.status(403).json({ message: "You do not have permission to access this resource." });
      return;
    }
    next();
  } catch (error: unknown) {
    console.error("Authorization check error:", error);
    res.status(500).json({ message: "An unexpected authorization error occurred." });
  }
};

export const AuthMiddleware = {
  verifyToken: authenticateToken as RequestHandler,
  authorizeRole: (...roles: string[]) => authorizeRoles(...roles) as RequestHandler,
  authorizationCheck,
};

/**
 * Placeholder for endpoints whose controller method has not been written yet.
 * Keeps the route table complete (and the server booting) but answers 501 instead of crashing.
 * Replace `notImplemented("...")` with the real controller method once it exists.
 */
export const notImplemented =
  (name: string): RequestHandler =>
  (_req: Request, res: Response): void => {
    res.status(501).json({ message: `${name} is not implemented yet.` });
  };
