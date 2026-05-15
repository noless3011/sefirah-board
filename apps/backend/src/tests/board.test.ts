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
            const { token } = await getAuthToken();

            const response = await request(app)
                .post("/api/v1/boards")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "My New Board" });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe("My New Board");
            expect(response.body.id).toBeTruthy();
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
        });

        it("should return 404 for non-existent board", async () => {
            const { token } = await getAuthToken();
            const response = await request(app)
                .get("/api/v1/boards/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(404);
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
        });
    });
});
