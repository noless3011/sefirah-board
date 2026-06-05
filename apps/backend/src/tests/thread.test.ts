import request from "supertest";
import { app } from "../index.js";
import { clearDatabase } from "./setup.js";
import db from "../utils/db.js";
import { ThreadSchema, ThreadReplySchema } from "@sefirah/shared";

async function getAuthToken(email: string, fullName: string = "Thread User") {
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

describe("Active Threads / Chat REST API Domain", () => {
    let ownerToken: string;
    let ownerId: string;
    let editorToken: string;
    let editorId: string;
    let viewerToken: string;
    let viewerId: string;
    let otherToken: string;
    let otherId: string;
    let boardId: string;
    let elementId: string;

    beforeEach(async () => {
        await clearDatabase();

        // Register users
        const owner = await getAuthToken("owner@example.com", "Board Owner");
        ownerToken = owner.token;
        ownerId = owner.userId;

        const editor = await getAuthToken("editor@example.com", "Editor User");
        editorToken = editor.token;
        editorId = editor.userId;

        const viewer = await getAuthToken("viewer@example.com", "Viewer User");
        viewerToken = viewer.token;
        viewerId = viewer.userId;

        const other = await getAuthToken("other@example.com", "Other User");
        otherToken = other.token;
        otherId = other.userId;

        // Create a board owned by owner
        const createRes = await request(app)
            .post("/api/v1/boards")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ title: "Threads Test Board" });

        boardId = createRes.body.id;

        // Add collaborators
        await db.collaborator.create({
            data: {
                userId: editorId,
                boardId,
                role: "editor",
            },
        });

        await db.collaborator.create({
            data: {
                userId: viewerId,
                boardId,
                role: "viewer",
            },
        });

        // Create a canvas element on the board
        const element = await db.element.create({
            data: {
                id: "e1111111-1111-4111-8111-111111111111",
                boardId,
                type: "rectangle",
                x: 100,
                y: 100,
                width: 50,
                height: 50,
                appearance: {},
            },
        });
        elementId = element.id;
    });

    describe("GET /api/v1/boards/:boardId/threads", () => {
        it("should return 401 if not authenticated", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/threads`);
            expect(res.status).toBe(401);
        });

        it("should return 404 if board does not exist", async () => {
            const nonExistentBoard = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .get(`/api/v1/boards/${nonExistentBoard}/threads`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(res.status).toBe(404);
        });

        it("should return 403 if user has no access to the board", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${otherToken}`);
            expect(res.status).toBe(403);
        });

        it("should return empty array if there are no threads", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe("POST /api/v1/boards/:boardId/threads", () => {
        it("should return 401 if not authenticated", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads`)
                .send({ targetElementId: elementId, message: "Hello world" });
            expect(res.status).toBe(401);
        });

        it("should return 404 if board does not exist", async () => {
            const nonExistentBoard = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .post(`/api/v1/boards/${nonExistentBoard}/threads`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ targetElementId: elementId, message: "Hello world" });
            expect(res.status).toBe(404);
        });

        it("should return 403 if user has no access to the board", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ targetElementId: elementId, message: "Hello world" });
            expect(res.status).toBe(403);
        });

        it("should return 404 if targetElementId does not exist on the board", async () => {
            const nonExistentElement = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ targetElementId: nonExistentElement, message: "Hello world" });
            expect(res.status).toBe(404);
        });

        it("should return 400 if message is empty or missing", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ targetElementId: elementId, message: "" });
            expect(res.status).toBe(400);
        });

        it("should create a thread successfully (Owner)", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ targetElementId: elementId, message: "Test thread message" });

            expect(res.status).toBe(201);
            expect(res.body.boardId).toBe(boardId);
            expect(res.body.targetElementId).toBe(elementId);
            expect(res.body.authorId).toBe(ownerId);
            expect(res.body.authorName).toBe("Board Owner");
            expect(res.body.message).toBe("Test thread message");
            expect(res.body.status).toBe("open");
            expect(res.body.replies).toEqual([]);
            expect(ThreadSchema.safeParse(res.body).success).toBe(true);

            // Verify comment notification was created for other board members (editor and viewer, not owner itself)
            const notifications = await db.notification.findMany();
            expect(notifications.length).toBe(2);
            const userIds = notifications.map(n => n.userId);
            expect(userIds).toContain(editorId);
            expect(userIds).toContain(viewerId);
            expect(userIds).not.toContain(ownerId);
            expect(notifications[0]!.type).toBe("comment");
        });

        it("should create a thread successfully (Viewer collaborator)", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${viewerToken}`)
                .send({ targetElementId: elementId, message: "Viewer commenting" });

            expect(res.status).toBe(201);
            expect(res.body.authorId).toBe(viewerId);
            expect(res.body.message).toBe("Viewer commenting");

            // Verify notifications were created for owner and editor, not viewer
            const notifications = await db.notification.findMany();
            expect(notifications.length).toBe(2);
            const userIds = notifications.map(n => n.userId);
            expect(userIds).toContain(ownerId);
            expect(userIds).toContain(editorId);
            expect(userIds).not.toContain(viewerId);
        });

        it("should trigger mention notifications if user is mentioned", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ targetElementId: elementId, message: "Hey @Editor User look at this" });

            expect(res.status).toBe(201);

            const notifications = await db.notification.findMany({
                orderBy: { userId: "asc" }
            });
            // editor (mentioned -> mention) and viewer (not mentioned -> comment)
            expect(notifications.length).toBe(2);

            const mentionNotification = notifications.find(n => n.userId === editorId);
            expect(mentionNotification).toBeDefined();
            expect(mentionNotification?.type).toBe("mention");

            const commentNotification = notifications.find(n => n.userId === viewerId);
            expect(commentNotification).toBeDefined();
            expect(commentNotification?.type).toBe("comment");
        });
    });

    describe("POST /api/v1/boards/:boardId/threads/:threadId/reply", () => {
        let threadId: string;

        beforeEach(async () => {
            const thread = await db.thread.create({
                data: {
                    boardId,
                    targetElementId: elementId,
                    authorId: ownerId,
                    authorName: "Board Owner",
                    message: "Initial thread",
                    status: "open",
                }
            });
            threadId = thread.id;
        });

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads/${threadId}/reply`)
                .send({ message: "Replying back" });
            expect(res.status).toBe(401);
        });

        it("should return 404 if thread does not exist", async () => {
            const nonExistentThread = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads/${nonExistentThread}/reply`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ message: "Replying back" });
            expect(res.status).toBe(404);
        });

        it("should return 403 if user has no access to the board", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads/${threadId}/reply`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ message: "Replying back" });
            expect(res.status).toBe(403);
        });

        it("should return 400 if message is empty", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads/${threadId}/reply`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ message: "" });
            expect(res.status).toBe(400);
        });

        it("should reply successfully (Editor)", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads/${threadId}/reply`)
                .set("Authorization", `Bearer ${editorToken}`)
                .send({ message: "This is a reply" });

            expect(res.status).toBe(201);
            expect(res.body.threadId).toBe(threadId);
            expect(res.body.authorId).toBe(editorId);
            expect(res.body.authorName).toBe("Editor User");
            expect(res.body.message).toBe("This is a reply");
            expect(ThreadReplySchema.safeParse(res.body).success).toBe(true);

            // Fetch thread and verify replies are populated
            const getRes = await request(app)
                .get(`/api/v1/boards/${boardId}/threads`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body[0].replies.length).toBe(1);
            expect(getRes.body[0].replies[0].message).toBe("This is a reply");
        });

        it("should trigger mention notifications for replies if user is mentioned", async () => {
            // clear existing notifications first
            await db.notification.deleteMany();

            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/threads/${threadId}/reply`)
                .set("Authorization", `Bearer ${editorToken}`)
                .send({ message: "Replying to @Board Owner here" });

            expect(res.status).toBe(201);

            // Check if mention notification was created for Owner
            const notifications = await db.notification.findMany();
            expect(notifications.length).toBe(1);
            expect(notifications[0]!.userId).toBe(ownerId);
            expect(notifications[0]!.type).toBe("mention");
        });
    });

    describe("PATCH /api/v1/boards/:boardId/threads/:threadId", () => {
        let threadId: string;

        beforeEach(async () => {
            const thread = await db.thread.create({
                data: {
                    boardId,
                    targetElementId: elementId,
                    authorId: ownerId,
                    authorName: "Board Owner",
                    message: "Initial thread",
                    status: "open",
                }
            });
            threadId = thread.id;
        });

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .patch(`/api/v1/boards/${boardId}/threads/${threadId}`)
                .send({ status: "resolved" });
            expect(res.status).toBe(401);
        });

        it("should return 404 if thread does not exist", async () => {
            const nonExistentThread = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .patch(`/api/v1/boards/${boardId}/threads/${nonExistentThread}`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ status: "resolved" });
            expect(res.status).toBe(404);
        });

        it("should return 403 if user has no access to the board", async () => {
            const res = await request(app)
                .patch(`/api/v1/boards/${boardId}/threads/${threadId}`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ status: "resolved" });
            expect(res.status).toBe(403);
        });

        it("should return 400 if status is invalid or missing", async () => {
            const res = await request(app)
                .patch(`/api/v1/boards/${boardId}/threads/${threadId}`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ status: "open" }); // UpdateThreadPayloadSchema only allows "resolved"
            expect(res.status).toBe(400);
        });

        it("should resolve the thread successfully (Editor)", async () => {
            const res = await request(app)
                .patch(`/api/v1/boards/${boardId}/threads/${threadId}`)
                .set("Authorization", `Bearer ${editorToken}`)
                .send({ status: "resolved" });

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(threadId);
            expect(res.body.status).toBe("resolved");
        });
    });
});
