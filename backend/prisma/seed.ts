import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma, disconnectPrisma } from "../src/config/prisma";

/**
 * Idempotent seed — safe to run many times (uses upsert).
 * Creates: departments, campuses, an intake, skills, email templates and a first ADMIN.
 *
 * Optional env vars: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 * CHANGE THE ADMIN PASSWORD after first login.
 */
async function main() {
  // Departments
  const departments = ["Software Development", "Cybersecurity & Informatics", "Systems Engineering"];
  for (const name of departments) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Campuses
  for (const name of ["Polokwane", "Pretoria", "Soshanguve"]) {
    await prisma.campus.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Intake
  await prisma.intake.upsert({
    where: { name: "2026 Intake 2" },
    update: {},
    create: { name: "2026 Intake 2", startDate: new Date("2026-07-01"), endDate: new Date("2026-12-31") },
  });

  // Skills
  const skills = ["Java", "Kotlin", "PL/SQL", "TypeScript", "React", "Node.js", "HTML", "CSS", "Python", "Testing", "UI/UX"];
  for (const name of skills) {
    await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Email templates
  const templates = [
    { key: "APPLICATION_ACCEPTED", subject: "Welcome to ICEP, {{fullName}}", body: "Hi {{fullName}},\n\nYour application was successful. Set your password here: {{passwordLink}}" },
    { key: "APPLICATION_REJECTED", subject: "Your ICEP application", body: "Hi {{fullName}},\n\nThank you for applying. Unfortunately we cannot offer you a place at this time." },
    { key: "INTERVIEW_INVITE", subject: "ICEP interview invitation", body: "Hi {{fullName}},\n\nYou have been selected for an interview." },
    { key: "PASSWORD_RESET", subject: "Reset your password", body: "Hi {{fullName}},\n\nReset your password here: {{passwordLink}}" },
    { key: "PROJECT_ASSIGNMENT", subject: "You were assigned to {{projectName}}", body: "Hi {{fullName}},\n\nYou have been added to the project {{projectName}}." },
    { key: "TASK_APPROVAL", subject: "Your task was approved", body: "Hi {{fullName}},\n\nYour completed task has been approved." },
  ] as const;
  for (const t of templates) {
    await prisma.emailTemplate.upsert({ where: { key: t.key }, update: {}, create: t });
  }

  // First admin
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@icep.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { fullName: "ICEP Admin", email, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" },
  });

  console.log(`Seed complete. Admin login: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(disconnectPrisma);
