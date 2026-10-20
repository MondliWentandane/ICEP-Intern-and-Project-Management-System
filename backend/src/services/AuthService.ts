
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/AuthRepository";
import crypto from "crypto";
export class AuthService {
  async login(email: string, password: string) {
    if (!email?.trim() || !password) {
      throw new Error("Email and password are required.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await authRepository.findByEmail(normalizedEmail);

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

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error(
        "Authentication is not configured correctly. Contact the system administrator.",
      );
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      secret,
      { expiresIn: "1h" },
    );

    await authRepository.updateLastLogin(user.id);

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async confirmPasswordSetup(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const passwordToken = await authRepository.findTokenByHash(tokenHash);

    if (!passwordToken) {
      throw new Error("Invalid or fake token.");
    }
    if (passwordToken.usedAt !== null) {
      throw new Error("This link has already been used.");
    }
    if (passwordToken.expiresAt < new Date()) {
      throw new Error("This link has expired. Please request a new one.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await authRepository.updatePasswordAndConsumeToken(
      passwordToken.userId,
      passwordToken.id,
      hashedPassword
    );
  }
}

export const authService = new AuthService();

export default authService;
