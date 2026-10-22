
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { authRepository } from "../repositories/AuthRepository";

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

    if (!user.isActive) {
      throw new Error("This account is inactive.");
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new Error("Invalid email or password.");
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
}

export const authService = new AuthService();

export default authService;
