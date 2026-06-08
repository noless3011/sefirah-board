import { Router } from "express";
import {
    register,
    login,
    googleOAuth,
    githubOAuth,
    refreshToken,
    forgotPassword,
    resetPassword,
    getAuthConfig,
} from "../controllers/authController.js";

const router = Router();

// Domain: Authentication
router.get("/config", getAuthConfig);
router.post("/register", register);
router.post("/login", login);
router.post("/oauth/google", googleOAuth);
router.post("/oauth/github", githubOAuth);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
