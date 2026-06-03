import request from "supertest";
import { app } from "../index.js";
import { clearDatabase } from "./setup.js";
import db from "../utils/db.js";

async function getAuthToken(email: string, fullName: string = "History User") {
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

describe("Board History Domain", () => {
    let ownerToken: string;
    let ownerId: string;
    let editorToken: string;
    let editorId: string;
    let viewerToken: string;
    let viewerId: string;
    let otherToken: string;
    let otherId: string;
    let boardId: string;

    const sampleElement = {
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
        content: "Hello World",
        createdBy: null,
        createdAt: "2026-06-03T15:42:24.000Z",
        updatedAt: "2026-06-03T15:42:24.000Z",
    };

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
            .send({ title: "History Test Board" });

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

    describe("GET /api/v1/boards/:boardId/history", () => {
        it("should return 401 if not authenticated", async () => {
            const res = await request(app).get(`/api/v1/boards/${boardId}/history`);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user does not have read access", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/history`)
                .set("Authorization", `Bearer ${otherToken}`);
            expect(res.status).toBe(403);
        });

        it("should return 404 if board does not exist", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/00000000-0000-0000-0000-000000000000/history`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(res.status).toBe(404);
        });

        it("should return list of board revisions for owner/collaborators", async () => {
            // Seed a revision
            await db.boardRevision.create({
                data: {
                    boardId,
                    authorId: ownerId,
                    authorName: "Board Owner",
                    description: "First Draft",
                    elementCount: 1,
                    elements: [sampleElement],
                    createdAt: new Date("2026-06-01T12:00:00.000Z"),
                },
            });

            await db.boardRevision.create({
                data: {
                    boardId,
                    authorId: editorId,
                    authorName: "Editor User",
                    description: "Second Draft",
                    elementCount: 2,
                    elements: [sampleElement, { ...sampleElement, id: "a2222222-2222-4222-8222-222222222222" }],
                    createdAt: new Date("2026-06-02T12:00:00.000Z"),
                },
            });

            // Owner fetch
            const resOwner = await request(app)
                .get(`/api/v1/boards/${boardId}/history`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(resOwner.status).toBe(200);
            expect(resOwner.body.length).toBe(2);
            expect(resOwner.body[0].description).toBe("Second Draft"); // Descending order
            expect(resOwner.body[1].description).toBe("First Draft");
            expect(resOwner.body[0].authorName).toBe("Editor User");
            expect(resOwner.body[0].elementCount).toBe(2);

            // Viewer fetch
            const resViewer = await request(app)
                .get(`/api/v1/boards/${boardId}/history`)
                .set("Authorization", `Bearer ${viewerToken}`);
            expect(resViewer.status).toBe(200);
            expect(resViewer.body.length).toBe(2);
        });

        it("should limit the number of revisions returned", async () => {
            // Seed 3 revisions
            for (let i = 1; i <= 3; i++) {
                await db.boardRevision.create({
                    data: {
                        boardId,
                        authorId: ownerId,
                        authorName: "Board Owner",
                        description: `Draft ${i}`,
                        elementCount: 0,
                        elements: [],
                        createdAt: new Date(`2026-06-0${i}T12:00:00.000Z`),
                    },
                });
            }

            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/history?limit=2`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].description).toBe("Draft 3");
            expect(res.body[1].description).toBe("Draft 2");
        });
    });

    describe("GET /api/v1/boards/:boardId/history/:revisionId", () => {
        let revId: string;

        beforeEach(async () => {
            const rev = await db.boardRevision.create({
                data: {
                    boardId,
                    authorId: ownerId,
                    authorName: "Board Owner",
                    description: "Details test",
                    elementCount: 1,
                    elements: [sampleElement],
                },
            });
            revId = rev.id;
        });

        it("should return 401 if not authenticated", async () => {
            const res = await request(app).get(`/api/v1/boards/${boardId}/history/${revId}`);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user does not have read access", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/history/${revId}`)
                .set("Authorization", `Bearer ${otherToken}`);
            expect(res.status).toBe(403);
        });

        it("should return 404 if revision does not exist", async () => {
            const nonExistentId = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/history/${nonExistentId}`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(res.status).toBe(404);
        });

        it("should return full revision state", async () => {
            const res = await request(app)
                .get(`/api/v1/boards/${boardId}/history/${revId}`)
                .set("Authorization", `Bearer ${ownerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(revId);
            expect(res.body.description).toBe("Details test");
            expect(res.body.elements).toBeInstanceOf(Array);
            expect(res.body.elements.length).toBe(1);
            expect(res.body.elements[0].id).toBe(sampleElement.id);
        });
    });

    describe("POST /api/v1/boards/:boardId/history/restore", () => {
        let revId: string;
        let elementsToRestore: any[];

        beforeEach(async () => {
            elementsToRestore = [
                {
                    ...sampleElement,
                    id: "a1111111-1111-4111-8111-111111111111",
                    content: "Restored content",
                },
            ];

            const rev = await db.boardRevision.create({
                data: {
                    boardId,
                    authorId: ownerId,
                    authorName: "Board Owner",
                    description: "To be restored",
                    elementCount: 1,
                    elements: elementsToRestore,
                },
            });
            revId = rev.id;

            // Add an existing element to the board currently, to verify it gets replaced
            await db.element.create({
                data: {
                    id: "a2222222-2222-4222-8222-222222222222",
                    boardId,
                    type: "text",
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 50,
                    zIndex: 0,
                    appearance: {},
                    content: "Current content",
                },
            });
        });

        it("should return 401 if not authenticated", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/history/restore`)
                .send({ revisionId: revId });
            expect(res.status).toBe(401);
        });

        it("should return 403 if viewer tries to restore", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/history/restore`)
                .set("Authorization", `Bearer ${viewerToken}`)
                .send({ revisionId: revId });
            expect(res.status).toBe(403);
        });

        it("should return 404 if revision does not exist", async () => {
            const nonExistentId = "00000000-0000-0000-0000-000000000000";
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/history/restore`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ revisionId: nonExistentId });
            expect(res.status).toBe(404);
        });

        it("should restore board successfully for owner and create a new revision", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/history/restore`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ revisionId: revId });

            expect(res.status).toBe(200);
            expect(res.body.revision).toBeDefined();
            expect(res.body.revision.description).toContain("Restored from revision");
            expect(res.body.elements).toBeInstanceOf(Array);
            expect(res.body.elements.length).toBe(1);
            expect(res.body.elements[0].content).toBe("Restored content");

            // Verify elements in DB have been updated
            const dbElements = await db.element.findMany({ where: { boardId } });
            expect(dbElements.length).toBe(1);
            expect(dbElements[0]?.id).toBe("a1111111-1111-4111-8111-111111111111");
            expect(dbElements[0]?.content).toBe("Restored content");

            // Verify new board revision entry exists
            const latestRevision = await db.boardRevision.findFirst({
                where: { boardId },
                orderBy: { createdAt: "desc" },
            });
            expect(latestRevision?.description).toBe(`Restored from revision ${revId}`);
            expect(latestRevision?.authorId).toBe(ownerId);
            expect(latestRevision?.authorName).toBe("Board Owner");
        });

        it("should restore board successfully for editor and create a new revision", async () => {
            const res = await request(app)
                .post(`/api/v1/boards/${boardId}/history/restore`)
                .set("Authorization", `Bearer ${editorToken}`)
                .send({ revisionId: revId });

            expect(res.status).toBe(200);
            expect(res.body.revision.authorId).toBe(editorId);
            expect(res.body.revision.authorName).toBe("Editor User");
        });
    });
});
