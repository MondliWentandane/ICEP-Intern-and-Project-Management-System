import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma, disconnectPrisma } from "../src/config/prisma";

/**
 * Idempotent seed — safe to run many times (uses upsert).
 * Creates: departments, campuses, intakes, careers positions, skills, email templates and a first ADMIN.
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

  // Careers positions shown on the public Careers page (the ids match the old frontend links, e.g. /careers/web-developer-intern).
  // update: {} -> re-running the seed never overwrites changes made later.
  for (const name of ["eMalahleni"]) {
    await prisma.campus.upsert({ where: { name }, update: {}, create: { name } });
  }
  const placementIntake = await prisma.intake.upsert({
    where: { name: "2027 Intake 1" },
    update: {},
    create: { name: "2027 Intake 1", startDate: new Date("2027-02-01"), endDate: new Date("2028-01-31") },
  });
  const campusId = async (name: string) => (await prisma.campus.findUniqueOrThrow({ where: { name } })).id;
  const departmentId = async (name: string) => (await prisma.department.findUniqueOrThrow({ where: { name } })).id;
  const describe = (summary: string, responsibilities: string[]) =>
    `${summary}\n\nResponsibilities:\n${responsibilities.map((item) => `- ${item}`).join("\n")}`;
  const requirementsFor = (campus: string, extra: string) => [
    "Enrolled in or recently completed an IT or Computer Science qualification.",
    extra,
    `Able to work full time on the ${campus} campus.`,
    "Certified academic record and a signed WIL letter from your institution.",
  ].map((item) => `- ${item}`).join("\n");
  const positions = [
    { id: "software-development-intern", title: "Software Development Intern", department: "Software Development", campus: "Soshanguve", closingDate: "2026-12-15", openings: 6,
      summary: "Join the Software Development team for a 12-month work-integrated learning placement. You will build and maintain features for real client projects, guided by a mentor and reviewed weekly.",
      responsibilities: ["Build features from approved designs and specifications.", "Write and review code with your mentor each week.", "Update your tasks on the Task Board and report progress.", "Present your work at the monthly project review."],
      requirement: "Working knowledge of at least one programming language." },
    { id: "cybersecurity-intern", title: "Cybersecurity Intern", department: "Cybersecurity & Informatics", campus: "eMalahleni", closingDate: "2026-10-25", openings: 3,
      summary: "Help the Cybersecurity team protect ICEP systems for a 12-month placement. You will monitor alerts, test controls and document findings with a mentor.",
      responsibilities: ["Monitor security alerts and escalate incidents.", "Assist with vulnerability scans and remediation tracking.", "Document findings and security procedures.", "Present your work at the monthly project review."],
      requirement: "Basic understanding of networks and operating systems." },
    { id: "systems-engineering-intern", title: "Systems Engineering Intern", department: "Systems Engineering", campus: "Polokwane", closingDate: "2026-12-31", openings: 4,
      summary: "Work with the Systems Engineering team on servers, deployments and internal tooling for a 12-month placement.",
      responsibilities: ["Help maintain servers and deployment pipelines.", "Automate routine tasks with scripts.", "Update your tasks on the Task Board and report progress.", "Present your work at the monthly project review."],
      requirement: "Familiarity with Linux or Windows Server." },
    { id: "web-developer-intern", title: "Web Developer Intern", department: "Software Development", campus: "Polokwane", closingDate: "2026-11-30", openings: 4,
      summary: "Join the Software Engineering team for a 12-month work-integrated learning placement. You will build and maintain web features for real client projects, guided by a mentor and reviewed weekly.",
      responsibilities: ["Build responsive pages and components from approved designs.", "Write and review code with your mentor each week.", "Update your tasks on the Task Board and report progress.", "Present your work at the monthly project review."],
      requirement: "Working knowledge of HTML, CSS and JavaScript." },
    { id: "information-security-intern", title: "Information Security Intern", department: "Cybersecurity & Informatics", campus: "Soshanguve", closingDate: "2026-12-20", openings: 2,
      summary: "Support information security policy, access reviews and awareness training across ICEP for a 12-month placement.",
      responsibilities: ["Run user access reviews with the security lead.", "Help prepare security awareness material.", "Keep policy documents up to date.", "Present your work at the monthly project review."],
      requirement: "Strong written communication skills." },
    { id: "it-infrastructure-intern", title: "IT Infrastructure Intern", department: "Systems Engineering", campus: "eMalahleni", closingDate: "2026-10-28", openings: 3,
      summary: "Support campus networks, devices and helpdesk requests for a 12-month placement.",
      responsibilities: ["Set up and maintain campus devices.", "Resolve helpdesk tickets and record fixes.", "Assist with network cabling and configuration.", "Present your work at the monthly project review."],
      requirement: "Interest in networking and hardware." },
  ];
  for (const p of positions) {
    await prisma.position.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id, title: p.title, status: "OPEN", openings: p.openings, closingDate: new Date(p.closingDate),
        description: describe(p.summary, p.responsibilities), requirements: requirementsFor(p.campus, p.requirement),
        campusId: await campusId(p.campus), departmentId: await departmentId(p.department), intakeId: placementIntake.id,
      },
    });
  }

  // Skills
  const skills = ["Java", "Kotlin", "PL/SQL", "TypeScript", "React", "Node.js", "HTML", "CSS", "Python", "Testing", "UI/UX"];
  for (const name of skills) {
    await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Email templates
  const templates = [
    { key: "APPLICATION_ACCEPTED", subject: "Welcome to ICEP, {{fullName}}", body: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;\">\n  <h2 style=\"color: #2c3e50; text-align: center;\">Welcome to the Team, {{fullName}}!</h2>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">\n    Congratulations! Your application was successful, and we are thrilled to welcome you to the ICEP Intern and Project Management System.\n  </p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">\n    To get started, please click the button below to set up your account password and access your new dashboard.\n  </p>\n  <div style=\"text-align: center; margin: 30px 0;\">\n    <a href=\"{{passwordLink}}\" style=\"background-color: #0056b3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;\">Set Up Account</a>\n  </div>\n  <p style=\"color: #999999; font-size: 13px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 15px;\">\n    If you have any issues accessing your account, please contact the system administrator.\n  </p>\n</div>" },
    { key: "APPLICATION_REJECTED", subject: "Update on your ICEP application", body: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;\">\n  <h2 style=\"color: #2c3e50; text-align: center;\">Application Update</h2>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">Dear {{fullName}},</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">Thank you for taking the time to apply to ICEP. We appreciate your interest in joining our team.</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">After careful consideration, we regret to inform you that we cannot offer you a position at this time. We had many highly qualified applicants, and this was a difficult decision.</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">We wish you the absolute best in your future professional endeavors and encourage you to apply for future openings.</p>\n  <p style=\"color: #999999; font-size: 13px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 30px;\">Innovation Hub | ICEP Program</p>\n</div>"},
    { key: "INTERVIEW_INVITE", subject: "ICEP Interview Invitation", body: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;\">\n  <h2 style=\"color: #2c3e50; text-align: center;\">Interview Invitation</h2>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">Dear {{fullName}},</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">We are pleased to inform you that your application stood out to our team, and we would like to formally invite you to an interview for the ICEP program.</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">Please reply to this email or contact the HR department to confirm your availability and receive further scheduling details.</p>\n  <p style=\"color: #999999; font-size: 13px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 30px;\">We look forward to speaking with you soon.</p>\n</div>" },
    { key: "PASSWORD_RESET", subject: "Reset your password", body: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;\">\n  <h2 style=\"color: #2c3e50; text-align: center;\">Welcome to ICEP</h2>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">\n    You have been invited to join the ICEP Intern and Project Management System. Please click the button below to securely set up your password and access your dashboard.\n  </p>\n  <div style=\"text-align: center; margin: 30px 0;\">\n    <a href=\"{{resetLink}}\" style=\"background-color: #0056b3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;\">Set Up Password</a>\n  </div>\n  <p style=\"color: #999999; font-size: 13px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 15px;\">\n    If you did not request this invitation, please ignore this email. This link will expire in 24 hours.\n  </p>\n</div>" },
    { key: "PROJECT_ASSIGNMENT", subject: "Project Assignment: {{projectName}}", body: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;\">\n  <h2 style=\"color: #2c3e50; text-align: center;\">New Project Assignment</h2>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">Hi {{fullName}},</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">You have officially been assigned to the following project: <strong>{{projectName}}</strong>.</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">Please log in to the ICEP Intern and Project Management System to review the project brief, meet your team members, and check your upcoming deliverables.</p>\n  <div style=\"text-align: center; margin: 30px 0;\">\n    <a href=\"http://localhost:3000/dashboard\" style=\"background-color: #0056b3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;\">Go to Dashboard</a>\n  </div>\n</div>" },
    { key: "TASK_APPROVAL", subject: "Your Task was Approved", body: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f8fff9;\">\n  <h2 style=\"color: #27ae60; text-align: center;\">Task Approved!</h2>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">Hi {{fullName}},</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">Great job! Your recently submitted task has been reviewed and officially approved by your project manager.</p>\n  <p style=\"color: #555555; font-size: 16px; line-height: 1.5;\">You can view the feedback and proceed to your next assignment in the system.</p>\n</div>" },
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
