// Auth & user accounts — AuthController (owners: Karabo & Makgabo).
import { Router } from "express";
import type { Request, Response } from "express";
import { authController } from "../controllers/AuthController";
import { ApplicationController } from "../controllers/ApplicationController";
import { UserController } from "../controllers/UserController";
import { AuthMiddleware, notImplemented } from "./guards";
import { EmailController } from "../controllers/EmailController";

// Access guards (roles match the Prisma Role enum).
const authenticated = [AuthMiddleware.verifyToken];
const adminOnly = [
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorizeRole("ADMIN"),
];

const router = Router();

// ---- Public ----------------------------------------------------------------
router.post("/auth/login", (req, res) =>
  authController.login(req, res)
);

router.post("/auth/forgot-password", (req, res) =>
  EmailController.sendForgotPasswordOTP(req, res)
);

router.post("/auth/reset-password", (req, res) =>
  authController.resetPasswordWithOTP(req, res)
);

// Set / reset password via the emailed one-time link.
// Body: { token, password }.
router.post("/auth/create-password", ApplicationController.setPassword);
router.post("/auth/set-password", ApplicationController.setPassword);

// ---- Any logged-in user ----------------------------------------------------
router.get(
  "/auth/me",
  authenticated,
  (req: Request, res: Response) =>
    authController.verifyToken(req, res)
);

router.post(
  "/auth/logout",
  authenticated,
  (req: Request, res: Response) =>
    authController.logout(req, res)
);

router.put(
  "/auth/profile",
  authenticated,
  (req: Request, res: Response) =>
    authController.updateProfile(req, res)
);

router.put(
  "/auth/change-password",
  authenticated,
  (req: Request, res: Response) =>
    authController.changePassword(req, res)
);

// ---- User management (Admin only: "Users" page) ----------------------------
// Staff accounts are created without a password and emailed a setup link.
router.get("/users", adminOnly, UserController.listUsers);
router.post("/users", adminOnly, UserController.createUser);

router.post(
  "/users/:id/resend-invite",
  adminOnly,
  UserController.resendInvite
);

// Department lookup for the Add User form.
router.get(
  "/departments",
  authenticated,
  UserController.listDepartments
);

router.get(
  "/users/:id",
  adminOnly,
  notImplemented("GET /users/:id")
);

router.put(
  "/users/:id",
  adminOnly,
  notImplemented("PUT /users/:id")
);

router.put(
  "/users/:id/status",
  adminOnly,
  notImplemented("PUT /users/:id/status")
);

export default router;