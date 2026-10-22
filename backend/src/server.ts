
import "dotenv/config";
import express from "express";
import cors from "cors";
import { disconnectPrisma } from "./config/prisma";
import { EmailController } from "./controllers/EmailController";
import taskRoutes from "./routes/taskRoutes";
import { authService } from "./services/AuthService";
import authRoutes from "./routes/authRoutes";
import applicationRoutes from "./routes/applicationRoutes";

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

async function shutdown() {
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
