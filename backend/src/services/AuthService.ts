
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/AuthRepository";

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
}

export const authService = new AuthService();

export default authService;
