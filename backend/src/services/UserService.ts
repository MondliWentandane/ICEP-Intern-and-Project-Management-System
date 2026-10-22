// Admin "Users" page: staff accounts (WIL Handler, Mentor).
// Not added here: the admin is created once by the seed script (prisma/seed.ts), and interns get their account when an application is accepted.
// New staff get no password; they are emailed a one-time link to set one (EmailService.sendPasswordSetupLink).
import { userRepository, type StaffRole } from "../repositories/UserRepository";
import { EmailService } from "./EmailService";

const emailService = new EmailService();
const staffRoles: StaffRole[] = ["WIL_HANDLER", "MENTOR"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const httpError = (statusCode: number, message: string) => Object.assign(new Error(message), { statusCode });

type UserRow = NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>;

/** What the Users page receives. "INVITED" = account created but no password set yet. */
const toUserView = ({ passwordHash, mentor, intern, ...user }: UserRow) => ({
  ...user,
  status: !user.isActive ? "INACTIVE" : passwordHash ? "ACTIVE" : "INVITED",
  department: mentor?.department ?? null,
  campus: intern?.campus.name ?? null,
});

export class UserService {
  async listUsers() {
    return (await userRepository.listUsers()).map(toUserView);
  }

  listDepartments() {
    return userRepository.listDepartments();
  }

  /** Creates the account, then emails the set-password link. The account stays even if the email fails (it can be resent). */
  async createUser(input: { fullName?: unknown; email?: unknown; phone?: unknown; role?: unknown; departmentId?: unknown }) {
    const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const phone = typeof input.phone === "string" && input.phone.trim() ? input.phone.trim() : null;
    const role = input.role as StaffRole;
    const departmentId = typeof input.departmentId === "string" ? input.departmentId : undefined;

    if (fullName.length < 2) throw httpError(400, "Enter the user's full name.");
    if (!emailPattern.test(email)) throw httpError(400, "Enter a valid email address.");
    if (!staffRoles.includes(role)) {
      throw httpError(400, "Role must be WIL Handler or Mentor. The administrator is set up by the system, and intern accounts are created when an application is accepted.");
    }
    if (role === "MENTOR" && (!departmentId || !(await userRepository.departmentExists(departmentId)))) {
      throw httpError(400, "Choose the mentor's department.");
    }
    if (await userRepository.findByEmail(email)) throw httpError(409, "An account with this email already exists.");

    const user = await userRepository.createStaffUser({ fullName, email, phone, role, departmentId });

    let emailSent = true;
    try {
      await emailService.sendPasswordSetupLink(email);
    } catch (error) {
      console.error(`Password setup email failed for ${email}:`, error);
      emailSent = false;
    }
    return { user: toUserView(user), emailSent };
  }

  /** Sends a fresh set-password link to someone who has not set their password yet (the old link expires after 24 hours). */
  async resendInvite(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw httpError(404, "User not found.");
    if (user.passwordHash) throw httpError(409, "This user has already set a password. They can use Forgot password instead.");
    if (!user.isActive) throw httpError(409, "This account is inactive.");
    await emailService.sendPasswordSetupLink(user.email);
  }
}

export const userService = new UserService();

export default userService;
