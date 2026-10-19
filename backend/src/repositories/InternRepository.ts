
import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../config/prisma";

export interface InternFilters {
  departmentId?: string;
  skill?: string;
  status?: "ACTIVE" | "COMPLETED" | "WITHDRAWN";
}

export class InternRepository {
  async findAll(filters: InternFilters = {}) {
    const where: Prisma.InternWhereInput = {};

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.skill) {
      where.skills = {
        some: {
          skill: {
            name: {
              contains: filters.skill,
              mode: "insensitive",
            },
          },
        },
      };
    }

    return prisma.intern.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        department: true,
        campus: true,
        intake: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.intern.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        campus: true,
        intake: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });
  }
}

export default new InternRepository();