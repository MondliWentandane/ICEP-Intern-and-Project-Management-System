
import "dotenv/config";
import express from "express";
import cors from "cors";
import { disconnectPrisma } from "./config/prisma";
import { EmailController } from "./controllers/EmailController";


const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

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
