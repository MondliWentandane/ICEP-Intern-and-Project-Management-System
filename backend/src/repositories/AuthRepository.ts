
import { prisma } from "../config/prisma";

export class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async findTokenByHash(tokenHash: string) {
    return prisma.passwordToken.findUnique({
      where: { tokenHash: tokenHash },
    });
  }

  async updatePasswordAndConsumeToken(userId: string, tokenId: string, passwordHash: string) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: passwordHash },
      }),
      prisma.passwordToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
    ]);
  }
}

export const authRepository = new AuthRepository();

export default authRepository;
