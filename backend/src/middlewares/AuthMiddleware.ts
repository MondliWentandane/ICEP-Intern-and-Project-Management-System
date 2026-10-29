
import type { NextFunction, Response } from "express";
import type { Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { authRepository } from "../repositories/AuthRepository";
import internService from "../services/InternService";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
}

const getJwtSecret = (): string | null => {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length >= 32 ? secret : null;
};

/**
 * Verifies the JWT and confirms that the account is active.
 * UML method: verifyToken()
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Authentication token is required.",
    });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({
      message: "Authentication token is required.",
    });
    return;
  }

  const secret = getJwtSecret();

  if (!secret) {
    res.status(500).json({
      message: "Authentication is temporarily unavailable.",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof (decoded as JwtPayload).role !== "string"
    ) {
      res.status(401).json({
        message: "Invalid authentication token.",
      });
      return;
    }

    const user = await authRepository.findById(decoded.sub);

    if (!user || !user.isActive) {
      res.status(401).json({
        message: "The account is unavailable. Please sign in again.",
      });
      return;
    }

    if (
  user.role === "INTERN" &&
  (await internService.hasInternshipEnded(user.id))
) {
  res.status(403).json({
    message: "Your internship has ended. Access is no longer permitted.",
  });
  return;
}

    req.user = {
      id: user.id,
      role: user.role,
      name: user.fullName,
      email: user.email,
    };

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Invalid or expired authentication token.",
      });
      return;
    }

    console.error("Authentication middleware error:", error);

    res.status(500).json({
      message: "An unexpected authentication error occurred.",
    });
  }
};

/**
 * Allows access only to specified roles.
 * UML method: authorizeRole()
 */
export const authorizeRole = (...allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
      return;
    }

    next();
  };
};

/**
 * Checks authentication and then checks the allowed roles.
 * UML method: authorizationCheck()
 */
export const authorizationCheck = (...allowedRoles: string[]) => {
  const checkRole = authorizeRole(...allowedRoles);

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    checkRole(req, res, next);
  };
};

/**
 * Compatibility aliases for existing project routes.
 */
export const authenticateToken = verifyToken;
export const authorizeRoles = authorizeRole;

export default verifyToken;
