import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import boardRoutes from "./boardRoutes.js";
import templateRoutes from "./templateRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/boards", boardRoutes);
router.use("/templates", templateRoutes);
router.use("/notifications", notificationRoutes);

// General health check
router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
