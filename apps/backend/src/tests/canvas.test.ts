import request from "supertest";
import { app } from "../index.js";
import { clearDatabase } from "./setup.js";
import db from "../utils/db.js";

async function getAuthToken(email: string, fullName: string = "Canvas User") {
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

describe("Canvas State REST API Domain", () => {
    let ownerToken: string;
    let ownerId: string;
    let editorToken: string;
    let editorId: string;
    let viewerToken: string;
    let viewerId: string;
    let otherToken: string;
    let otherId: string;
    let boardId: string;

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
            .send({ title: "Canvas Test Board" });

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
    });

    describe("GET /api/v1/boards/:boardId/canvas/elements", () => {
        it("should return 401 if not authenticated", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/canvas/elements`);
            expect(res.status).toBe(401);
        });

        it("should return 404 if board does not exist", async () => {
            const nonExistentBoard = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .get(`/api/v1/boards/${nonExistentBoard}/canvas/elements`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(res.status).toBe(404);
        });

        it("should return 403 if user does not have access to the board", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/canvas/elements`)
                .set("Authorization", `Bearer ${otherToken}`);
            expect(res.status).toBe(403);
        });

        it("should return elements successfully for board owner (even if empty)", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/canvas/elements`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.boardId).toBe(boardId);
            expect(res.body.elements).toBeInstanceOf(Array);
            expect(res.body.elements.length).toBe(0);
            expect(res.body.lastSavedAt).toBeDefined();
        });

        it("should return elements successfully for editor collaborator", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/canvas/elements`)
                .set("Authorization", `Bearer ${editorToken}`);
            expect(res.status).toBe(200);
            expect(res.body.boardId).toBe(boardId);
            expect(res.body.elements.length).toBe(0);
        });

        it("should return elements successfully for viewer collaborator", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/canvas/elements`)
                .set("Authorization", `Bearer ${viewerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.boardId).toBe(boardId);
            expect(res.body.elements.length).toBe(0);
        });
    });

    describe("PUT /api/v1/boards/:boardId/canvas/snapshot", () => {
        const sampleTextElement = {
            id: "a1111111-1111-4111-8111-111111111111",
            type: "text",
            x: 150,
            y: 200,
            width: 100,
            height: 40,
            rotation: 0,
            zIndex: 10,
            isLocked: false,
            appearance: {
                fillColor: "#ffffff",
                strokeColor: "#000000",
                strokeWidth: 2,
                opacity: 0.9,
                fontSize: 16,
                fontFamily: "Outfit",
                fontWeight: "medium",
                textAlign: "center",
            },
            content: "Welcome to Sefirah",
            createdBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const sampleRectangleElement = {
            id: "b2222222-2222-4222-8222-222222222222",
            type: "rectangle",
            x: 300,
            y: 350,
            width: 200,
            height: 150,
            rotation: 15,
            zIndex: 5,
            isLocked: true,
            appearance: {
                fillColor: "#ffebee",
                strokeColor: "#ff1744",
                strokeWidth: 3,
                opacity: 1,
            },
            createdBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        it("should return 401 if not authenticated", async () => {
            const res = await request(app)
                .put(`/api/v1/boards/${boardId}/canvas/snapshot`)
                .send({ elements: [sampleTextElement] });
            expect(res.status).toBe(401);
        });

        it("should return 404 if board does not exist", async () => {
            const nonExistentBoard = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .put(`/api/v1/boards/${nonExistentBoard}/canvas/snapshot`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ elements: [sampleTextElement] });
            expect(res.status).toBe(404);
        });

        it("should return 403 if user is other and has no access", async () => {
            const res = await request(app)
                .put(`/api/v1/boards/${boardId}/canvas/snapshot`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ elements: [sampleTextElement] });
            expect(res.status).toBe(403);
        });

        it("should return 403 if collaborator has viewer role", async () => {
            const res = await request(app)
                .put(`/api/v1/boards/${boardId}/canvas/snapshot`)
                .set("Authorization", `Bearer ${viewerToken}`)
                .send({ elements: [sampleTextElement] });
            expect(res.status).toBe(403);
        });

        it("should return 400 if validation fails due to malformed element", async () => {
            const malformedElement = {
                id: "not-a-uuid",
                type: "invalid-type",
                x: "should-be-number",
            };

            const res = await request(app)
                .put(`/api/v1/boards/${boardId}/canvas/snapshot`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ elements: [malformedElement] });
            expect(res.status).toBe(400);
        });

        it("should save elements successfully for owner", async () => {
            // First save
            let res = await request(app)
                .put(`/api/v1/boards/${boardId}/canvas/snapshot`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ elements: [sampleTextElement, sampleRectangleElement] });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("saved");

            // Fetch to verify elements were saved
            let getRes = await request(app)
                .get(`/api/v1/boards/${boardId}/canvas/elements`)
                .set("Authorization", `Bearer ${ownerToken}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.elements.length).toBe(2);

            const textEl = getRes.body.elements.find((el: any) => el.type === "text");
            expect(textEl).toBeDefined();
            expect(textEl.content).toBe("Welcome to Sefirah");
            expect(textEl.appearance.fontFamily).toBe("Outfit");

            const rectEl = getRes.body.elements.find((el: any) => el.type === "rectangle");
            expect(rectEl).toBeDefined();
            expect(rectEl.isLocked).toBe(true);
            expect(rectEl.rotation).toBe(15);
        });

        it("should save elements successfully for editor collaborator", async () => {
            const res = await request(app)
                .put(`/api/v1/boards/${boardId}/canvas/snapshot`)
                .set("Authorization", `Bearer ${editorToken}`)
                .send({ elements: [sampleTextElement] });

            expect(res.status).toBe(200);

            // Fetch elements
            const getRes = await request(app)
                .get(`/api/v1/boards/${boardId}/canvas/elements`)
                .set("Authorization", `Bearer ${editorToken}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.elements.length).toBe(1);
            expect(getRes.body.elements[0].content).toBe("Welcome to Sefirah");
        });

        it("should handle updating existing elements and deleting missing ones (diffing logic)", async () => {
            // 1. Initial snapshot with two elements
            await request(app)
                .put(`/api/v1/boards/${boardId}/canvas/snapshot`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ elements: [sampleTextElement, sampleRectangleElement] });

            // 2. Send snapshot with one element updated (text content changed) and one element deleted (rectangle is gone)
            const updatedTextElement = {
                ...sampleTextElement,
                content: "Updated Content",
                x: 160, // changed coordinate
            };

            const res = await request(app)
                .put(`/api/v1/boards/${boardId}/canvas/snapshot`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ elements: [updatedTextElement] });

            expect(res.status).toBe(200);

            // 3. Retrieve to verify diff was applied
            const getRes = await request(app)
                .get(`/api/v1/boards/${boardId}/canvas/elements`)
                .set("Authorization", `Bearer ${ownerToken}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.elements.length).toBe(1);
            expect(getRes.body.elements[0].content).toBe("Updated Content");
            expect(getRes.body.elements[0].x).toBe(160);
        });
    });
});
