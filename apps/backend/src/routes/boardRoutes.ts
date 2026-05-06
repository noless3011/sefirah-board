import { Router } from "express";
import * as boardController from "../controllers/boardController.js";

const router = Router();

// Domain: Board Management
router.get("/", boardController.listBoards);
router.post("/", boardController.createBoard);
router.get("/:boardId", boardController.getBoard);
router.patch("/:boardId", boardController.updateBoard);
router.delete("/:boardId", boardController.deleteBoard);
router.post("/:boardId/thumbnail", boardController.uploadThumbnail);
router.post("/:boardId/export", boardController.exportBoard);

// Collaboration & Sharing endpoints (to be implemented in collaborationController)
router.get("/:boardId/collaborators", (req, res) => {
    res.send("Not implemented");
});
router.post("/:boardId/collaborators/invite", (req, res) => {
    res.send("Not implemented");
});
router.post("/:boardId/collaborators/link", (req, res) => {
    res.send("Not implemented");
});
router.patch("/:boardId/collaborators/:userId", (req, res) => {
    res.send("Not implemented");
});
router.delete("/:boardId/collaborators/:userId", (req, res) => {
    res.send("Not implemented");
});

// Standalone invite redeem (can also be in a generic invites router)
router.post("/api/v1/invites/redeem", (req, res) => {
    res.send("Not implemented");
});

// Canvas State REST (to be implemented in canvasController)
router.get("/:boardId/canvas/elements", (req, res) => {
    res.send("Not implemented");
});
router.put("/:boardId/canvas/snapshot", (req, res) => {
    res.send("Not implemented");
});

// Board History (to be implemented in historyController)
router.get("/:boardId/history", (req, res) => {
    res.send("Not implemented");
});
router.get("/:boardId/history/:revisionId", (req, res) => {
    res.send("Not implemented");
});
router.post("/:boardId/history/restore", (req, res) => {
    res.send("Not implemented");
});

// Active Threads/Chat (to be implemented in threadController)
router.get("/:boardId/threads", (req, res) => {
    res.send("Not implemented");
});
router.post("/:boardId/threads", (req, res) => {
    res.send("Not implemented");
});
router.post("/:boardId/threads/:threadId/reply", (req, res) => {
    res.send("Not implemented");
});
router.patch("/:boardId/threads/:threadId", (req, res) => {
    res.send("Not implemented");
});

export default router;
