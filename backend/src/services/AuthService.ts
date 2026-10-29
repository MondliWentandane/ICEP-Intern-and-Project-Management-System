
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { authRepository } from "../repositories/AuthRepository";
import internService from "./InternService";

export class AuthService {
  /**
   * Validates the user's email, password, and account status.
   */
  async validateUser(email: string, password: string) {
    if (!email?.trim() || !password) {
      throw new Error("Email and password are required.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await authRepository.findUserByEmail(normalizedEmail);

    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    // Interns whose internship ended get their own message below, once the password is confirmed.
    if (!user.isActive && user.role !== "INTERN") {
      throw new Error("This account is inactive.");
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new Error("Invalid email or password.");
    }

    if (user.role === "INTERN" && (await internService.hasInternshipEnded(user.id))) {
      throw new Error("Your internship has ended, so this account can no longer log in.");
    }

    if (!user.isActive) {
      throw new Error("This account is inactive.");
    }

    return user;
  }

  /**
   * Authenticates a user and generates a JWT.
   */
  async loginUser(email: string, password: string) {
    return this.login(email, password);
  }

  /**
   * Logs in a user.
   * Kept for compatibility with the existing AuthController.
   */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error(
        "Authentication is not configured correctly. Contact the system administrator.",
      );
    }

    const expiresIn = (
      process.env.JWT_EXPIRES_IN || "1h"
    ) as SignOptions["expiresIn"];

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      secret,
      { expiresIn }
    );

    await authRepository.updateLastLogin(user.id);

    return {
      token,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Confirms password setup using a valid, unused password token.
   */
  async confirmPasswordSetup(
    rawToken: string,
    newPassword: string,
  ): Promise<void> {

    if (typeof rawToken !== "string" || !rawToken.trim()) {
      throw new Error("A password setup token is required.");
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const passwordToken =
      await authRepository.findTokenByHash(tokenHash);

    if (!passwordToken) {
      throw new Error("Invalid or fake token.");
    }

    if (passwordToken.usedAt !== null) {
      throw new Error("This link has already been used.");
    }

    if (passwordToken.expiresAt < new Date()) {
      throw new Error(
        "This link has expired. Please request a new one.",
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await authRepository.updatePasswordAndConsumeToken(
      passwordToken.userId,
      passwordToken.id,
      hashedPassword,
    );
  }

  /**
   * Allows an authenticated user to change their password.
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    if (!oldPassword || !newPassword) {
      throw new Error("Current password and new password are required.");
    }
    if (newPassword.length < 8) {
      throw new Error("New password must contain at least 8 characters.");
    }

    // Fetch the user from the database using your existing repository
    const user = await authRepository.findById(userId);
    if (!user || !user.passwordHash) {
      throw new Error("User not found or password not set.");
    }

    // Verify the current password matches
    const passwordMatches = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new Error("Incorrect current password.");
    }

    // Hash and save the new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(user.id, newHashedPassword);
  }

    /**
   * Updates the authenticated user's personal profile.
   */
  async updateProfile(
    userId: string,
    input: {
      fullName?: unknown;
      phone?: unknown;
    }
  ) {
    if (!userId) {
      throw new Error("Authentication required.");
    }

    const user = await authRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive.");
    }

    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      throw new Error("Invalid profile information.");
    }

    const allowedFields = ["fullName", "phone"];

    for (const field of Object.keys(input)) {
      if (!allowedFields.includes(field)) {
        throw new Error(`Cannot update field: ${field}`);
      }
    }

    const data: {
      fullName?: string;
      phone?: string | null;
    } = {};

    if (input.fullName !== undefined) {
      if (typeof input.fullName !== "string") {
        throw new Error("Full name must be a string.");
      }

      const fullName = input.fullName.trim();

      if (fullName.length < 2) {
        throw new Error("Full name must contain at least 2 characters.");
      }

      data.fullName = fullName;
    }

    if (input.phone !== undefined) {
      if (input.phone !== null && typeof input.phone !== "string") {
        throw new Error("Phone number must be a string or null.");
      }

      data.phone =
        typeof input.phone === "string"
          ? input.phone.trim() || null
          : null;
    }

    if (Object.keys(data).length === 0) {
      throw new Error("Provide a full name or phone number to update.");
    }

    return authRepository.updateProfile(userId, data);
  }
}

export const authService = new AuthService();

export default authService;
