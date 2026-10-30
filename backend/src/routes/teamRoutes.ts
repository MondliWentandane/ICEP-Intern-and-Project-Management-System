import { Router } from "express";
import { createTeam, deleteTeam, listTeams, updateTeam } from "../controllers/TeamController";
import { authenticateToken, authorizeRoles } from "../middlewares/AuthMiddleware";

const router = Router();
const teamManagers = [authenticateToken, authorizeRoles("ADMIN", "MENTOR")];

router.get("/teams", ...teamManagers, listTeams);
router.post("/teams", ...teamManagers, createTeam);
router.put("/teams/:id", ...teamManagers, updateTeam);
router.delete("/teams/:id", ...teamManagers, deleteTeam);

export default router;
