import request from "supertest";
import { app } from "../index.js";
import { clearDatabase } from "./setup.js";
import db from "../utils/db.js";

async function getAuthToken(email: string = "user@example.com", fullName: string = "Auth User") {
    await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        fullName,
    });

    const response = await request(app).post("/api/v1/auth/login").send({
        email,
        password: "Password123!",
    });

    return response.body.accessToken;
}

describe("Notifications Domain", () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    describe("GET /api/v1/notifications", () => {
        it("should list notifications for the current user, newest first", async () => {
            const token = await getAuthToken("user1@example.com");
            const user = await db.user.findUnique({ where: { email: "user1@example.com" } });
            
            // Create some notifications manually in the DB
            const notif1 = await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "invite",
                    message: "Invite notification",
                    isRead: false,
                    createdAt: new Date(Date.now() - 10000), // older
                }
            });

            const notif2 = await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "comment",
                    message: "Comment notification",
                    isRead: true,
                    createdAt: new Date(), // newer
                }
            });

            // Call GET endpoint
            const response = await request(app)
                .get("/api/v1/notifications")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(2);
            // Verify newer is first
            expect(response.body.data[0].id).toBe(notif2.id);
            expect(response.body.data[1].id).toBe(notif1.id);
            expect(response.body.meta).toBeDefined();
            expect(response.body.meta.total).toBe(2);
        });

        it("should filter notifications by isRead", async () => {
            const token = await getAuthToken("user1@example.com");
            const user = await db.user.findUnique({ where: { email: "user1@example.com" } });

            await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "invite",
                    message: "Invite notification",
                    isRead: false,
                }
            });

            await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "comment",
                    message: "Comment notification",
                    isRead: true,
                }
            });

            // Filter isRead=false
            const responseFalse = await request(app)
                .get("/api/v1/notifications?isRead=false")
                .set("Authorization", `Bearer ${token}`);

            expect(responseFalse.status).toBe(200);
            expect(responseFalse.body.data.length).toBe(1);
            expect(responseFalse.body.data[0].isRead).toBe(false);

            // Filter isRead=true
            const responseTrue = await request(app)
                .get("/api/v1/notifications?isRead=true")
                .set("Authorization", `Bearer ${token}`);

            expect(responseTrue.status).toBe(200);
            expect(responseTrue.body.data.length).toBe(1);
            expect(responseTrue.body.data[0].isRead).toBe(true);
        });

        it("should support pagination", async () => {
            const token = await getAuthToken("user1@example.com");
            const user = await db.user.findUnique({ where: { email: "user1@example.com" } });

            for (let i = 0; i < 5; i++) {
                await db.notification.create({
                    data: {
                        userId: user!.id,
                        type: "mention",
                        message: `Mention ${i}`,
                    }
                });
            }

            const response = await request(app)
                .get("/api/v1/notifications?page=1&limit=3")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(3);
            expect(response.body.meta.total).toBe(5);
            expect(response.body.meta.page).toBe(1);
            expect(response.body.meta.limit).toBe(3);
            expect(response.body.meta.totalPages).toBe(2);
        });

        it("should fail without authorization token", async () => {
            const response = await request(app).get("/api/v1/notifications");
            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/v1/notifications/unread-count", () => {
        it("should return the correct count of unread notifications", async () => {
            const token = await getAuthToken("user1@example.com");
            const user = await db.user.findUnique({ where: { email: "user1@example.com" } });

            await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "invite",
                    message: "Unread 1",
                    isRead: false,
                }
            });

            await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "comment",
                    message: "Read 1",
                    isRead: true,
                }
            });

            await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "mention",
                    message: "Unread 2",
                    isRead: false,
                }
            });

            const response = await request(app)
                .get("/api/v1/notifications/unread-count")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.unreadCount).toBe(2);
        });
    });

    describe("PATCH /api/v1/notifications/:notificationId", () => {
        it("should update a notification's isRead status and return the updated object", async () => {
            const token = await getAuthToken("user1@example.com");
            const user = await db.user.findUnique({ where: { email: "user1@example.com" } });

            const notif = await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "invite",
                    message: "Test notif",
                    isRead: false,
                }
            });

            const response = await request(app)
                .patch(`/api/v1/notifications/${notif.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ isRead: true });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(notif.id);
            expect(response.body.isRead).toBe(true);

            // Double check in DB
            const updatedNotif = await db.notification.findUnique({ where: { id: notif.id } });
            expect(updatedNotif!.isRead).toBe(true);
        });

        it("should return 404 if notification does not exist or not owned by user", async () => {
            const token = await getAuthToken("user1@example.com");
            const otherToken = await getAuthToken("user2@example.com");
            const user2 = await db.user.findUnique({ where: { email: "user2@example.com" } });

            const notif = await db.notification.create({
                data: {
                    userId: user2!.id,
                    type: "invite",
                    message: "User 2's notif",
                    isRead: false,
                }
            });

            // Trying to edit user2's notification with user1's token
            const response = await request(app)
                .patch(`/api/v1/notifications/${notif.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ isRead: true });

            expect(response.status).toBe(404);
        });
    });

    describe("POST /api/v1/notifications/mark-all-read", () => {
        it("should mark all unread notifications of the user as read", async () => {
            const token = await getAuthToken("user1@example.com");
            const user = await db.user.findUnique({ where: { email: "user1@example.com" } });

            await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "invite",
                    message: "Unread 1",
                    isRead: false,
                }
            });

            await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "comment",
                    message: "Unread 2",
                    isRead: false,
                }
            });

            await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "mention",
                    message: "Read 1",
                    isRead: true,
                }
            });

            const response = await request(app)
                .post("/api/v1/notifications/mark-all-read")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.updatedCount).toBe(2);

            // Verify they are now all read
            const unreadCount = await db.notification.count({
                where: { userId: user!.id, isRead: false }
            });
            expect(unreadCount).toBe(0);
        });
    });

    describe("DELETE /api/v1/notifications/:notificationId", () => {
        it("should delete a notification and return 204 No Content", async () => {
            const token = await getAuthToken("user1@example.com");
            const user = await db.user.findUnique({ where: { email: "user1@example.com" } });

            const notif = await db.notification.create({
                data: {
                    userId: user!.id,
                    type: "invite",
                    message: "Delete me",
                    isRead: false,
                }
            });

            const response = await request(app)
                .delete(`/api/v1/notifications/${notif.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(204);

            const deletedNotif = await db.notification.findUnique({ where: { id: notif.id } });
            expect(deletedNotif).toBeNull();
        });

        it("should return 404 if trying to delete another user's notification", async () => {
            const token = await getAuthToken("user1@example.com");
            const otherToken = await getAuthToken("user2@example.com");
            const user2 = await db.user.findUnique({ where: { email: "user2@example.com" } });

            const notif = await db.notification.create({
                data: {
                    userId: user2!.id,
                    type: "invite",
                    message: "User 2's notif",
                    isRead: false,
                }
            });

            const response = await request(app)
                .delete(`/api/v1/notifications/${notif.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });
});
