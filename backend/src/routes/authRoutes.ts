// Auth & user accounts — AuthController (owners: Karabo & Makgabo).
import { Router } from "express";
import type { Request, Response } from "express";
import { authController } from "../controllers/AuthController";
import { ApplicationController } from "../controllers/ApplicationController";
import { AuthMiddleware, notImplemented } from "./guards";

// Access guards (roles match the Prisma Role enum): verifyToken first, then the role check.
const authenticated = [AuthMiddleware.verifyToken];
const adminOnly = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN")];

const router = Router();

// ---- Public ----------------------------------------------------------------
router.post("/auth/login", (req, res) => authController.login(req, res));
router.post("/auth/forgot-password", notImplemented("POST /auth/forgot-password")); // AuthController.forgotPassword not written yet
// Set / reset password via the emailed one-time link. Body: { token, password }.
// /create-password is what the frontend calls; /set-password is the path in the sequence diagram.
router.post("/auth/create-password", ApplicationController.setPassword);
router.post("/auth/set-password", ApplicationController.setPassword);

// ---- Any logged-in user ----------------------------------------------------
router.get("/auth/me", authenticated, (req:Request, res:Response) =>
  authController.verifyToken(req, res),
); // AuthController.verifyToken not written yet
router.post("/auth/logout", authenticated, (req:Request, res:Response) =>
  authController.logout(req, res),
);
router.put("/auth/profile", authenticated, notImplemented("PUT /auth/profile"));
router.put("/auth/change-password", authenticated, notImplemented("PUT /auth/change-password"));

// ---- User management (Admin only: "Users" page) ----------------------------
router.get("/users", adminOnly, notImplemented("GET /users"));
router.post("/users", adminOnly, notImplemented("POST /users"));
router.get("/users/:id", adminOnly, notImplemented("GET /users/:id"));
router.put("/users/:id", adminOnly, notImplemented("PUT /users/:id"));
router.put("/users/:id/status", adminOnly, notImplemented("PUT /users/:id/status")); // activate / deactivate

export default router;
