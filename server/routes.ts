import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import session from "express-session";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({ checkPeriod: 86400000 }),
      cookie: { maxAge: 86400000 },
    })
  );

  await seedDatabase();

  const getDemoUser = async () => {
    const [user] = await db.select().from(users).where(eq(users.username, "demo"));
    return user;
  };

  app.get("/api/user", async (_req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/user", async (req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });

      const { updateUserProfileSchema, updateCanvasSettingsSchema } = await import("@shared/schema");
      const { z } = await import("zod");

      const combinedSchema = z.object({
        fullName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        schoolAffiliation: z.string().min(1).optional(),
        canvasBaseUrl: z.string().url().optional().or(z.literal("")),
        canvasApiToken: z.string().optional(),
      });

      const parsed = combinedSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }

      const { fullName, email, schoolAffiliation, canvasBaseUrl, canvasApiToken } = parsed.data;
      const updateData: Partial<typeof user> = {};
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
      if (schoolAffiliation) updateData.schoolAffiliation = schoolAffiliation;
      if (canvasBaseUrl !== undefined) updateData.canvasBaseUrl = canvasBaseUrl;
      if (canvasApiToken !== undefined) updateData.canvasApiToken = canvasApiToken;
      if (canvasBaseUrl && canvasApiToken) updateData.canvasConnected = true;

      const updated = await storage.updateUser(user.id, updateData);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/assignments", async (_req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });
      const result = await storage.getAssignments(user.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/metrics", async (_req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });
      const result = await storage.getMetrics(user.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/priorities", async (_req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });
      const result = await storage.getPriorities(user.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/canvas/sync", async (_req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.canvasBaseUrl || !user.canvasApiToken) {
        return res.status(400).json({
          message: "Canvas integration not configured. Please add your Canvas URL and API token in settings.",
        });
      }

      try {
        const coursesRes = await fetch(`${user.canvasBaseUrl}/api/v1/courses?enrollment_state=active&per_page=50`, {
          headers: { Authorization: `Bearer ${user.canvasApiToken}` },
        });

        if (!coursesRes.ok) {
          throw new Error(`Canvas API returned ${coursesRes.status}`);
        }

        const courses = await coursesRes.json();

        await storage.deleteAssignmentsByUser(user.id);

        for (const course of courses) {
          try {
            const assignmentsRes = await fetch(
              `${user.canvasBaseUrl}/api/v1/courses/${course.id}/assignments?per_page=50&order_by=due_at`,
              { headers: { Authorization: `Bearer ${user.canvasApiToken}` } }
            );

            if (!assignmentsRes.ok) continue;
            const canvasAssignments = await assignmentsRes.json();

            for (const ca of canvasAssignments) {
              const dueDate = ca.due_at
                ? new Date(ca.due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "No date";

              let status = "pending";
              const now = new Date();
              if (ca.due_at && new Date(ca.due_at) < now && !ca.has_submitted_submissions) {
                status = "overdue";
              } else if (ca.has_submitted_submissions) {
                status = "completed";
              }

              await storage.createAssignment({
                userId: user.id,
                courseName: ca.name || "Unnamed Assignment",
                subject: course.name || "Unknown Course",
                status,
                dueDate,
                weight: ca.points_possible ? Math.round((ca.points_possible / 100) * 100) / 100 : 0,
                completed: ca.has_submitted_submissions || false,
                canvasAssignmentId: String(ca.id),
                grade: ca.score || null,
                notes: ca.description ? ca.description.replace(/<[^>]*>/g, "").slice(0, 200) : null,
              });
            }
          } catch {
            continue;
          }
        }

        res.json({ message: "Sync complete", coursesCount: courses.length });
      } catch (err: any) {
        res.status(502).json({
          message: `Failed to connect to Canvas: ${err.message}. Using demo data instead.`,
        });
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
