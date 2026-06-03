import request from "supertest";
import { app } from "../index.js";
import { clearDatabase } from "./setup.js";
import db from "../utils/db.js";

async function getAuthToken(email: string = "templateuser@example.com") {
    await request(app).post("/api/v1/auth/register").send({
        email,
        password: "Password123!",
        fullName: "Template User",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
        email,
        password: "Password123!",
    });

    return { token: response.body.accessToken, userId: response.body.user.id };
}

describe("Template Domain", () => {
    beforeEach(async () => {
        await clearDatabase();

        // Seed some templates
        await db.template.createMany({
            data: [
                {
                    id: "a0000000-0000-4000-8000-000000000001",
                    title: "Flowchart Template",
                    description: "A basic flowchart",
                    category: "Flowcharts",
                },
                {
                    id: "a0000000-0000-4000-8000-000000000002",
                    title: "Brainstorming Template",
                    description: "A basic brainstorming board",
                    category: "Brainstorming",
                },
            ],
        });
    });

    describe("GET /api/v1/templates", () => {
        it("should list all templates", async () => {
            const { token } = await getAuthToken();
            const response = await request(app)
                .get("/api/v1/templates")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(2);
            expect(response.body.meta).toBeDefined();
            expect(response.body.meta.total).toBe(2);
            expect(response.body.meta.page).toBe(1);
        });

        it("should filter templates by category", async () => {
            const { token } = await getAuthToken();
            const response = await request(app)
                .get("/api/v1/templates?category=Flowcharts")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].category).toBe("Flowcharts");
        });

        it("should return 401 without auth", async () => {
            const response = await request(app).get("/api/v1/templates");
            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/v1/templates/:templateId", () => {
        it("should fetch a single template", async () => {
            const { token } = await getAuthToken();
            const templateId = "a0000000-0000-4000-8000-000000000001";
            const response = await request(app)
                .get(`/api/v1/templates/${templateId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(templateId);
            expect(response.body.title).toBe("Flowchart Template");
            expect(response.body.description).toBe("A basic flowchart");
            expect(response.body.category).toBe("Flowcharts");
            expect(response.body.createdAt).toBeDefined();
        });

        it("should return 404 for non-existent template", async () => {
            const { token } = await getAuthToken();
            const response = await request(app)
                .get("/api/v1/templates/a0000000-0000-4000-8000-ffffffffffff")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });
});
