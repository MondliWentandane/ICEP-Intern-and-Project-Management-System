// Main router combining all routes. Mounted in app.ts as:  app.use("/api", routes);
// (the frontend calls VITE_API_BASE_URL=/api, e.g. POST /api/auth/login).
import { Router } from "express";
import authRoutes from "./authRoutes";
import applicationRoutes from "./applicationRoutes";
import internRoutes from "./internRoutes";
import projectRoutes from "./projectRoutes";
import taskRoutes from "./taskRoutes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use(authRoutes); // /auth/*, /users/*
router.use(applicationRoutes); // /positions, /applications, /register, /applicants/*, /contact, /notifications, /email-templates, /emails/*
router.use(internRoutes); // /interns/*, /past-interns, /campuses, /intakes, /departments, /skills
router.use(projectRoutes); // /projects/*, /mentors, /dashboards, /reports
router.use(taskRoutes); // /tasks/*, /projects/:id/tasks, /projects/:id/gantt, /calendar

export default router;
