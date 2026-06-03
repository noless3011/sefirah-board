import { Router } from "express";
import * as boardController from "../controllers/boardController.js";

import * as collaborationController from "../controllers/collaborationController.js";
import * as canvasController from "../controllers/canvasController.js";
import * as historyController from "../controllers/historyController.js";

const router = Router();

// Domain: Board Management
router.get("/", boardController.listBoards);
router.post("/", boardController.createBoard);
router.get("/:boardId", boardController.getBoard);
router.patch("/:boardId", boardController.updateBoard);
router.delete("/:boardId", boardController.deleteBoard);
router.post("/:boardId/thumbnail", boardController.uploadThumbnail);
router.post("/:boardId/export", boardController.exportBoard);

// Domain: Collaboration & Sharing
router.get("/:boardId/collaborators", collaborationController.listCollaborators);
router.post("/:boardId/collaborators/invite", collaborationController.inviteCollaborator);
router.post("/:boardId/collaborators/link", collaborationController.generateInviteLink);
router.patch("/:boardId/collaborators/:userId", collaborationController.updateCollaboratorRole);
router.delete("/:boardId/collaborators/:userId", collaborationController.removeCollaborator);

// Canvas State REST (implemented in canvasController)
router.get("/:boardId/canvas/elements", canvasController.getCanvasElements);
router.put("/:boardId/canvas/snapshot", canvasController.saveCanvasSnapshot);

// Board History
router.get("/:boardId/history", historyController.listRevisions);
router.get("/:boardId/history/:revisionId", historyController.getRevisionDetail);
router.post("/:boardId/history/restore", historyController.restoreRevision);

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
