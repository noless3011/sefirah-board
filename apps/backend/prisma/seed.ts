import prisma from "../src/utils/db.js";
import bcrypt from "bcryptjs";

async function main() {
    console.log("🌱 Starting database seeding...");

    // 1. Clean existing data
    await prisma.notification.deleteMany();
    await prisma.threadReply.deleteMany();
    await prisma.thread.deleteMany();
    await prisma.boardRevision.deleteMany();
    await prisma.exportJob.deleteMany();
    await prisma.inviteLink.deleteMany();
    await prisma.collaborator.deleteMany();
    await prisma.element.deleteMany();
    await prisma.board.deleteMany();
    await prisma.template.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.oAuthAccount.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();

    console.log("🧹 Cleaned existing data.");

    // 2. Create Users
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const klein = await prisma.user.create({
        data: {
            email: "klein@example.com",
            fullName: "Klein Sefirah",
            password: passwordHash,
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Klein",
        },
    });

    const sarah = await prisma.user.create({
        data: {
            email: "sarah@example.com",
            fullName: "Sarah Jenkins",
            password: passwordHash,
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        },
    });

    const alex = await prisma.user.create({
        data: {
            email: "alex@example.com",
            fullName: "Alex Rivera",
            password: passwordHash,
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        },
    });

    console.log("👤 Created users: Klein, Sarah, Alex.");

    // 3. Create Templates
    await prisma.template.create({
        data: {
            title: "Technical System Flow",
            description: "Map out complex architecture and user logic with precision-aligned service cards and database connectors.",
            category: "Flowcharts",
            thumbnailUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
            elements: [
                {
                    type: "text",
                    x: 100,
                    y: 40,
                    width: 600,
                    height: 50,
                    content: "Microservices Order Processing Workflow",
                    appearance: { fillColor: "#1e293b", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    id: "gateway",
                    type: "service_card",
                    x: 100,
                    y: 250,
                    width: 220,
                    height: 120,
                    title: "API Gateway",
                    description: "Entry point for client requests, handles SSL termination and routing.",
                    badge: "API",
                    appearance: { strokeColor: "#34a853", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "auth",
                    type: "service_card",
                    x: 420,
                    y: 120,
                    width: 220,
                    height: 120,
                    title: "Auth Service",
                    description: "Validates JWT tokens, manages user sessions & permissions.",
                    badge: "SERVICE",
                    appearance: { strokeColor: "#4285f4", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "order",
                    type: "service_card",
                    x: 420,
                    y: 280,
                    width: 220,
                    height: 120,
                    title: "Order Processing Service",
                    description: "Processes new orders, coordinates inventory check and payment.",
                    badge: "SERVICE",
                    appearance: { strokeColor: "#4285f4", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "payment",
                    type: "service_card",
                    x: 420,
                    y: 440,
                    width: 220,
                    height: 120,
                    title: "Payment Service",
                    description: "Integrates with Stripe to authorize and capture credit card payments.",
                    badge: "SERVICE",
                    appearance: { strokeColor: "#4285f4", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "order_db",
                    type: "database_card",
                    x: 740,
                    y: 280,
                    width: 220,
                    height: 120,
                    title: "Orders Database",
                    description: "Relational store for orders, items, and billing details.",
                    badge: "DATABASE",
                    appearance: { strokeColor: "#8B6914", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "notif_queue",
                    type: "service_card",
                    x: 740,
                    y: 120,
                    width: 220,
                    height: 120,
                    title: "Notification Broker",
                    description: "Publishes email and push notification tasks to workers.",
                    badge: "QUEUE",
                    appearance: { strokeColor: "#9b59b6", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    type: "arrow",
                    startElementId: "gateway",
                    endElementId: "auth",
                    points: [{ x: 100, y: 250 }, { x: 420, y: 120 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "gateway",
                    endElementId: "order",
                    points: [{ x: 100, y: 250 }, { x: 420, y: 280 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "gateway",
                    endElementId: "payment",
                    points: [{ x: 100, y: 250 }, { x: 420, y: 440 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "order",
                    endElementId: "order_db",
                    points: [{ x: 420, y: 280 }, { x: 740, y: 280 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "order",
                    endElementId: "notif_queue",
                    points: [{ x: 420, y: 280 }, { x: 740, y: 120 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                }
            ]
        }
    });

    await prisma.template.create({
        data: {
            title: "Rapid Ideation Canvas",
            description: "A structured brainstorming canvas with custom header categories, instructions, and voting cards.",
            category: "Brainstorming",
            thumbnailUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80",
            elements: [
                {
                    type: "text",
                    x: 50,
                    y: 40,
                    width: 600,
                    height: 50,
                    content: "Feature Ideation Board",
                    appearance: { fillColor: "#0f172a", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 50,
                    y: 120,
                    width: 250,
                    height: 40,
                    content: "🚨 USER PAIN POINTS",
                    appearance: { fillColor: "#ef4444", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 350,
                    y: 120,
                    width: 250,
                    height: 40,
                    content: "💡 SOLUTION IDEAS",
                    appearance: { fillColor: "#3b82f6", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 650,
                    y: 120,
                    width: 250,
                    height: 40,
                    content: "🚀 MOONSHOTS",
                    appearance: { fillColor: "#8b5cf6", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 950,
                    y: 120,
                    width: 250,
                    height: 40,
                    content: "📦 PRODUCT FEATURES",
                    appearance: { fillColor: "#10b981", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    id: "pain_1",
                    type: "sticky_note",
                    x: 50,
                    y: 180,
                    width: 200,
                    height: 150,
                    content: "Users struggle to locate the export button on mobile viewports.",
                    appearance: { fillColor: "#fecaca", strokeColor: "#f87171", strokeWidth: 1 }
                },
                {
                    id: "pain_2",
                    type: "sticky_note",
                    x: 50,
                    y: 350,
                    width: 200,
                    height: 150,
                    content: "Collaboration delays are noticeable when multiple users edit concurrently.",
                    appearance: { fillColor: "#fecaca", strokeColor: "#f87171", strokeWidth: 1 }
                },
                {
                    id: "sol_1",
                    type: "sticky_note",
                    x: 350,
                    y: 180,
                    width: 200,
                    height: 150,
                    content: "Move the export button to the top primary navigation bar.",
                    appearance: { fillColor: "#dbeafe", strokeColor: "#60a5fa", strokeWidth: 1 }
                },
                {
                    id: "sol_2",
                    type: "sticky_note",
                    x: 350,
                    y: 350,
                    width: 200,
                    height: 150,
                    content: "Optimize websocket messages by batching position updates.",
                    appearance: { fillColor: "#dbeafe", strokeColor: "#60a5fa", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 650,
                    y: 180,
                    width: 200,
                    height: 150,
                    content: "AI-powered layout auto-organizer to sort cards instantly.",
                    appearance: { fillColor: "#f3e8ff", strokeColor: "#c084fc", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 650,
                    y: 350,
                    width: 200,
                    height: 150,
                    content: "Fully immersive VR board editing modes.",
                    appearance: { fillColor: "#f3e8ff", strokeColor: "#c084fc", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 950,
                    y: 180,
                    width: 200,
                    height: 150,
                    content: "Responsive TopToolbar with visible navigation shortcuts.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 950,
                    y: 350,
                    width: 200,
                    height: 150,
                    content: "Refactored collaborative state manager.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                },
                {
                    type: "arrow",
                    startElementId: "pain_1",
                    endElementId: "sol_1",
                    points: [{ x: 250, y: 255 }, { x: 350, y: 255 }],
                    appearance: { strokeColor: "#94a3b8", strokeWidth: 2 },
                    strokeDash: true
                },
                {
                    type: "arrow",
                    startElementId: "pain_2",
                    endElementId: "sol_2",
                    points: [{ x: 250, y: 425 }, { x: 350, y: 425 }],
                    appearance: { strokeColor: "#94a3b8", strokeWidth: 2 },
                    strokeDash: true
                }
            ]
        }
    });

    await prisma.template.create({
        data: {
            title: "Atomic Components",
            description: "AWS Cloud Infrastructure architecture containing load balancing, caching tiers, queues, and databases.",
            category: "Design_Systems",
            thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
            elements: [
                {
                    type: "text",
                    x: 100,
                    y: 40,
                    width: 600,
                    height: 50,
                    content: "AWS Cloud Architecture - Production V1",
                    appearance: { fillColor: "#0f172a", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    id: "alb",
                    type: "service_card",
                    x: 100,
                    y: 250,
                    width: 220,
                    height: 120,
                    title: "Application Load Balancer",
                    description: "Directs incoming client traffic across multiple ECS instances.",
                    badge: "API",
                    appearance: { strokeColor: "#ff9900", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "web_ecs",
                    type: "service_card",
                    x: 400,
                    y: 150,
                    width: 220,
                    height: 120,
                    title: "Web App ECS Cluster",
                    description: "Containers running frontend server and client routing API endpoints.",
                    badge: "SERVICE",
                    appearance: { strokeColor: "#4285f4", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "redis",
                    type: "service_card",
                    x: 700,
                    y: 150,
                    width: 220,
                    height: 120,
                    title: "ElastiCache Redis",
                    description: "In-memory caching for session states and rapid page views.",
                    badge: "CACHE",
                    appearance: { strokeColor: "#ea4335", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "sqs",
                    type: "service_card",
                    x: 400,
                    y: 350,
                    width: 220,
                    height: 120,
                    title: "SQS Job Queue",
                    description: "Stores background jobs to be consumed asynchronously by workers.",
                    badge: "QUEUE",
                    appearance: { strokeColor: "#9b59b6", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "worker_ecs",
                    type: "service_card",
                    x: 700,
                    y: 350,
                    width: 220,
                    height: 120,
                    title: "Worker ECS Cluster",
                    description: "Pulls notification and export events from SQS and processes them.",
                    badge: "SERVICE",
                    appearance: { strokeColor: "#4285f4", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "rds",
                    type: "database_card",
                    x: 1000,
                    y: 250,
                    width: 220,
                    height: 120,
                    title: "Aurora PostgreSQL",
                    description: "Multi-AZ replicated relational database storing client details.",
                    badge: "DATABASE",
                    appearance: { strokeColor: "#8B6914", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    type: "arrow",
                    startElementId: "alb",
                    endElementId: "web_ecs",
                    points: [{ x: 100, y: 250 }, { x: 400, y: 150 }],
                    appearance: { strokeColor: "#ff9900", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "web_ecs",
                    endElementId: "redis",
                    points: [{ x: 400, y: 150 }, { x: 700, y: 150 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "web_ecs",
                    endElementId: "sqs",
                    points: [{ x: 400, y: 150 }, { x: 400, y: 350 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "sqs",
                    endElementId: "worker_ecs",
                    points: [{ x: 400, y: 350 }, { x: 700, y: 350 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "web_ecs",
                    endElementId: "rds",
                    points: [{ x: 400, y: 150 }, { x: 1000, y: 250 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "worker_ecs",
                    endElementId: "rds",
                    points: [{ x: 700, y: 350 }, { x: 1000, y: 250 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                }
            ]
        }
    });

    await prisma.template.create({
        data: {
            title: "Product Roadmap Sync",
            description: "Align stakeholders with a high-level timeline, active epic items, and task priorities.",
            category: "Project_Management",
            thumbnailUrl: "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=600&q=80",
            elements: [
                {
                    type: "text",
                    x: 50,
                    y: 40,
                    width: 600,
                    height: 50,
                    content: "Product Development Roadmap - H2 2026",
                    appearance: { fillColor: "#0f172a", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 50,
                    y: 150,
                    width: 200,
                    height: 40,
                    content: "🔐 SECURITY & AUTH",
                    appearance: { fillColor: "#1e293b", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 50,
                    y: 350,
                    width: 200,
                    height: 40,
                    content: "🎨 CANVAS ENGINE",
                    appearance: { fillColor: "#1e293b", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 50,
                    y: 550,
                    width: 200,
                    height: 40,
                    content: "🤝 INTEGRATIONS",
                    appearance: { fillColor: "#1e293b", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 300,
                    y: 100,
                    width: 200,
                    height: 30,
                    content: "Sprint 1 (Jul - Aug)",
                    appearance: { fillColor: "#475569", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 600,
                    y: 100,
                    width: 200,
                    height: 30,
                    content: "Sprint 2 (Sept - Oct)",
                    appearance: { fillColor: "#475569", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 900,
                    y: 100,
                    width: 200,
                    height: 30,
                    content: "Sprint 3 (Nov - Dec)",
                    appearance: { fillColor: "#475569", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    id: "task_oauth",
                    type: "sticky_note",
                    x: 300,
                    y: 150,
                    width: 220,
                    height: 120,
                    content: "Integrate Google/GitHub OAuth logins for easy team registration.",
                    appearance: { fillColor: "#dbeafe", strokeColor: "#60a5fa", strokeWidth: 1 }
                },
                {
                    id: "task_export",
                    type: "sticky_note",
                    x: 300,
                    y: 350,
                    width: 220,
                    height: 120,
                    content: "Implement high-res client-side board export to PNG formats.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                },
                {
                    id: "task_slack",
                    type: "sticky_note",
                    x: 300,
                    y: 550,
                    width: 220,
                    height: 120,
                    content: "Build slack notification webhook for channel activity.",
                    appearance: { fillColor: "#fef3c7", strokeColor: "#f59e0b", strokeWidth: 1 }
                },
                {
                    id: "task_roles",
                    type: "sticky_note",
                    x: 600,
                    y: 150,
                    width: 220,
                    height: 120,
                    content: "Add granular workspace permissions (Viewer vs Editor roles).",
                    appearance: { fillColor: "#dbeafe", strokeColor: "#60a5fa", strokeWidth: 1 }
                },
                {
                    id: "task_zoom",
                    type: "sticky_note",
                    x: 600,
                    y: 350,
                    width: 220,
                    height: 120,
                    content: "Optimize scroll-to-zoom gestures and touch viewport rendering.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                },
                {
                    id: "task_ldap",
                    type: "sticky_note",
                    x: 900,
                    y: 150,
                    width: 220,
                    height: 120,
                    content: "Enterprise SSO integration using SAML/LDAP mappings.",
                    appearance: { fillColor: "#dbeafe", strokeColor: "#60a5fa", strokeWidth: 1 }
                },
                {
                    id: "task_undo",
                    type: "sticky_note",
                    x: 900,
                    y: 350,
                    width: 220,
                    height: 120,
                    content: "Create history logger supporting undo/redo canvas operations.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                },
                {
                    type: "arrow",
                    startElementId: "task_oauth",
                    endElementId: "task_roles",
                    points: [{ x: 300, y: 150 }, { x: 600, y: 150 }],
                    appearance: { strokeColor: "#94a3b8", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "task_roles",
                    endElementId: "task_ldap",
                    points: [{ x: 600, y: 150 }, { x: 900, y: 150 }],
                    appearance: { strokeColor: "#94a3b8", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "task_export",
                    endElementId: "task_zoom",
                    points: [{ x: 300, y: 350 }, { x: 600, y: 350 }],
                    appearance: { strokeColor: "#94a3b8", strokeWidth: 2 }
                }
            ]
        }
    });

    await prisma.template.create({
        data: {
            title: "Customer Journey Map",
            description: "Visualize the user experience through every touchpoint to identify pain points and delight milestones.",
            category: "Agile_Frameworks",
            thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
            elements: [
                {
                    type: "text",
                    x: 50,
                    y: 40,
                    width: 600,
                    height: 50,
                    content: "Customer Journey Map - Enterprise Collaboration SaaS",
                    appearance: { fillColor: "#0f172a", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 250,
                    y: 100,
                    width: 200,
                    height: 30,
                    content: "1. Awareness",
                    appearance: { fillColor: "#0284c7", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 500,
                    y: 100,
                    width: 200,
                    height: 30,
                    content: "2. Consideration",
                    appearance: { fillColor: "#f97316", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 750,
                    y: 100,
                    width: 200,
                    height: 30,
                    content: "3. Onboarding",
                    appearance: { fillColor: "#8b5cf6", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 1000,
                    y: 100,
                    width: 200,
                    height: 30,
                    content: "4. Retention",
                    appearance: { fillColor: "#10b981", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 50,
                    y: 160,
                    width: 150,
                    height: 30,
                    content: "Activities",
                    appearance: { fillColor: "#475569", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 50,
                    y: 330,
                    width: 150,
                    height: 30,
                    content: "Pain Points",
                    appearance: { fillColor: "#475569", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "text",
                    x: 50,
                    y: 500,
                    width: 150,
                    height: 30,
                    content: "Delight Goals",
                    appearance: { fillColor: "#475569", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    type: "sticky_note",
                    x: 250,
                    y: 160,
                    width: 200,
                    height: 140,
                    content: "User reads a tech blog post about real-time diagramming tools.",
                    appearance: { fillColor: "#fef08a", strokeColor: "#eab308", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 500,
                    y: 160,
                    width: 200,
                    height: 140,
                    content: "Creates a free workspace and test-draws complex flowchart paths.",
                    appearance: { fillColor: "#fef08a", strokeColor: "#eab308", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 750,
                    y: 160,
                    width: 200,
                    height: 140,
                    content: "Invites 3 team members to verify live live multi-cursor speeds.",
                    appearance: { fillColor: "#fef08a", strokeColor: "#eab308", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 1000,
                    y: 160,
                    width: 200,
                    height: 140,
                    content: "Integrates exports and builds diagrams for internal sprint specs.",
                    appearance: { fillColor: "#fef08a", strokeColor: "#eab308", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 250,
                    y: 330,
                    width: 200,
                    height: 140,
                    content: "Hard to quickly estimate enterprise costs and billing.",
                    appearance: { fillColor: "#fecaca", strokeColor: "#f87171", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 500,
                    y: 330,
                    width: 200,
                    height: 140,
                    content: "UI controls feel slightly confusing without an onboarding helper.",
                    appearance: { fillColor: "#fecaca", strokeColor: "#f87171", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 750,
                    y: 330,
                    width: 200,
                    height: 140,
                    content: "Team member invitation links sometimes get marked as spam.",
                    appearance: { fillColor: "#fecaca", strokeColor: "#f87171", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 1000,
                    y: 330,
                    width: 200,
                    height: 140,
                    content: "Requires continuous high resolution PNG exports.",
                    appearance: { fillColor: "#fecaca", strokeColor: "#f87171", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 250,
                    y: 500,
                    width: 200,
                    height: 140,
                    content: "Include pricing slider and direct calendar call scheduler.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 500,
                    y: 500,
                    width: 200,
                    height: 140,
                    content: "Provide a quick hands-on tutorial with guided paths.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 750,
                    y: 500,
                    width: 200,
                    height: 140,
                    content: "Enable invite link generation direct to clipboard.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 1000,
                    y: 500,
                    width: 200,
                    height: 140,
                    content: "Support instant high-fidelity local image downloads.",
                    appearance: { fillColor: "#d1fae5", strokeColor: "#34d399", strokeWidth: 1 }
                }
            ]
        }
    });

    await prisma.template.create({
        data: {
            title: "Omni-Channel Strategy",
            description: "Plan global campaigns across social, email, and web with integrated asset management and KPI trackers.",
            category: "Agile_Frameworks",
            thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
            elements: [
                {
                    type: "text",
                    x: 100,
                    y: 40,
                    width: 600,
                    height: 50,
                    content: "Omni-Channel Launch Marketing Plan",
                    appearance: { fillColor: "#0f172a", strokeColor: "none", strokeWidth: 0 }
                },
                {
                    id: "mkt_social",
                    type: "service_card",
                    x: 100,
                    y: 180,
                    width: 220,
                    height: 120,
                    title: "Social Media Campaigns",
                    description: "Promote launches on Twitter, LinkedIn, and YouTube.",
                    badge: "SERVICE",
                    appearance: { strokeColor: "#4285f4", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "mkt_landing",
                    type: "service_card",
                    x: 400,
                    y: 300,
                    width: 220,
                    height: 120,
                    title: "Website Landing Page",
                    description: "Primary sign-up page featuring demo videos and CTA.",
                    badge: "API",
                    appearance: { strokeColor: "#34a853", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "mkt_email",
                    type: "service_card",
                    x: 100,
                    y: 420,
                    width: 220,
                    height: 120,
                    title: "Email Newsletter Series",
                    description: "Send launch newsletter and onboarding drips.",
                    badge: "SERVICE",
                    appearance: { strokeColor: "#4285f4", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    id: "mkt_db",
                    type: "database_card",
                    x: 700,
                    y: 300,
                    width: 220,
                    height: 120,
                    title: "Marketing Leads Database",
                    description: "SQL Server holding trial registrations and lead scores.",
                    badge: "DATABASE",
                    appearance: { strokeColor: "#8B6914", fillColor: "#ffffff", strokeWidth: 4 }
                },
                {
                    type: "sticky_note",
                    x: 100,
                    y: 30,
                    width: 180,
                    height: 120,
                    content: "Weekly posts scheduled starting next Monday.",
                    appearance: { fillColor: "#fef3c7", strokeColor: "#f59e0b", strokeWidth: 1 }
                },
                {
                    type: "sticky_note",
                    x: 100,
                    y: 570,
                    width: 180,
                    height: 120,
                    content: "Draft email templates in Mailchimp by Friday.",
                    appearance: { fillColor: "#fef3c7", strokeColor: "#f59e0b", strokeWidth: 1 }
                },
                {
                    type: "arrow",
                    startElementId: "mkt_social",
                    endElementId: "mkt_landing",
                    points: [{ x: 100, y: 180 }, { x: 400, y: 300 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "mkt_email",
                    endElementId: "mkt_landing",
                    points: [{ x: 100, y: 420 }, { x: 400, y: 300 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                },
                {
                    type: "arrow",
                    startElementId: "mkt_landing",
                    endElementId: "mkt_db",
                    points: [{ x: 400, y: 300 }, { x: 700, y: 300 }],
                    appearance: { strokeColor: "#64748b", strokeWidth: 2 }
                }
            ]
        }
    });

    console.log("📄 Created templates with elements.");

    // 4. Create Boards for Klein
    const board1 = await prisma.board.create({
        data: {
            title: "YOLO/VAE Architecture",
            ownerId: klein.id,
            type: "personal",
            badge: "active_project",
            visibilityIcon: "private",
            thumbnailUrl: "https://placehold.co/600x400?text=YOLO+Architecture",
            elements: {
                create: [
                    {
                        type: "rectangle",
                        x: 200,
                        y: 150,
                        width: 200,
                        height: 100,
                        appearance: {
                            fill: "#e3f2fd",
                            stroke: "#2196f3",
                            strokeWidth: 2,
                        },
                        content: "Input Image",
                        createdBy: klein.id,
                    },
                    {
                        type: "arrow",
                        x: 400,
                        y: 200,
                        width: 100,
                        height: 2,
                        points: [{ x: 400, y: 200 }, { x: 500, y: 200 }],
                        appearance: { stroke: "#2196f3", strokeWidth: 2 },
                        createdBy: klein.id,
                    },
                    {
                        type: "rectangle",
                        x: 500,
                        y: 150,
                        width: 200,
                        height: 100,
                        appearance: {
                            fill: "#f3e5f5",
                            stroke: "#9c27b0",
                            strokeWidth: 2,
                        },
                        content: "Feature Extractor",
                        createdBy: klein.id,
                    },
                ],
            },
        },
    });

    await prisma.board.create({
        data: {
            title: "Legacy Project Snapshot",
            ownerId: klein.id,
            type: "personal",
            status: "archived",
            badge: "archived",
            visibilityIcon: "private",
            elements: {
                create: [
                    {
                        type: "text",
                        x: 100,
                        y: 100,
                        width: 300,
                        height: 50,
                        appearance: { fill: "transparent", stroke: "none" },
                        content: "Old System Design",
                        createdBy: klein.id,
                    },
                ],
            },
        },
    });

    // 5. Create a Shared Board (Shared by Sarah with Klein)
    const sharedBoard = await prisma.board.create({
        data: {
            title: "Marketing Strategy 2026",
            ownerId: sarah.id,
            sharedById: sarah.id,
            type: "shared",
            badge: "review_required",
            visibilityIcon: "shared",
            collaborators: {
                create: [
                    { userId: klein.id, role: "editor" },
                    { userId: alex.id, role: "viewer" },
                ],
            },
            elements: {
                create: [
                    {
                        type: "sticky_note",
                        x: 100,
                        y: 100,
                        width: 150,
                        height: 150,
                        appearance: { fill: "#ffe0b2", stroke: "#f57c00" },
                        content: "Q1 Goals: 20% Growth",
                        createdBy: sarah.id,
                    },
                    {
                        type: "sticky_note",
                        x: 270,
                        y: 100,
                        width: 150,
                        height: 150,
                        appearance: { fill: "#c8e6c9", stroke: "#388e3c" },
                        content: "Social Media Campaign",
                        createdBy: sarah.id,
                    },
                ],
            },
        },
    });

    console.log("🗂️ Created boards and collaborations with elements.");

    // 6. Create some initial comments/threads
    await prisma.thread.create({
        data: {
            boardId: sharedBoard.id,
            authorId: sarah.id,
            authorName: sarah.fullName,
            authorAvatarUrl: sarah.avatarUrl,
            message: "Can we update the budget section?",
            status: "open",
            replies: {
                create: [
                    {
                        authorId: klein.id,
                        authorName: klein.fullName,
                        authorAvatarUrl: klein.avatarUrl,
                        message: "On it! I will add the latest figures.",
                    },
                ],
            },
        },
    });

    // 7. Create a notification for Klein
    await prisma.notification.create({
        data: {
            userId: klein.id,
            type: "invite",
            message:
                'Sarah Jenkins invited you to collaborate on "Marketing Strategy 2026".',
            boardId: sharedBoard.id,
        },
    });

    // 8. Create a Board Revision
    await prisma.boardRevision.create({
        data: {
            boardId: board1.id,
            authorId: klein.id,
            authorName: klein.fullName,
            description: "Initial architectural draft",
            elementCount: 3,
            elements: [
                {
                    type: "rectangle",
                    x: 200,
                    y: 150,
                    width: 200,
                    height: 100,
                    appearance: {
                        fill: "#e3f2fd",
                        stroke: "#2196f3",
                        strokeWidth: 2,
                    },
                    content: "Input Image",
                },
                {
                    type: "arrow",
                    points: [{ x: 400, y: 200 }, { x: 500, y: 200 }],
                    appearance: { stroke: "#2196f3", strokeWidth: 2 },
                },
                {
                    type: "rectangle",
                    x: 500,
                    y: 150,
                    width: 200,
                    height: 100,
                    appearance: {
                        fill: "#f3e5f5",
                        stroke: "#9c27b0",
                        strokeWidth: 2,
                    },
                    content: "Feature Extractor",
                },
            ],
        },
    });

    console.log("💬 Created threads, notifications, and revisions.");
    console.log("✅ Seeding completed successfully.");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
