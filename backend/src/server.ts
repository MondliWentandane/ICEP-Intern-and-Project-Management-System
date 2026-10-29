
import "dotenv/config";
import express from "express";
import cors from "cors";
import { disconnectPrisma } from "./config/prisma";
import { EmailController } from "./controllers/EmailController";
import taskRoutes from "./routes/taskRoutes";
import { authService } from "./services/AuthService";
import authRoutes from "./routes/authRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import internRoutes from "./routes/internRoutes";
import projectRoutes from "./routes/projectRoutes";
import internService from "./services/InternService";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[BACKEND HIT] ${req.method} ${req.url}`);
  next();
});
app.use("/api", taskRoutes);

app.use("/api", authRoutes);
// Group A - careers positions, intern applications and the Applicants queue
app.use("/api", applicationRoutes);
// Group A - interns, ending internships and the Past Interns archive
app.use("/api", internRoutes);
// Group B - projects, project teams (members + roles)
app.use("/api", projectRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "ICEP Intern and Project Management API is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is healthy",
  });
});

app.post("/api/email/setup-password", (req, res) => EmailController.sendPasswordLink(req, res));

app.post("/api/auth/confirm-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    await authService.confirmPasswordSetup(token, newPassword);
    res.status(200).json({ message: "Password successfully set!" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`ICEP backend running at http://localhost:${PORT}`);
});

// Interns whose placement period is over move to Past Interns (login turned off): now, then hourly.
const archiveFinishedInternships = () =>
  internService.archiveFinishedInternships()
    .then((count) => { if (count) console.log(`Archived ${count} intern(s) whose placement period ended.`); })
    .catch((error) => console.error("Archiving finished internships failed:", error));
void archiveFinishedInternships();
setInterval(archiveFinishedInternships, 60 * 60 * 1000).unref();

async function shutdown() {
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
