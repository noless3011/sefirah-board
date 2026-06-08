import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { templateApi } from "../../api/template.api";
import { boardApi, canvasApi } from "../../api/board.api";

// =============================================================================
// LOCAL TEMPLATES HIGH-FIDELITY DEF & MOCKS
// Matches the design layout perfectly
// =============================================================================
interface LocalTemplate {
    title: string;
    category: "Flowcharts" | "Brainstorming" | "Design Systems" | "Project Management" | "Agile Frameworks";
    description: string;
    thumbnailUrl: string;
    elements: any[];
}

const LOCAL_TEMPLATES: LocalTemplate[] = [
    {
        title: "Technical System Flow",
        category: "Flowcharts",
        description: "Map out complex architecture and user logic with precision-aligned service cards and database connectors.",
        thumbnailUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
        elements: [
            {
                type: "text",
                x: 100,
                y: 40,
                width: 600,
                height: 50,
                content: "Microservices Order Processing Workflow",
                appearance: { fill: "#1e293b", stroke: "none", strokeWidth: 0 }
            },
            {
                id: "gateway",
                type: "service-card",
                x: 100,
                y: 250,
                width: 220,
                height: 120,
                title: "API Gateway",
                description: "Entry point for client requests, handles SSL termination and routing.",
                badge: "API",
                appearance: { stroke: "#34a853", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "auth",
                type: "service-card",
                x: 420,
                y: 120,
                width: 220,
                height: 120,
                title: "Auth Service",
                description: "Validates JWT tokens, manages user sessions & permissions.",
                badge: "SERVICE",
                appearance: { stroke: "#4285f4", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "order",
                type: "service-card",
                x: 420,
                y: 280,
                width: 220,
                height: 120,
                title: "Order Processing Service",
                description: "Processes new orders, coordinates inventory check and payment.",
                badge: "SERVICE",
                appearance: { stroke: "#4285f4", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "payment",
                type: "service-card",
                x: 420,
                y: 440,
                width: 220,
                height: 120,
                title: "Payment Service",
                description: "Integrates with Stripe to authorize and capture credit card payments.",
                badge: "SERVICE",
                appearance: { stroke: "#4285f4", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "order_db",
                type: "database-card",
                x: 740,
                y: 280,
                width: 220,
                height: 120,
                title: "Orders Database",
                description: "Relational store for orders, items, and billing details.",
                badge: "DATABASE",
                appearance: { stroke: "#8B6914", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "notif_queue",
                type: "service-card",
                x: 740,
                y: 120,
                width: 220,
                height: 120,
                title: "Notification Broker",
                description: "Publishes email and push notification tasks to workers.",
                badge: "QUEUE",
                appearance: { stroke: "#9b59b6", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                type: "arrow",
                startElementId: "gateway",
                endElementId: "auth",
                points: [{ x: 100, y: 250 }, { x: 420, y: 120 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "gateway",
                endElementId: "order",
                points: [{ x: 100, y: 250 }, { x: 420, y: 280 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "gateway",
                endElementId: "payment",
                points: [{ x: 100, y: 250 }, { x: 420, y: 440 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "order",
                endElementId: "order_db",
                points: [{ x: 420, y: 280 }, { x: 740, y: 280 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "order",
                endElementId: "notif_queue",
                points: [{ x: 420, y: 280 }, { x: 740, y: 120 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            }
        ]
    },
    {
        title: "Rapid Ideation Canvas",
        category: "Brainstorming",
        description: "A structured brainstorming canvas with custom header categories, instructions, and voting cards.",
        thumbnailUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80",
        elements: [
            {
                type: "text",
                x: 50,
                y: 40,
                width: 600,
                height: 50,
                content: "Feature Ideation Board",
                appearance: { fill: "#0f172a", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 50,
                y: 120,
                width: 250,
                height: 40,
                content: "🚨 USER PAIN POINTS",
                appearance: { fill: "#ef4444", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 350,
                y: 120,
                width: 250,
                height: 40,
                content: "💡 SOLUTION IDEAS",
                appearance: { fill: "#3b82f6", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 650,
                y: 120,
                width: 250,
                height: 40,
                content: "🚀 MOONSHOTS",
                appearance: { fill: "#8b5cf6", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 950,
                y: 120,
                width: 250,
                height: 40,
                content: "📦 PRODUCT FEATURES",
                appearance: { fill: "#10b981", stroke: "none", strokeWidth: 0 }
            },
            {
                id: "pain_1",
                type: "sticky-note",
                x: 50,
                y: 180,
                width: 200,
                height: 150,
                content: "Users struggle to locate the export button on mobile viewports.",
                appearance: { fill: "#fecaca", stroke: "#f87171", strokeWidth: 1 }
            },
            {
                id: "pain_2",
                type: "sticky-note",
                x: 50,
                y: 350,
                width: 200,
                height: 150,
                content: "Collaboration delays are noticeable when multiple users edit concurrently.",
                appearance: { fill: "#fecaca", stroke: "#f87171", strokeWidth: 1 }
            },
            {
                id: "sol_1",
                type: "sticky-note",
                x: 350,
                y: 180,
                width: 200,
                height: 150,
                content: "Move the export button to the top primary navigation bar.",
                appearance: { fill: "#dbeafe", stroke: "#60a5fa", strokeWidth: 1 }
            },
            {
                id: "sol_2",
                type: "sticky-note",
                x: 350,
                y: 350,
                width: 200,
                height: 150,
                content: "Optimize websocket messages by batching position updates.",
                appearance: { fill: "#dbeafe", stroke: "#60a5fa", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 650,
                y: 180,
                width: 200,
                height: 150,
                content: "AI-powered layout auto-organizer to sort cards instantly.",
                appearance: { fill: "#f3e8ff", stroke: "#c084fc", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 650,
                y: 350,
                width: 200,
                height: 150,
                content: "Fully immersive VR board editing modes.",
                appearance: { fill: "#f3e8ff", stroke: "#c084fc", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 950,
                y: 180,
                width: 200,
                height: 150,
                content: "Responsive TopToolbar with visible navigation shortcuts.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 950,
                y: 350,
                width: 200,
                height: 150,
                content: "Refactored collaborative state manager.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            },
            {
                type: "arrow",
                startElementId: "pain_1",
                endElementId: "sol_1",
                points: [{ x: 250, y: 255 }, { x: 350, y: 255 }],
                appearance: { stroke: "#94a3b8", strokeWidth: 2 },
                strokeDash: true
            },
            {
                type: "arrow",
                startElementId: "pain_2",
                endElementId: "sol_2",
                points: [{ x: 250, y: 425 }, { x: 350, y: 425 }],
                appearance: { stroke: "#94a3b8", strokeWidth: 2 },
                strokeDash: true
            }
        ]
    },
    {
        title: "Atomic Components",
        category: "Design Systems",
        description: "AWS Cloud Infrastructure architecture containing load balancing, caching tiers, queues, and databases.",
        thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
        elements: [
            {
                type: "text",
                x: 100,
                y: 40,
                width: 600,
                height: 50,
                content: "AWS Cloud Architecture - Production V1",
                appearance: { fill: "#0f172a", stroke: "none", strokeWidth: 0 }
            },
            {
                id: "alb",
                type: "service-card",
                x: 100,
                y: 250,
                width: 220,
                height: 120,
                title: "Application Load Balancer",
                description: "Directs incoming client traffic across multiple ECS instances.",
                badge: "API",
                appearance: { stroke: "#ff9900", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "web_ecs",
                type: "service-card",
                x: 400,
                y: 150,
                width: 220,
                height: 120,
                title: "Web App ECS Cluster",
                description: "Containers running frontend server and client routing API endpoints.",
                badge: "SERVICE",
                appearance: { stroke: "#4285f4", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "redis",
                type: "service-card",
                x: 700,
                y: 150,
                width: 220,
                height: 120,
                title: "ElastiCache Redis",
                description: "In-memory caching for session states and rapid page views.",
                badge: "CACHE",
                appearance: { stroke: "#ea4335", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "sqs",
                type: "service-card",
                x: 400,
                y: 350,
                width: 220,
                height: 120,
                title: "SQS Job Queue",
                description: "Stores background jobs to be consumed asynchronously by workers.",
                badge: "QUEUE",
                appearance: { stroke: "#9b59b6", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "worker_ecs",
                type: "service-card",
                x: 700,
                y: 350,
                width: 220,
                height: 120,
                title: "Worker ECS Cluster",
                description: "Pulls notification and export events from SQS and processes them.",
                badge: "SERVICE",
                appearance: { stroke: "#4285f4", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "rds",
                type: "database-card",
                x: 1000,
                y: 250,
                width: 220,
                height: 120,
                title: "Aurora PostgreSQL",
                description: "Multi-AZ replicated relational database storing client details.",
                badge: "DATABASE",
                appearance: { stroke: "#8B6914", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                type: "arrow",
                startElementId: "alb",
                endElementId: "web_ecs",
                points: [{ x: 100, y: 250 }, { x: 400, y: 150 }],
                appearance: { stroke: "#ff9900", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "web_ecs",
                endElementId: "redis",
                points: [{ x: 400, y: 150 }, { x: 700, y: 150 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "web_ecs",
                endElementId: "sqs",
                points: [{ x: 400, y: 150 }, { x: 400, y: 350 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "sqs",
                endElementId: "worker_ecs",
                points: [{ x: 400, y: 350 }, { x: 700, y: 350 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "web_ecs",
                endElementId: "rds",
                points: [{ x: 400, y: 150 }, { x: 1000, y: 250 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "worker_ecs",
                endElementId: "rds",
                points: [{ x: 700, y: 350 }, { x: 1000, y: 250 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            }
        ]
    },
    {
        title: "Product Roadmap Sync",
        category: "Project Management",
        description: "Align stakeholders with a high-level timeline, active epic items, and task priorities.",
        thumbnailUrl: "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=600&q=80",
        elements: [
            {
                type: "text",
                x: 50,
                y: 40,
                width: 600,
                height: 50,
                content: "Product Development Roadmap - H2 2026",
                appearance: { fill: "#0f172a", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 50,
                y: 150,
                width: 200,
                height: 40,
                content: "🔐 SECURITY & AUTH",
                appearance: { fill: "#1e293b", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 50,
                y: 350,
                width: 200,
                height: 40,
                content: "🎨 CANVAS ENGINE",
                appearance: { fill: "#1e293b", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 50,
                y: 550,
                width: 200,
                height: 40,
                content: "🤝 INTEGRATIONS",
                appearance: { fill: "#1e293b", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 300,
                y: 100,
                width: 200,
                height: 30,
                content: "Sprint 1 (Jul - Aug)",
                appearance: { fill: "#475569", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 600,
                y: 100,
                width: 200,
                height: 30,
                content: "Sprint 2 (Sept - Oct)",
                appearance: { fill: "#475569", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 900,
                y: 100,
                width: 200,
                height: 30,
                content: "Sprint 3 (Nov - Dec)",
                appearance: { fill: "#475569", stroke: "none", strokeWidth: 0 }
            },
            {
                id: "task_oauth",
                type: "sticky-note",
                x: 300,
                y: 150,
                width: 220,
                height: 120,
                content: "Integrate Google/GitHub OAuth logins for easy team registration.",
                appearance: { fill: "#dbeafe", stroke: "#60a5fa", strokeWidth: 1 }
            },
            {
                id: "task_export",
                type: "sticky-note",
                x: 300,
                y: 350,
                width: 220,
                height: 120,
                content: "Implement high-res client-side board export to PNG formats.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            },
            {
                id: "task_slack",
                type: "sticky-note",
                x: 300,
                y: 550,
                width: 220,
                height: 120,
                content: "Build slack notification webhook for channel activity.",
                appearance: { fill: "#fef3c7", stroke: "#f59e0b", strokeWidth: 1 }
            },
            {
                id: "task_roles",
                type: "sticky-note",
                x: 600,
                y: 150,
                width: 220,
                height: 120,
                content: "Add granular workspace permissions (Viewer vs Editor roles).",
                appearance: { fill: "#dbeafe", stroke: "#60a5fa", strokeWidth: 1 }
            },
            {
                id: "task_zoom",
                type: "sticky-note",
                x: 600,
                y: 350,
                width: 220,
                height: 120,
                content: "Optimize scroll-to-zoom gestures and touch viewport rendering.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            },
            {
                id: "task_ldap",
                type: "sticky-note",
                x: 900,
                y: 150,
                width: 220,
                height: 120,
                content: "Enterprise SSO integration using SAML/LDAP mappings.",
                appearance: { fill: "#dbeafe", stroke: "#60a5fa", strokeWidth: 1 }
            },
            {
                id: "task_undo",
                type: "sticky-note",
                x: 900,
                y: 350,
                width: 220,
                height: 120,
                content: "Create history logger supporting undo/redo canvas operations.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            },
            {
                type: "arrow",
                startElementId: "task_oauth",
                endElementId: "task_roles",
                points: [{ x: 300, y: 150 }, { x: 600, y: 150 }],
                appearance: { stroke: "#94a3b8", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "task_roles",
                endElementId: "task_ldap",
                points: [{ x: 600, y: 150 }, { x: 900, y: 150 }],
                appearance: { stroke: "#94a3b8", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "task_export",
                endElementId: "task_zoom",
                points: [{ x: 300, y: 350 }, { x: 600, y: 350 }],
                appearance: { stroke: "#94a3b8", strokeWidth: 2 }
            }
        ]
    },
    {
        title: "Customer Journey Map",
        category: "Agile Frameworks",
        description: "Visualize the user experience through every touchpoint to identify pain points and delight milestones.",
        thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
        elements: [
            {
                type: "text",
                x: 50,
                y: 40,
                width: 600,
                height: 50,
                content: "Customer Journey Map - Enterprise Collaboration SaaS",
                appearance: { fill: "#0f172a", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 250,
                y: 100,
                width: 200,
                height: 30,
                content: "1. Awareness",
                appearance: { fill: "#0284c7", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 500,
                y: 100,
                width: 200,
                height: 30,
                content: "2. Consideration",
                appearance: { fill: "#f97316", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 750,
                y: 100,
                width: 200,
                height: 30,
                content: "3. Onboarding",
                appearance: { fill: "#8b5cf6", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 1000,
                y: 100,
                width: 200,
                height: 30,
                content: "4. Retention",
                appearance: { fill: "#10b981", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 50,
                y: 160,
                width: 150,
                height: 30,
                content: "Activities",
                appearance: { fill: "#475569", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 50,
                y: 330,
                width: 150,
                height: 30,
                content: "Pain Points",
                appearance: { fill: "#475569", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "text",
                x: 50,
                y: 500,
                width: 150,
                height: 30,
                content: "Delight Goals",
                appearance: { fill: "#475569", stroke: "none", strokeWidth: 0 }
            },
            {
                type: "sticky-note",
                x: 250,
                y: 160,
                width: 200,
                height: 140,
                content: "User reads a tech blog post about real-time diagramming tools.",
                appearance: { fill: "#fef08a", stroke: "#eab308", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 500,
                y: 160,
                width: 200,
                height: 140,
                content: "Creates a free workspace and test-draws complex flowchart paths.",
                appearance: { fill: "#fef08a", stroke: "#eab308", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 750,
                y: 160,
                width: 200,
                height: 140,
                content: "Invites 3 team members to verify live multi-cursor speeds.",
                appearance: { fill: "#fef08a", stroke: "#eab308", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 1000,
                y: 160,
                width: 200,
                height: 140,
                content: "Integrates exports and builds diagrams for internal sprint specs.",
                appearance: { fill: "#fef08a", stroke: "#eab308", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 250,
                y: 330,
                width: 200,
                height: 140,
                content: "Hard to quickly estimate enterprise costs and billing.",
                appearance: { fill: "#fecaca", stroke: "#f87171", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 500,
                y: 330,
                width: 200,
                height: 140,
                content: "UI controls feel slightly confusing without an onboarding helper.",
                appearance: { fill: "#fecaca", stroke: "#f87171", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 750,
                y: 330,
                width: 200,
                height: 140,
                content: "Team member invitation links sometimes get marked as spam.",
                appearance: { fill: "#fecaca", stroke: "#f87171", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 1000,
                y: 330,
                width: 200,
                height: 140,
                content: "Requires continuous high resolution PNG exports.",
                appearance: { fill: "#fecaca", stroke: "#f87171", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 250,
                y: 500,
                width: 200,
                height: 140,
                content: "Include pricing slider and direct calendar call scheduler.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 500,
                y: 500,
                width: 200,
                height: 140,
                content: "Provide a quick hands-on tutorial with guided paths.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 750,
                y: 500,
                width: 200,
                height: 140,
                content: "Enable invite link generation direct to clipboard.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 1000,
                y: 500,
                width: 200,
                height: 140,
                content: "Support instant high-fidelity local image downloads.",
                appearance: { fill: "#d1fae5", stroke: "#34d399", strokeWidth: 1 }
            }
        ]
    },
    {
        title: "Omni-Channel Strategy",
        category: "Agile Frameworks",
        description: "Plan global campaigns across social, email, and web with integrated asset management and KPI trackers.",
        thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
        elements: [
            {
                type: "text",
                x: 100,
                y: 40,
                width: 600,
                height: 50,
                content: "Omni-Channel Launch Marketing Plan",
                appearance: { fill: "#0f172a", stroke: "none", strokeWidth: 0 }
            },
            {
                id: "mkt_social",
                type: "service-card",
                x: 100,
                y: 180,
                width: 220,
                height: 120,
                title: "Social Media Campaigns",
                description: "Promote launches on Twitter, LinkedIn, and YouTube.",
                badge: "SERVICE",
                appearance: { stroke: "#4285f4", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "mkt_landing",
                type: "service-card",
                x: 400,
                y: 300,
                width: 220,
                height: 120,
                title: "Website Landing Page",
                description: "Primary sign-up page featuring demo videos and CTA.",
                badge: "API",
                appearance: { stroke: "#34a853", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "mkt_email",
                type: "service-card",
                x: 100,
                y: 420,
                width: 220,
                height: 120,
                title: "Email Newsletter Series",
                description: "Send launch newsletter and onboarding drips.",
                badge: "SERVICE",
                appearance: { stroke: "#4285f4", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                id: "mkt_db",
                type: "database-card",
                x: 700,
                y: 300,
                width: 220,
                height: 120,
                title: "Marketing Leads Database",
                description: "SQL Server holding trial registrations and lead scores.",
                badge: "DATABASE",
                appearance: { stroke: "#8B6914", fill: "#ffffff", strokeWidth: 4 }
            },
            {
                type: "sticky-note",
                x: 100,
                y: 30,
                width: 180,
                height: 120,
                content: "Weekly posts scheduled starting next Monday.",
                appearance: { fill: "#fef3c7", stroke: "#f59e0b", strokeWidth: 1 }
            },
            {
                type: "sticky-note",
                x: 100,
                y: 570,
                width: 180,
                height: 120,
                content: "Draft email templates in Mailchimp by Friday.",
                appearance: { fill: "#fef3c7", stroke: "#f59e0b", strokeWidth: 1 }
            },
            {
                type: "arrow",
                startElementId: "mkt_social",
                endElementId: "mkt_landing",
                points: [{ x: 100, y: 180 }, { x: 400, y: 300 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "mkt_email",
                endElementId: "mkt_landing",
                points: [{ x: 100, y: 420 }, { x: 400, y: 300 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            },
            {
                type: "arrow",
                startElementId: "mkt_landing",
                endElementId: "mkt_db",
                points: [{ x: 400, y: 300 }, { x: 700, y: 300 }],
                appearance: { stroke: "#64748b", strokeWidth: 2 }
            }
        ]
    }
];

// UUID generator utility to avoid database unique constraint violations
const uuidv4 = () => {
    try {
        if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }
    } catch (e) {}
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

// Helper to generate full valid CanvasElement schema structures for fallbacks
const generateCanvasElements = (localElements: any[]): any[] => {
    const idMap: { [oldId: string]: string } = {};

    // First pass: Assign new unique UUIDs
    const elementsWithNewIds = localElements.map((el, index) => {
        const oldId = el.id || el.tempId || `temp-${index}`;
        const newId = uuidv4();
        idMap[oldId] = newId;
        return {
            ...el,
            id: newId,
            oldId,
        };
    });

    // Second pass: Map references and format elements
    return elementsWithNewIds.map((el, index) => {
        const mappedStartElementId = el.startElementId ? (idMap[el.startElementId] || el.startElementId) : undefined;
        const mappedEndElementId = el.endElementId ? (idMap[el.endElementId] || el.endElementId) : undefined;

        const base = {
            id: el.id,
            x: el.x || 100,
            y: el.y || 100,
            width: el.width || 150,
            height: el.height || 80,
            rotation: 0,
            zIndex: index,
            isLocked: false,
            appearance: {
                fillColor: el.appearance?.fill || "#ffffff",
                strokeColor: el.appearance?.stroke || "#000000",
                strokeWidth: el.appearance?.strokeWidth || 2,
            },
            createdBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (el.type === "text" || el.type === "sticky-note") {
            return {
                ...base,
                type: el.type,
                content: el.content || "",
            };
        } else if (el.type === "service-card") {
            return {
                ...base,
                type: "service-card",
                badge: el.badge || "card",
                title: el.title || "",
                description: el.description || "",
            };
        } else if (el.type === "database-card") {
            return {
                ...base,
                type: "database-card",
                badge: el.badge || "db",
                title: el.title || "",
                description: el.description || "",
            };
        } else if (el.type === "line" || el.type === "arrow" || el.type === "connector") {
            const points = (el.points || []).map((p: any) => {
                if (Array.isArray(p)) return { x: p[0], y: p[1] };
                return { x: p.x || 0, y: p.y || 0 };
            });
            return {
                ...base,
                type: el.type,
                points,
                startElementId: mappedStartElementId,
                endElementId: mappedEndElementId,
            };
        } else {
            return {
                ...base,
                type: el.type,
                content: el.content || "",
            };
        }
    });
};

const TemplatesPage: React.FC = () => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("All Templates");
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
    const navigate = useNavigate();

    const categories = [
        "All Templates",
        "Flowcharts",
        "Brainstorming",
        "Design Systems",
        "Project Management",
        "Agile Frameworks",
    ];

    // Load templates on component mount
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                const res = await templateApi.listTemplates({ limit: 100 });
                const backendTemplates = res.data || [];

                // Merge with local list to enrich thumbnails and retain all 6 cards
                const merged = LOCAL_TEMPLATES.map((local) => {
                    const matched = backendTemplates.find(
                        (b) =>
                            b.title.toLowerCase() === local.title.toLowerCase() ||
                            (local.title === "Rapid Ideation Canvas" && b.title.toLowerCase().includes("brainstorming")) ||
                            (local.title === "Atomic Components" && b.title.toLowerCase().includes("aws"))
                    );
                    return {
                        ...local,
                        id: matched ? matched.id : `local-${local.title.replace(/\s+/g, "-").toLowerCase()}`,
                        isMatchedInDb: !!matched,
                    };
                });
                setTemplates(merged);
            } catch (error) {
                console.warn("Failed to fetch templates from API, using high-fidelity local templates fallbacks.", error);
                const localOnly = LOCAL_TEMPLATES.map((local) => ({
                    ...local,
                    id: `local-${local.title.replace(/\s+/g, "-").toLowerCase()}`,
                    isMatchedInDb: false,
                }));
                setTemplates(localOnly);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    // Filter templates based on selected category and header search query
    const filteredTemplates = templates.filter((template) => {
        const matchesCategory =
            selectedCategory === "All Templates" || template.category === selectedCategory;
        const matchesSearch =
            !searchQuery ||
            template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Handle template creation click
    const handleUseTemplate = async (template: any) => {
        setIsCreating(template.title);
        try {
            if (template.isMatchedInDb) {
                // Template is registered in the database, backend will clone elements
                const board = await boardApi.createBoard({
                    title: template.title,
                    templateId: template.id,
                });
                navigate(`/board/${board.id}`);
            } else {
                // Fallback creation for locally defined templates or offline mock mode
                const board = await boardApi.createBoard({
                    title: template.title,
                });
                
                // Format and save elements locally to initialize the board
                const elements = generateCanvasElements(template.elements);
                await canvasApi.saveSnapshot(board.id, elements);
                navigate(`/board/${board.id}`);
            }
        } catch (error) {
            console.error("Failed to create board from template:", error);
            alert("Failed to initialize board from template. Creating a standard blank board instead.");
            try {
                const blankBoard = await boardApi.createBoard({ title: template.title });
                navigate(`/board/${blankBoard.id}`);
            } catch (err) {
                console.error("Critical board creation failure:", err);
                alert("Could not create board. Please check your internet connection and try again.");
            }
        } finally {
            setIsCreating(null);
        }
    };

    const clearSearch = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("search");
        setSearchParams(newParams);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-50/50">
            {/* Page Container */}
            <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
                
                {/* Header Title Section */}
                <div className="mb-10 text-left">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                        Start with a Blueprint
                    </h1>
                    <p className="mt-4 text-slate-500 max-w-3xl leading-relaxed text-base md:text-lg">
                        Accelerate your workflow with curated templates designed for high-performance teams. 
                        From architectural design to project syncs.
                    </p>
                </div>

                {/* Category Pills Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-12 overflow-x-auto pb-2 scrollbar-none select-none">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                selectedCategory === cat
                                    ? "bg-[#24292F] text-white shadow-sm scale-102"
                                    : "bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-350 text-slate-650"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid Template Cards */}
                {isLoading ? (
                    // Beautiful Loading Skeleton Grids
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden h-[360px] flex flex-col">
                                <div className="h-44 bg-slate-200 w-full" />
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="h-5 bg-slate-200 rounded w-2/3 mb-3" />
                                        <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                                        <div className="h-4 bg-slate-200 rounded w-4/5" />
                                    </div>
                                    <div className="h-10 bg-slate-200 rounded-xl w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    // Search Empty State
                    <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm px-6">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No templates found</h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-sm">
                            We couldn't find any templates matching "{searchQuery}". Try refining your keywords or categories.
                        </p>
                        <button
                            onClick={clearSearch}
                            className="mt-5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-sm cursor-pointer shadow-sm"
                        >
                            Clear search filters
                        </button>
                    </div>
                ) : (
                    // Render Active Grid Card Items
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="group bg-white border border-slate-100 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-200/80 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                            >
                                {/* Card Thumbnail image */}
                                <div className="relative h-44 w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                                    <img
                                        src={template.thumbnailUrl}
                                        alt={template.title}
                                        className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    {/* Category overlay label */}
                                    <span className="absolute top-4 left-4 bg-slate-900/80 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-md backdrop-blur-xs">
                                        {template.category}
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                                            {template.title}
                                        </h3>
                                        <p className="mt-2.5 text-sm text-slate-500 leading-relaxed line-clamp-2">
                                            {template.description}
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleUseTemplate(template)}
                                        disabled={isCreating !== null}
                                        className="w-full rounded-xl bg-[#EAF1FF] py-3 text-center text-sm font-semibold text-blue-600 hover:bg-[#D4E4FF] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer mt-5 hover:scale-[1.01] disabled:opacity-50"
                                    >
                                        {isCreating === template.title ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Initializing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Use Template</span>
                                                <span className="group-hover:translate-x-1.5 transition-transform duration-200">
                                                    →
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplatesPage;
