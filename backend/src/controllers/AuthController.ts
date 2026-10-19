
import type { Request, Response } from "express";
import { authService } from "../services/AuthService";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body ?? {};

      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
      ) {
        res.status(400).json({
          message: "A valid email and password are required.",
        });
        return;
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        message: "Login successful.",
        ...result,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Login failed.";

      if (message === "Email and password are required.") {
        res.status(400).json({ message });
        return;
      }

      if (message === "Invalid email or password.") {
        res.status(401).json({
          message: "Invalid email or password.",
        });
        return;
      }

      if (message === "This account is inactive.") {
        res.status(403).json({ message });
        return;
      }

      if (
        message.startsWith("Authentication is not configured correctly.")
      ) {
        res.status(500).json({
          message: "Authentication is temporarily unavailable.",
        });
        return;
      }

      console.error("Login error:", error);

      res.status(500).json({
        message: "An unexpected error occurred during login.",
      });
    }
  }
}

export const authController = new AuthController();

export default authController;
