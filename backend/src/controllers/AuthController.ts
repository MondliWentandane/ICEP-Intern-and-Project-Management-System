
import type { Request, Response } from "express";
import { authService } from "../services/AuthService";
import type { AuthenticatedRequest } from "../middlewares/AuthMiddleware";

export class AuthController {
  /**
   * Logs in a user and returns an authentication token.
   */
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

      const result = await authService.loginUser(email, password);

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

      if (message === "This account is inactive." || message.startsWith("Your internship has ended")) {
        res.status(403).json({ message });
        return;
      }

      if (
        message.startsWith(
          "Authentication is not configured correctly.",
        )
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

  /**
   * Logs out the user on the client side.
   */
  async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      message: "Logout successful. Please discard your authentication token.",
    });
  }

  /**
 * Returns the authenticated user's information.
 * Requires AuthMiddleware.verifyToken to run first.
 */
  async verifyToken(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required.",
      });
      return;
    }

    res.status(200).json({
      message: "Token verified successfully.",
      user: {
        id: req.user.id,
        role: req.user.role,
      },
    });
  }

  /**
   * Verifies the 6-digit OTP and saves the new password.
   */
  async resetPasswordWithOTP(req: Request, res: Response): Promise<void> {
    try {
      const { otp, newPassword } = req.body;

      if (typeof otp !== "string" || !otp.trim()) {
        res.status(400).json({ message: "The 6-digit OTP is required." });
        return;
      }

      if (typeof newPassword !== "string" || newPassword.length < 8) {
        res.status(400).json({ message: "New password must be at least 8 characters long." });
        return;
      }

      // We reuse your existing, highly secure confirmPasswordSetup method!
      await authService.confirmPasswordSetup(otp, newPassword);

      res.status(200).json({ message: "Your password has been successfully reset. You can now log in." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reset password.";
      // If the OTP is expired or invalid, your authService will throw the correct error message here
      res.status(400).json({ message });
    }
  }

  /**
   * Handles authenticated password change requests.
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { oldPassword, newPassword } = req.body ?? {};

      if (!userId) {
        res.status(401).json({ message: "Authentication is required." });
        return;
      }

      await authService.changePassword(userId, oldPassword, newPassword);

      res.status(200).json({ message: "Password updated successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to change password.";
      res.status(400).json({ message });
    }
  }
}

export const authController = new AuthController();

export default authController;
