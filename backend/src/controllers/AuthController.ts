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

      if (
        message === "This account is inactive." ||
        message.startsWith("Your internship has ended")
      ) {
        res.status(403).json({ message });
        return;
      }

      if (
        message.startsWith(
          "Authentication is not configured correctly."
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
      message:
        "Logout successful. Please discard your authentication token.",
    });
  }

  /**
   * Returns the authenticated user's information.
   * Requires AuthMiddleware.verifyToken to run first.
   */
  async verifyToken(
    req: AuthenticatedRequest,
    res: Response
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
   * Verifies the OTP and saves the new password.
   */
  async resetPasswordWithOTP(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { otp, newPassword } = req.body ?? {};

      if (
        typeof otp !== "string" ||
        !/^\d{6}$/.test(otp)
      ) {
        res.status(400).json({
          message: "A valid 6-digit OTP is required.",
        });
        return;
      }

      if (
        typeof newPassword !== "string" ||
        newPassword.length < 8
      ) {
        res.status(400).json({
          message:
            "New password must be at least 8 characters long.",
        });
        return;
      }

      await authService.confirmPasswordSetup(
        otp,
        newPassword
      );

      res.status(200).json({
        message:
          "Your password has been successfully reset. You can now log in.",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reset password.";

      res.status(400).json({ message });
    }
  }

  /**
   * Allows an authenticated user to change their password.
   */
  async changePassword(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          message: "Authentication is required.",
        });
        return;
      }

      const { oldPassword, newPassword } = req.body ?? {};

      if (
        typeof oldPassword !== "string" ||
        typeof newPassword !== "string" ||
        !oldPassword ||
        !newPassword
      ) {
        res.status(400).json({
          message:
            "Current password and new password are required.",
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          message:
            "New password must contain at least 8 characters.",
        });
        return;
      }

      await authService.changePassword(
        userId,
        oldPassword,
        newPassword
      );

      res.status(200).json({
        message: "Password changed successfully.",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to change password.";

      if (message === "Incorrect current password.") {
        res.status(400).json({ message });
        return;
      }

      if (
        message === "User not found or password not set."
      ) {
        res.status(404).json({ message });
        return;
      }

      console.error("Change password error:", error);

      res.status(500).json({
        message:
          "An unexpected error occurred while changing the password.",
      });
    }
  }

  /**
   * Allows an authenticated user to update their own profile.
   */
  async updateProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          message: "Authentication is required.",
        });
        return;
      }

      const updatedProfile =
        await authService.updateProfile(
          userId,
          req.body
        );

      res.status(200).json({
        message: "Profile updated successfully.",
        user: updatedProfile,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update profile.";

      if (
        message === "Invalid profile information." ||
        message === "Full name must be a string." ||
        message ===
          "Full name must contain at least 2 characters." ||
        message === "Phone number must be a string or null." ||
        message ===
          "Provide a full name or phone number to update." ||
        message.startsWith("Cannot update field:")
      ) {
        res.status(400).json({ message });
        return;
      }

      if (message === "User not found or inactive.") {
        res.status(403).json({ message });
        return;
      }

      console.error("Update profile error:", error);

      res.status(500).json({
        message:
          "An unexpected error occurred while updating the profile.",
      });
    }
  }
}

export const authController = new AuthController();

export default authController;