import request from "supertest";
import { app } from "../index.js";
import { clearDatabase } from "./setup.js";
import db from "../utils/db.js";

async function getAuthToken(email: string = "boarduser@example.com") {
    await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        fullName: "Board User",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
        email,
        password: "Password123!",
    });

    return { token: response.body.accessToken, userId: response.body.user.id };
}

describe("Board Domain", () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    describe("POST /api/v1/boards", () => {
        it("should create a new board successfully", async () => {
            const { token, userId } = await getAuthToken();

            const response = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "My New Board" });

            expect(response.status).toBe(201);
            expect(response.body.id).toBeTruthy();
            expect(response.body.title).toBe("My New Board");
            expect(response.body.type).toBe("personal");
            expect(response.body.status).toBe("active");
            expect(response.body.ownerId).toBe(userId);
            expect(response.body.visibilityIcon).toBe("private");
            expect(response.body.badge).toBeNull();
            expect(response.body.sharedBy).toBeNull();
            expect(response.body.collaborators).toEqual([]);
            expect(response.body.extraCollaboratorsCount).toBe(0);
            expect(response.body.createdAt).toBeDefined();
            expect(response.body.updatedAt).toBeDefined();
        });

        it("should return 401 without auth", async () => {
            const response = await request(app)
                .post("/api/v1/boards")
                .send({ title: "Nope" });
            expect(response.status).toBe(401);
        });

        it("should return 400 with empty title", async () => {
            const { token } = await getAuthToken();
            const response = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "" });
            expect(response.status).toBe(400);
        });
    });

    describe("GET /api/v1/boards", () => {
        it("should list user boards", async () => {
            const { token } = await getAuthToken();

            await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Board 1" });

            const response = await request(app)
                .get("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].title).toBe("Board 1");
            expect(response.body.meta).toBeDefined();
            expect(response.body.meta.total).toBe(1);
        });

        it("should filter personal boards", async () => {
            const { token } = await getAuthToken();

            await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "My Board" });

            const response = await request(app)
                .get("/api/v1/boards?type=personal")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].type).toBe("personal");
        });
    });

    describe("GET /api/v1/boards/:boardId", () => {
        it("should fetch a single board", async () => {
            const { token } = await getAuthToken();

            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Fetch Me" });

            const boardId = createRes.body.id;

            const response = await request(app)
                .get(`/api/v1/boards/${boardId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe("Fetch Me");
            expect(response.body.id).toBe(boardId);
            expect(response.body.type).toBe("personal");
        });

        it("should return 404 for non-existent board", async () => {
            const { token } = await getAuthToken();
            const response = await request(app)
                .get("/api/v1/boards/a0000000-0000-4000-8000-ffffffffffff")
                .set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(404);
        });

        it("should return 403 when user has no access", async () => {
            const owner = await getAuthToken("owner@example.com");
            const other = await getAuthToken("other@example.com");

            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Private" });

            const response = await request(app)
                .get(`/api/v1/boards/${createRes.body.id}`)
                .set("Authorization", `Bearer ${other.token}`);

            expect(response.status).toBe(403);
        });
    });

    describe("PATCH /api/v1/boards/:boardId", () => {
        it("should update board title", async () => {
            const { token } = await getAuthToken();
            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Old Title" });

            const boardId = createRes.body.id;

            const response = await request(app)
                .patch(`/api/v1/boards/${boardId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "New Title" });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe("New Title");
            expect(response.body.id).toBe(boardId);
        });

        it("should archive a board", async () => {
            const { token } = await getAuthToken();
            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Archive Me" });

            const response = await request(app)
                .patch(`/api/v1/boards/${createRes.body.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ isArchived: true });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("archived");
        });

        it("should return 403 for non-owner", async () => {
            const owner = await getAuthToken("owner@example.com");
            const other = await getAuthToken("other@example.com");

            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Owned Board" });

            const response = await request(app)
                .patch(`/api/v1/boards/${createRes.body.id}`)
                .set("Authorization", `Bearer ${other.token}`)
                .send({ title: "Hacked" });

            expect(response.status).toBe(403);
        });
    });

    describe("DELETE /api/v1/boards/:boardId", () => {
        it("should delete a board", async () => {
            const { token } = await getAuthToken();
            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Delete Me" });

            const boardId = createRes.body.id;

            const response = await request(app)
                .delete(`/api/v1/boards/${boardId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(204);

            const board = await db.board.findUnique({ where: { id: boardId } });
            expect(board).toBeNull();
        });

        it("should return 403 for non-owner", async () => {
            const owner = await getAuthToken("owner@example.com");
            const other = await getAuthToken("other@example.com");

            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${owner.token}`)
                .send({ title: "Mine" });

            const response = await request(app)
                .delete(`/api/v1/boards/${createRes.body.id}`)
                .set("Authorization", `Bearer ${other.token}`);

            expect(response.status).toBe(403);
        });
    });

    describe("POST /api/v1/boards/:boardId/thumbnail", () => {
        it("should upload a board thumbnail (mocked)", async () => {
            const { token } = await getAuthToken();
            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Thumbnail Board" });

            const boardId = createRes.body.id;

            const response = await request(app)
                .post(`/api/v1/boards/${boardId}/thumbnail`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.thumbnailUrl).toBeTruthy();
        });
    });

    describe("POST /api/v1/boards/:boardId/export", () => {
        it("should request a board export (mocked)", async () => {
            const { token } = await getAuthToken();
            const createRes = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Export Board" });

            const boardId = createRes.body.id;

            const response = await request(app)
                .post(`/api/v1/boards/${boardId}/export`)
                .set("Authorization", `Bearer ${token}`)
                .send({ format: "png" });

            expect(response.status).toBe(202);
            expect(response.body.downloadUrl).toBeTruthy();
            expect(response.body.expiresAt).toBeTruthy();
        });
    });
});
