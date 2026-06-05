import { io as ClientIO, Socket as ClientSocket } from "socket.io-client";
import jwt from "jsonwebtoken";
import { app, httpServer, io } from "../index.js";
import { clearDatabase } from "./setup.js";
import db from "../utils/db.js";
import request from "supertest";

const JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_123";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Register + login a user via REST and return { user, accessToken } */
async function createAuthenticatedUser(overrides?: {
    email?: string;
    fullName?: string;
    password?: string;
}) {
    const email = overrides?.email ?? "ws-user@test.com";
    const fullName = overrides?.fullName ?? "WS User";
    const password = overrides?.password ?? "Password123!";

    await request(app)
        .post("/api/v1/auth/register")
        .send({ email, password, fullName });

    const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password });

    return {
        user: loginRes.body.user,
        accessToken: loginRes.body.accessToken,
    };
}

/** Create a board owned by the given user */
async function createBoard(ownerId: string, title = "Test Board") {
    const board = await db.board.create({
        data: { title, ownerId },
    });
    return board;
}

let serverPort: number;
let serverUrl: string;

function connectClient(token?: string): ClientSocket {
    const opts: any = {
        transports: ["websocket"],
        autoConnect: false,
    };
    if (token) {
        opts.auth = { token };
    }
    return ClientIO(`${serverUrl}/workspace`, opts);
}

/** Wait for an event on a socket with a timeout */
function waitForEvent<T = any>(
    socket: ClientSocket,
    event: string,
    timeoutMs = 3000,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timed out waiting for event "${event}"`));
        }, timeoutMs);

        socket.once(event, (data: T) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

/** Small delay helper */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("WebSocket System (/workspace namespace)", () => {
    let clientA: ClientSocket | undefined = undefined;
    let clientB: ClientSocket | undefined = undefined;
    let clientC: ClientSocket | undefined = undefined;

    beforeAll(async () => {
        // Start the HTTP server on a random port for tests
        await new Promise<void>((resolve) => {
            httpServer.listen(0, () => {
                const addr = httpServer.address();
                if (addr && typeof addr === "object") {
                    serverPort = addr.port;
                    serverUrl = `http://localhost:${serverPort}`;
                }
                resolve();
            });
        });
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    afterEach(() => {
        // Disconnect all clients after each test
        for (const client of [clientA, clientB, clientC]) {
            if (client?.connected) {
                client.disconnect();
            }
        }
    });

    // =========================================================================
    // 1. Connection & Authentication
    // =========================================================================

    describe("Connection & Authentication", () => {
        it("should allow a client to connect to /workspace with a valid JWT", async () => {
            const { accessToken } = await createAuthenticatedUser();

            clientA = connectClient(accessToken);
            clientA.connect();

            await waitForEvent(clientA, "connect");
            expect(clientA.connected).toBe(true);
        });

        it("should reject connection with an invalid JWT", async () => {
            clientA = connectClient("invalid.jwt.token");
            clientA.connect();

            const error = await waitForEvent<Error>(
                clientA,
                "connect_error",
            );
            expect(error).toBeDefined();
            expect(error.message).toContain("Authentication");
        });

        it("should reject connection with no token", async () => {
            clientA = connectClient();
            clientA.connect();

            const error = await waitForEvent<Error>(
                clientA,
                "connect_error",
            );
            expect(error).toBeDefined();
            expect(error.message).toContain("Authentication");
        });
    });

    // =========================================================================
    // 2. Room Management
    // =========================================================================

    describe("Room Management", () => {
        it("should allow a user to join a board room via join-room", async () => {
            const { user, accessToken } = await createAuthenticatedUser();
            const board = await createBoard(user.id);

            clientA = connectClient(accessToken);
            clientA.connect();
            await waitForEvent(clientA, "connect");

            // Emit join-room – should not throw
            clientA.emit("join-room", { boardId: board.id });

            // Give a small window for the server to process
            await delay(100);

            // Verify by checking that we don't get disconnected
            expect(clientA.connected).toBe(true);
        });

        it("should broadcast user-joined to other clients in the room", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { user: userB, accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const board = await createBoard(userA.id);

            // Client A joins first
            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            // Listen for user-joined on client A
            const joinedPromise = waitForEvent<{
                user: { userId: string; fullName: string };
            }>(clientA, "user-joined");

            // Client B joins
            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: board.id });

            const joinedPayload = await joinedPromise;
            expect(joinedPayload.user).toBeDefined();
            expect(joinedPayload.user.userId).toBe(userB.id);
            expect(joinedPayload.user.fullName).toBe("User B");
        });

        it("should broadcast user-left when a client disconnects", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { user: userB, accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const board = await createBoard(userA.id);

            // Both clients join the room
            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: board.id });
            await delay(100);

            // Listen for user-left on client A
            const leftPromise = waitForEvent<{ userId: string }>(
                clientA,
                "user-left",
            );

            // Client B disconnects
            clientB.disconnect();

            const leftPayload = await leftPromise;
            expect(leftPayload.userId).toBe(userB.id);
        });

        it("should not broadcast user-joined to the joining client itself", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const board = await createBoard(userA.id);

            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");

            let selfJoined = false;
            clientA.on("user-joined", () => {
                selfJoined = true;
            });

            clientA.emit("join-room", { boardId: board.id });
            await delay(300);

            expect(selfJoined).toBe(false);
        });
    });

    // =========================================================================
    // 3. Cursor Sync
    // =========================================================================

    describe("Cursor Sync", () => {
        it("should broadcast cursor-moved to other clients in the same room", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const board = await createBoard(userA.id);

            // Both join the same room
            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: board.id });
            await delay(100);

            // Listen on client B for cursor-moved
            const cursorPromise = waitForEvent<{
                userId: string;
                userName: string;
                x: number;
                y: number;
            }>(clientB, "cursor-moved");

            // Client A sends cursor-move
            clientA.emit("cursor-move", { x: 100, y: 200 });

            const cursorPayload = await cursorPromise;
            expect(cursorPayload.userId).toBe(userA.id);
            expect(cursorPayload.userName).toBe("User A");
            expect(cursorPayload.x).toBe(100);
            expect(cursorPayload.y).toBe(200);
        });

        it("should not echo cursor-moved back to the sender", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const board = await createBoard(userA.id);

            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            let selfReceived = false;
            clientA.on("cursor-moved", () => {
                selfReceived = true;
            });

            clientA.emit("cursor-move", { x: 50, y: 75 });
            await delay(300);

            expect(selfReceived).toBe(false);
        });

        it("should not broadcast cursor-moved to clients in different rooms", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const boardA = await createBoard(userA.id, "Board A");
            const boardB = await createBoard(userA.id, "Board B");

            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: boardA.id });
            await delay(100);

            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: boardB.id });
            await delay(100);

            let crossRoomReceived = false;
            clientB.on("cursor-moved", () => {
                crossRoomReceived = true;
            });

            clientA.emit("cursor-move", { x: 10, y: 20 });
            await delay(300);

            expect(crossRoomReceived).toBe(false);
        });
    });

    // =========================================================================
    // 4. Canvas Element Sync
    // =========================================================================

    describe("Canvas Element Sync", () => {
        const sampleElement = {
            id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
            type: "rectangle" as const,
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            rotation: 0,
            zIndex: 1,
            isLocked: false,
            appearance: { fillColor: "#ff0000" },
            createdBy: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        it("should relay element-created to other clients", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const board = await createBoard(userA.id);

            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: board.id });
            await delay(100);

            const createdPromise = waitForEvent<{
                element: typeof sampleElement;
            }>(clientB, "element-created");

            clientA.emit("element-create", { element: sampleElement });

            const createdPayload = await createdPromise;
            expect(createdPayload.element).toBeDefined();
            expect(createdPayload.element.id).toBe(sampleElement.id);
            expect(createdPayload.element.type).toBe("rectangle");
        });

        it("should relay element-updated to other clients", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const board = await createBoard(userA.id);

            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: board.id });
            await delay(100);

            const updatedPromise = waitForEvent<{
                id: string;
                changes: Record<string, unknown>;
            }>(clientB, "element-updated");

            clientA.emit("element-update", {
                id: sampleElement.id,
                changes: { x: 200, y: 300 },
            });

            const updatedPayload = await updatedPromise;
            expect(updatedPayload.id).toBe(sampleElement.id);
            expect(updatedPayload.changes.x).toBe(200);
            expect(updatedPayload.changes.y).toBe(300);
        });

        it("should relay element-deleted to other clients", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const board = await createBoard(userA.id);

            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: board.id });
            await delay(100);

            const deletedPromise = waitForEvent<{ id: string }>(
                clientB,
                "element-deleted",
            );

            clientA.emit("element-delete", { id: sampleElement.id });

            const deletedPayload = await deletedPromise;
            expect(deletedPayload.id).toBe(sampleElement.id);
        });

        it("should not relay element events to the sender", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const board = await createBoard(userA.id);

            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            let selfCreated = false;
            let selfUpdated = false;
            let selfDeleted = false;

            clientA.on("element-created", () => {
                selfCreated = true;
            });
            clientA.on("element-updated", () => {
                selfUpdated = true;
            });
            clientA.on("element-deleted", () => {
                selfDeleted = true;
            });

            clientA.emit("element-create", { element: sampleElement });
            clientA.emit("element-update", {
                id: sampleElement.id,
                changes: { x: 1 },
            });
            clientA.emit("element-delete", { id: sampleElement.id });

            await delay(300);

            expect(selfCreated).toBe(false);
            expect(selfUpdated).toBe(false);
            expect(selfDeleted).toBe(false);
        });
    });

    // =========================================================================
    // 5. Notification Push
    // =========================================================================

    describe("Notification Push", () => {
        it("should deliver notification event to the target user's personal room", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { user: userB, accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const board = await createBoard(userA.id);

            // Client B connects (the notification recipient)
            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            await delay(100);

            // Listen for notification on client B
            const notifPromise = waitForEvent<{
                id: string;
                type: string;
                message: string;
            }>(clientB, "notification");

            // Create an invite for user B via the collaboration API
            // which triggers a notification to be sent via WebSocket
            // First we need to add user B as a collaborator via invite
            const { accessToken: tokenAFresh } =
                await createAuthenticatedUser({
                    email: "userA-fresh@test.com",
                    fullName: "User A Fresh",
                });

            // Alternative: directly use the notification utility
            const { sendNotificationToUser } = await import(
                "../sockets/workspace.js"
            );
            sendNotificationToUser(userB.id, {
                id: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f",
                type: "invite",
                message: "You were invited to Board",
                boardId: board.id,
                isRead: false,
                createdAt: new Date().toISOString(),
            });

            const notifPayload = await notifPromise;
            expect(notifPayload.type).toBe("invite");
            expect(notifPayload.message).toContain("invited");
        });

        it("should not deliver notification to other users", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { user: userB, accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });

            // Only client A is connected
            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            await delay(100);

            let wrongRecipient = false;
            clientA.on("notification", () => {
                wrongRecipient = true;
            });

            // Send notification to user B
            const { sendNotificationToUser } = await import(
                "../sockets/workspace.js"
            );
            sendNotificationToUser(userB.id, {
                id: "d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f7a",
                type: "comment",
                message: "New comment",
                boardId: null,
                isRead: false,
                createdAt: new Date().toISOString(),
            });

            await delay(300);
            expect(wrongRecipient).toBe(false);
        });
    });

    // =========================================================================
    // 6. Payload Validation
    // =========================================================================

    describe("Payload Validation", () => {
        it("should ignore join-room with missing boardId", async () => {
            const { accessToken } = await createAuthenticatedUser();

            clientA = connectClient(accessToken);
            clientA.connect();
            await waitForEvent(clientA, "connect");

            // Emit an invalid payload
            clientA.emit("join-room", {});
            await delay(200);

            // Client should still be connected (server gracefully ignores)
            expect(clientA.connected).toBe(true);
        });

        it("should ignore cursor-move without being in a room", async () => {
            const { accessToken } = await createAuthenticatedUser();

            clientA = connectClient(accessToken);
            clientA.connect();
            await waitForEvent(clientA, "connect");

            // Emit cursor-move without joining a room first
            clientA.emit("cursor-move", { x: 10, y: 20 });
            await delay(200);

            // Should remain connected
            expect(clientA.connected).toBe(true);
        });

        it("should ignore element-create without being in a room", async () => {
            const { accessToken } = await createAuthenticatedUser();

            clientA = connectClient(accessToken);
            clientA.connect();
            await waitForEvent(clientA, "connect");

            clientA.emit("element-create", { element: {} });
            await delay(200);

            expect(clientA.connected).toBe(true);
        });
    });

    // =========================================================================
    // 7. Multiple Rooms Isolation
    // =========================================================================

    describe("Room Isolation", () => {
        it("should not leak element events between different board rooms", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const boardA = await createBoard(userA.id, "Board A");
            const boardB = await createBoard(userA.id, "Board B");

            // Client A in Board A
            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: boardA.id });
            await delay(100);

            // Client B in Board B
            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: boardB.id });
            await delay(100);

            let crossLeakDetected = false;
            clientB.on("element-created", () => {
                crossLeakDetected = true;
            });

            clientA.emit("element-create", {
                element: {
                    id: "e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b",
                    type: "rectangle",
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 10,
                    rotation: 0,
                    zIndex: 0,
                    isLocked: false,
                    appearance: {},
                    createdBy: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            });

            await delay(300);
            expect(crossLeakDetected).toBe(false);
        });
    });

    // =========================================================================
    // 8. Disconnect Cleanup
    // =========================================================================

    describe("Disconnect Cleanup", () => {
        it("should clean up internal maps when a client disconnects", async () => {
            const { user: userA, accessToken: tokenA } =
                await createAuthenticatedUser({
                    email: "userA@test.com",
                    fullName: "User A",
                });
            const { user: userB, accessToken: tokenB } =
                await createAuthenticatedUser({
                    email: "userB@test.com",
                    fullName: "User B",
                });
            const board = await createBoard(userA.id);

            clientA = connectClient(tokenA);
            clientA.connect();
            await waitForEvent(clientA, "connect");
            clientA.emit("join-room", { boardId: board.id });
            await delay(100);

            clientB = connectClient(tokenB);
            clientB.connect();
            await waitForEvent(clientB, "connect");
            clientB.emit("join-room", { boardId: board.id });
            await delay(100);

            // After B disconnects, A should receive user-left
            const leftPromise = waitForEvent<{ userId: string }>(
                clientA,
                "user-left",
            );

            clientB.disconnect();

            const leftPayload = await leftPromise;
            expect(leftPayload.userId).toBe(userB.id);

            // Also ensure no crash when A continues sending events
            clientA.emit("cursor-move", { x: 0, y: 0 });
            await delay(100);
            expect(clientA.connected).toBe(true);
        });
    });
});
