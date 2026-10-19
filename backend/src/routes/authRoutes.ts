// Auth & user accounts — AuthController (owners: Karabo & Makgabo).
import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

// Access guards (roles match the Prisma Role enum): verifyToken first, then the role check.
const authenticated = [AuthMiddleware.verifyToken];
const adminOnly = [AuthMiddleware.verifyToken, AuthMiddleware.authorizeRole("ADMIN")];

const router = Router();

// ---- Public ----------------------------------------------------------------
router.post("/auth/login", AuthController.login);
router.post("/auth/forgot-password", AuthController.forgotPassword);
// Set / reset password via the emailed one-time link. Body: { token, password }.
// /create-password is what the frontend calls; /set-password is the path in the sequence diagram.
router.post("/auth/create-password", AuthController.setPassword);
router.post("/auth/set-password", AuthController.setPassword);

// ---- Any logged-in user ----------------------------------------------------
router.get("/auth/me", authenticated, AuthController.verifyToken);
router.post("/auth/logout", authenticated, AuthController.logout);
router.put("/auth/profile", authenticated, AuthController.updateProfile);
router.put("/auth/change-password", authenticated, AuthController.changePassword);

// ---- User management (Admin only: "Users" page) ----------------------------
router.get("/users", adminOnly, AuthController.getUsers);
router.post("/users", adminOnly, AuthController.createUser);
router.get("/users/:id", adminOnly, AuthController.getUser);
router.put("/users/:id", adminOnly, AuthController.updateUser);
router.put("/users/:id/status", adminOnly, AuthController.setUserStatus); // activate / deactivate

export default router;
