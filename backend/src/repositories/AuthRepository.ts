
import { prisma } from "../config/prisma";

export class AuthRepository {
  // Find a user by email address.
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  // Find a user by their unique ID.
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  // Save a new user.
  async saveUser(data: {
    fullName: string;
    email: string;
    passwordHash?: string | null;
    phone?: string | null;
    role: "ADMIN" | "WIL_HANDLER" | "MENTOR" | "INTERN";
    isActive?: boolean;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.trim().toLowerCase(),
      },
    });
  }

  // Update a user's password hash.
  async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

    // Update the authenticated user's profile.
  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string | null;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });
  }

  // Record a successful login.
  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  // Find a password token using its SHA-256 hash.
  async findTokenByHash(tokenHash: string) {
    return prisma.passwordToken.findUnique({
      where: { tokenHash },
    });
  }

  // Update a password and mark its token as used atomically.
 async updatePasswordAndConsumeToken(
  userId: string,
  tokenId: string,
  passwordHash: string,
) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const tokenUpdate = await tx.passwordToken.updateMany({
      where: {
        id: tokenId,
        userId,
        usedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        usedAt: now,
      },
    });

    if (tokenUpdate.count !== 1) {
      throw new Error(
        "Password setup token is invalid, expired, or already used.",
      );
    }

      return tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  });
  }
}

export const authRepository = new AuthRepository();

export default authRepository;