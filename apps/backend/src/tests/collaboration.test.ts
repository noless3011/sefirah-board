import request from "supertest";
import { app } from "../index.js";
import { clearDatabase } from "./setup.js";
import db from "../utils/db.js";

async function getAuthToken(email: string, fullName: string = "Test User") {
    await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        fullName,
    });

    const response = await request(app).post("/api/v1/auth/login").send({
        email,
        password: "Password123!",
    });

    return { token: response.body.accessToken, userId: response.body.user.id };
}

describe("Collaboration Domain", () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    // =========================================================================
    // GET /api/v1/boards/:boardId/collaborators
    // =========================================================================
    describe("GET /api/v1/boards/:boardId/collaborators", () => {
        it("should list collaborators for owner", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Shared Board" });
            const boardId = boardRes.body.id;

            await db.collaborator.create({
                data: { boardId, userId: collab.userId, role: "viewer" },
            });

            const listRes = await request(app)
                .get(`/api/v1/boards/${boardId}/collaborators`)
                .set("Authorization", `Bearer ${owner.token}`);

            expect(listRes.status).toBe(200);
            expect(listRes.body.length).toBe(1);
            expect(listRes.body[0].userId).toBe(collab.userId);
            expect(listRes.body[0].fullName).toBe("Collab");
            expect(listRes.body[0].email).toBe("collab@example.com");
            expect(listRes.body[0].role).toBe("viewer");
            expect(listRes.body[0].joinedAt).toBeDefined();
        });

        it("should list collaborators for a collaborator", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Shared Board" });
            const boardId = boardRes.body.id;

            await db.collaborator.create({
                data: { boardId, userId: collab.userId, role: "editor" },
            });

            const listRes = await request(app)
                .get(`/api/v1/boards/${boardId}/collaborators`)
                .set("Authorization", `Bearer ${collab.token}`);

            expect(listRes.status).toBe(200);
            expect(listRes.body.length).toBe(1);
        });

        it("should return 403 if user has no access", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const other = await getAuthToken("other@example.com", "Other");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Private Board" });
            const boardId = boardRes.body.id;

            const listRes = await request(app)
                .get(`/api/v1/boards/${boardId}/collaborators`)
                .set("Authorization", `Bearer ${other.token}`);

            expect(listRes.status).toBe(403);
        });

        it("should return empty array when no collaborators exist", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Solo Board" });

            const listRes = await request(app)
                .get(`/api/v1/boards/${boardRes.body.id}/collaborators`)
                .set("Authorization", `Bearer ${owner.token}`);

            expect(listRes.status).toBe(200);
            expect(listRes.body).toEqual([]);
        });
    });

    // =========================================================================
    // POST /api/v1/boards/:boardId/collaborators/invite
    // =========================================================================
    describe("POST /api/v1/boards/:boardId/collaborators/invite", () => {
        it("should invite collaborator by email successfully", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const invitee = await getAuthToken("invitee@example.com", "Invitee");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Project Board" });
            const boardId = boardRes.body.id;

            const inviteRes = await request(app)
                .post(`/api/v1/boards/${boardId}/collaborators/invite`)
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ email: "invitee@example.com", role: "editor" });

            expect(inviteRes.status).toBe(201);
            expect(inviteRes.body.userId).toBe(invitee.userId);
            expect(inviteRes.body.fullName).toBe("Invitee");
            expect(inviteRes.body.email).toBe("invitee@example.com");
            expect(inviteRes.body.role).toBe("editor");
            expect(inviteRes.body.joinedAt).toBeDefined();

            // Verify notification was created for invitee
            const notification = await db.notification.findFirst({
                where: { userId: invitee.userId },
            });
            expect(notification).toBeTruthy();
            expect(notification?.type).toBe("invite");
            expect(notification?.boardId).toBe(boardId);
        });

        it("should return 404 if email does not exist", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Project Board" });
            const boardId = boardRes.body.id;

            const inviteRes = await request(app)
                .post(`/api/v1/boards/${boardId}/collaborators/invite`)
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ email: "nonexistent@example.com", role: "editor" });

            expect(inviteRes.status).toBe(404);
        });

        it("should return 403 when non-owner tries to invite", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");
            const invitee = await getAuthToken("invitee@example.com", "Invitee");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Project Board" });
            const boardId = boardRes.body.id;

            // Add collab as editor
            await db.collaborator.create({
                data: { boardId, userId: collab.userId, role: "editor" },
            });

            // Collab tries to invite — should be forbidden
            const inviteRes = await request(app)
                .post(`/api/v1/boards/${boardId}/collaborators/invite`)
                .set("Authorization", `Bearer ${collab.token}`)
                .send({ email: "invitee@example.com", role: "viewer" });

            expect(inviteRes.status).toBe(403);
        });

        it("should return 400 if user is already a collaborator", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Project Board" });
            const boardId = boardRes.body.id;

            // First invite — succeeds
            await request(app)
                .post(`/api/v1/boards/${boardId}/collaborators/invite`)
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ email: "collab@example.com", role: "editor" });

            // Second invite — should fail
            const inviteRes = await request(app)
                .post(`/api/v1/boards/${boardId}/collaborators/invite`)
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ email: "collab@example.com", role: "viewer" });

            expect(inviteRes.status).toBe(400);
        });

        it("should return 400 when owner tries to invite themselves", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "My Board" });

            const inviteRes = await request(app)
                .post(`/api/v1/boards/${boardRes.body.id}/collaborators/invite`)
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ email: "owner@example.com", role: "editor" });

            expect(inviteRes.status).toBe(400);
        });
    });

    // =========================================================================
    // POST /api/v1/boards/:boardId/collaborators/link
    // =========================================================================
    describe("POST /api/v1/boards/:boardId/collaborators/link", () => {
        it("should generate invite link successfully", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Project Board" });
            const boardId = boardRes.body.id;

            const linkRes = await request(app)
                .post(`/api/v1/boards/${boardId}/collaborators/link`)
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ role: "viewer", expiresInHours: 24 });

            expect(linkRes.status).toBe(200);
            expect(linkRes.body.inviteCode).toBeTruthy();
            expect(linkRes.body.inviteUrl).toContain(linkRes.body.inviteCode);
            expect(linkRes.body.expiresAt).toBeDefined();
            // Validate expiresAt is a valid ISO date string
            expect(new Date(linkRes.body.expiresAt).toISOString()).toBe(
                linkRes.body.expiresAt,
            );
        });

        it("should use default expiry (72h) when expiresInHours is omitted", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Default Expiry Board" });

            const linkRes = await request(app)
                .post(`/api/v1/boards/${boardRes.body.id}/collaborators/link`)
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ role: "editor" });

            expect(linkRes.status).toBe(200);
            expect(linkRes.body.inviteCode).toBeTruthy();
        });

        it("should return 403 when non-owner tries to generate link", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Owned Board" });
            const boardId = boardRes.body.id;

            await db.collaborator.create({
                data: { boardId, userId: collab.userId, role: "editor" },
            });

            const linkRes = await request(app)
                .post(`/api/v1/boards/${boardId}/collaborators/link`)
                .set("Authorization", `Bearer ${collab.token}`)
                .send({ role: "viewer" });

            expect(linkRes.status).toBe(403);
        });
    });

    // =========================================================================
    // PATCH /api/v1/boards/:boardId/collaborators/:userId
    // =========================================================================
    describe("PATCH /api/v1/boards/:boardId/collaborators/:userId", () => {
        it("should update collaborator role successfully", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Project Board" });
            const boardId = boardRes.body.id;

            await db.collaborator.create({
                data: { boardId, userId: collab.userId, role: "viewer" },
            });

            const updateRes = await request(app)
                .patch(`/api/v1/boards/${boardId}/collaborators/${collab.userId}`)
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ role: "editor" });

            expect(updateRes.status).toBe(200);
            expect(updateRes.body.userId).toBe(collab.userId);
            expect(updateRes.body.role).toBe("editor");
            expect(updateRes.body.fullName).toBe("Collab");
            expect(updateRes.body.email).toBe("collab@example.com");

            // Verify in DB
            const inDb = await db.collaborator.findUnique({
                where: { userId_boardId: { userId: collab.userId, boardId } },
            });
            expect(inDb?.role).toBe("editor");
        });

        it("should return 403 when non-owner tries to change role", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab1 = await getAuthToken("collab1@example.com", "Collab1");
            const collab2 = await getAuthToken("collab2@example.com", "Collab2");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Board" });
            const boardId = boardRes.body.id;

            await db.collaborator.createMany({
                data: [
                    { boardId, userId: collab1.userId, role: "editor" },
                    { boardId, userId: collab2.userId, role: "viewer" },
                ],
            });

            // Collab1 (editor) tries to change collab2's role
            const updateRes = await request(app)
                .patch(`/api/v1/boards/${boardId}/collaborators/${collab2.userId}`)
                .set("Authorization", `Bearer ${collab1.token}`)
                .send({ role: "editor" });

            expect(updateRes.status).toBe(403);
        });

        it("should return 404 for non-existent collaborator", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Board" });

            const updateRes = await request(app)
                .patch(
                    `/api/v1/boards/${boardRes.body.id}/collaborators/a0000000-0000-4000-8000-ffffffffffff`,
                )
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ role: "editor" });

            expect(updateRes.status).toBe(404);
        });
    });

    // =========================================================================
    // DELETE /api/v1/boards/:boardId/collaborators/:userId
    // =========================================================================
    describe("DELETE /api/v1/boards/:boardId/collaborators/:userId", () => {
        it("should remove collaborator by owner successfully", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Project Board" });
            const boardId = boardRes.body.id;

            await db.collaborator.create({
                data: { boardId, userId: collab.userId, role: "viewer" },
            });

            const deleteRes = await request(app)
                .delete(`/api/v1/boards/${boardId}/collaborators/${collab.userId}`)
                .set("Authorization", `Bearer ${owner.token}`);

            expect(deleteRes.status).toBe(200);
            expect(deleteRes.body.message).toBe("Collaborator removed successfully");

            const inDb = await db.collaborator.findUnique({
                where: { userId_boardId: { userId: collab.userId, boardId } },
            });
            expect(inDb).toBeNull();
        });

        it("should allow collaborator to leave the board themselves", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Project Board" });
            const boardId = boardRes.body.id;

            await db.collaborator.create({
                data: { boardId, userId: collab.userId, role: "viewer" },
            });

            const deleteRes = await request(app)
                .delete(`/api/v1/boards/${boardId}/collaborators/${collab.userId}`)
                .set("Authorization", `Bearer ${collab.token}`);

            expect(deleteRes.status).toBe(200);

            const inDb = await db.collaborator.findUnique({
                where: { userId_boardId: { userId: collab.userId, boardId } },
            });
            expect(inDb).toBeNull();
        });

        it("should return 403 when unauthorized user tries to remove", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const collab = await getAuthToken("collab@example.com", "Collab");
            const other = await getAuthToken("other@example.com", "Other");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Board" });
            const boardId = boardRes.body.id;

            await db.collaborator.create({
                data: { boardId, userId: collab.userId, role: "editor" },
            });

            // "other" is neither owner nor the collaborator being removed
            const deleteRes = await request(app)
                .delete(`/api/v1/boards/${boardId}/collaborators/${collab.userId}`)
                .set("Authorization", `Bearer ${other.token}`);

            expect(deleteRes.status).toBe(403);
        });
    });

    // =========================================================================
    // POST /api/v1/invites/redeem
    // =========================================================================
    describe("POST /api/v1/invites/redeem", () => {
        it("should redeem invite code and join board successfully", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const joiner = await getAuthToken("joiner@example.com", "Joiner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Shared Project" });
            const boardId = boardRes.body.id;

            await db.inviteLink.create({
                data: {
                    boardId,
                    createdById: owner.userId,
                    role: "editor",
                    inviteCode: "testcode123",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                },
            });

            const redeemRes = await request(app)
                .post("/api/v1/invites/redeem")
                .set("Authorization", `Bearer ${joiner.token}`)
                .send({ inviteCode: "testcode123" });

            expect(redeemRes.status).toBe(200);
            expect(redeemRes.body.board.id).toBe(boardId);
            expect(redeemRes.body.board.title).toBe("Shared Project");
            expect(redeemRes.body.role).toBe("editor");

            // Verify collaborator was created in DB
            const collab = await db.collaborator.findUnique({
                where: { userId_boardId: { userId: joiner.userId, boardId } },
            });
            expect(collab).toBeTruthy();
            expect(collab?.role).toBe("editor");

            // Verify notification was created for the board owner
            const notification = await db.notification.findFirst({
                where: { userId: owner.userId, type: "invite" },
            });
            expect(notification).toBeTruthy();
            expect(notification?.boardId).toBe(boardId);
        });

        it("should return 400 when invite code has expired", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const joiner = await getAuthToken("joiner@example.com", "Joiner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Expired Board" });

            await db.inviteLink.create({
                data: {
                    boardId: boardRes.body.id,
                    createdById: owner.userId,
                    role: "viewer",
                    inviteCode: "expiredcode",
                    expiresAt: new Date(Date.now() - 1000), // expired
                },
            });

            const redeemRes = await request(app)
                .post("/api/v1/invites/redeem")
                .set("Authorization", `Bearer ${joiner.token}`)
                .send({ inviteCode: "expiredcode" });

            expect(redeemRes.status).toBe(400);
        });

        it("should return 404 for non-existent invite code", async () => {
            const joiner = await getAuthToken("joiner@example.com", "Joiner");

            const redeemRes = await request(app)
                .post("/api/v1/invites/redeem")
                .set("Authorization", `Bearer ${joiner.token}`)
                .send({ inviteCode: "doesnotexist" });

            expect(redeemRes.status).toBe(404);
        });

        it("should return 400 when owner tries to redeem own board invite", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "My Board" });

            await db.inviteLink.create({
                data: {
                    boardId: boardRes.body.id,
                    createdById: owner.userId,
                    role: "editor",
                    inviteCode: "ownercode",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                },
            });

            const redeemRes = await request(app)
                .post("/api/v1/invites/redeem")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ inviteCode: "ownercode" });

            expect(redeemRes.status).toBe(400);
        });

        it("should be idempotent when already a collaborator", async () => {
            const owner = await getAuthToken("owner@example.com", "Owner");
            const joiner = await getAuthToken("joiner@example.com", "Joiner");

            const boardRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Board" });
            const boardId = boardRes.body.id;

            // Add as collaborator first
            await db.collaborator.create({
                data: { boardId, userId: joiner.userId, role: "editor" },
            });

            await db.inviteLink.create({
                data: {
                    boardId,
                    createdById: owner.userId,
                    role: "viewer",
                    inviteCode: "dupecode",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                },
            });

            const redeemRes = await request(app)
                .post("/api/v1/invites/redeem")
                .set("Authorization", `Bearer ${joiner.token}`)
                .send({ inviteCode: "dupecode" });

            // Should succeed idempotently
            expect(redeemRes.status).toBe(200);
            expect(redeemRes.body.board.id).toBe(boardId);
        });
    });
});
