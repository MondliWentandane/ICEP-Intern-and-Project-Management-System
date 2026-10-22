import { prisma } from "../config/prisma";

export type StaffRole = "ADMIN" | "WIL_HANDLER" | "MENTOR";

// Never select passwordHash: the Users page only needs to know whether a password has been set.
const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  passwordHash: true,
  mentor: { select: { department: { select: { id: true, name: true } } } },
  intern: { select: { campus: { select: { name: true } } } },
} as const;

export class UserRepository {
  listUsers() {
    return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: userSelect });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  }

  departmentExists(id: string) {
    return prisma.department.count({ where: { id } }).then((count) => count > 0);
  }

  listDepartments() {
    return prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  }

  /** Creates a staff account with no password yet; a mentor also gets their mentor profile. */
  createStaffUser(data: { fullName: string; email: string; phone?: string | null; role: StaffRole; departmentId?: string }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        role: data.role,
        passwordHash: null,
        ...(data.role === "MENTOR" && data.departmentId
          ? { mentor: { create: { departmentId: data.departmentId } } }
          : {}),
      },
      select: userSelect,
    });
  }
}

export const userRepository = new UserRepository();

export default userRepository;
