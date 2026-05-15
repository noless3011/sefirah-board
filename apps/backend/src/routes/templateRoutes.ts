import { Router } from "express";
import {
    listTemplates,
    getTemplate,
} from "../controllers/templateController.js";

const router = Router();

// Domain: Templates
router.get("/", listTemplates);
router.get("/:templateId", getTemplate);

export default router;
