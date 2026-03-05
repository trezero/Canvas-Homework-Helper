import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { CanvasClient } from "./canvas";
import session from "express-session";
import { db } from "./db";
import { users, insertSavedFilterSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
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
      const { password, canvasApiToken, ...safeUser } = user;
      res.json({
        ...safeUser,
        canvasApiToken: canvasApiToken ? "••••••••••••••••" : null,
        hasCanvasToken: !!canvasApiToken,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/user", async (req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });

      const combinedSchema = z.object({
        fullName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        schoolAffiliation: z.string().min(1).optional(),
        canvasBaseUrl: z.string().url().optional().or(z.literal("")),
        canvasApiToken: z.string().optional(),
        accountType: z.enum(["student", "observer"]).optional(),
        observedStudentId: z.string().nullable().optional(),
        observedStudentName: z.string().nullable().optional(),
      });

      const parsed = combinedSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }

      const data = parsed.data;
      const updateData: Partial<typeof user> = {};
      if (data.fullName) updateData.fullName = data.fullName;
      if (data.email) updateData.email = data.email;
      if (data.schoolAffiliation) updateData.schoolAffiliation = data.schoolAffiliation;
      if (data.canvasBaseUrl !== undefined) updateData.canvasBaseUrl = data.canvasBaseUrl;
      if (data.canvasApiToken !== undefined && data.canvasApiToken !== "••••••••••••••••") {
        updateData.canvasApiToken = data.canvasApiToken;
      }
      if (data.accountType) updateData.accountType = data.accountType;
      if (data.observedStudentId !== undefined) updateData.observedStudentId = data.observedStudentId;
      if (data.observedStudentName !== undefined) updateData.observedStudentName = data.observedStudentName;
      if (data.canvasBaseUrl && (data.canvasApiToken || user.canvasApiToken)) {
        updateData.canvasConnected = true;
      }

      const updated = await storage.updateUser(user.id, updateData);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password, canvasApiToken, ...safeUser } = updated;
      res.json({
        ...safeUser,
        canvasApiToken: canvasApiToken ? "••••••••••••••••" : null,
        hasCanvasToken: !!canvasApiToken,
      });
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

  app.post("/api/canvas/test", async (req, res) => {
    try {
      const schema = z.object({
        canvasBaseUrl: z.string().url(),
        canvasApiToken: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid Canvas URL or token." });
      }

      const { canvasBaseUrl, canvasApiToken } = parsed.data;
      const client = new CanvasClient(canvasBaseUrl, canvasApiToken);

      const self = await client.getSelf();
      const accountType = await client.detectAccountType();
      let observees: any[] = [];

      if (accountType === "observer") {
        observees = await client.getObservees();
      }

      res.json({
        success: true,
        canvasUser: {
          id: self.id,
          name: self.name || self.short_name,
          email: self.email || null,
        },
        accountType,
        observees,
      });
    } catch (e: any) {
      res.status(502).json({
        success: false,
        message: `Failed to connect to Canvas: ${e.message}`,
      });
    }
  });

  app.get("/api/canvas/observees", async (_req, res) => {
    try {
      const user = await getDemoUser();
      if (!user || !user.canvasBaseUrl || !user.canvasApiToken) {
        return res.status(400).json({ message: "Canvas not configured." });
      }

      const client = new CanvasClient(user.canvasBaseUrl, user.canvasApiToken);
      const observees = await client.getObservees();
      res.json(observees);
    } catch (e: any) {
      res.status(502).json({ message: e.message });
    }
  });

  app.post("/api/canvas/sync", async (req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.canvasBaseUrl || !user.canvasApiToken) {
        return res.status(400).json({
          message: "Canvas integration not configured. Please add your Canvas URL and API token in settings.",
        });
      }

      const syncSchema = z.object({
        observedStudentId: z.string().optional(),
      });
      const parsed = syncSchema.safeParse(req.body || {});
      const observedStudentId = parsed.success ? parsed.data.observedStudentId : undefined;

      const client = new CanvasClient(user.canvasBaseUrl, user.canvasApiToken);

      const self = await client.getSelf();
      const accountType = await client.detectAccountType();

      const canvasName = self.name || self.short_name || null;
      await storage.updateUser(user.id, {
        canvasUserId: String(self.id),
        accountType,
        canvasConnected: true,
        ...(canvasName ? { fullName: canvasName } : {}),
      });

      let targetStudentId: string | undefined;

      if (accountType === "observer") {
        const observees = await client.getObservees();

        if (observees.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No linked students found for this observer account.",
            accountType: "observer",
            observees: [],
          });
        }

        targetStudentId = observedStudentId || String(observees[0].id);

        const selectedObservee = observees.find(
          (o) => String(o.id) === targetStudentId
        );
        if (selectedObservee) {
          await storage.updateUser(user.id, {
            observedStudentId: targetStudentId,
            observedStudentName: selectedObservee.name,
          });
        }

        if (!observedStudentId && observees.length > 1) {
          return res.json({
            success: true,
            message: "Observer account detected. Please select a student to view.",
            accountType: "observer",
            coursesCount: 0,
            assignmentsCount: 0,
            observees,
            needsStudentSelection: true,
          });
        }
      }

      const { assignments, coursesCount, currentGrade } =
        await client.syncStudentData(user.id, targetStudentId);

      await storage.deleteAssignmentsByUser(user.id);

      for (const assignment of assignments) {
        await storage.createAssignment(assignment);
      }

      let observees: any[] = [];
      if (accountType === "observer") {
        observees = await client.getObservees();
      }

      res.json({
        success: true,
        message: `Synced ${assignments.length} assignments from ${coursesCount} courses.`,
        accountType,
        coursesCount,
        assignmentsCount: assignments.length,
        currentGrade,
        observees: observees.length > 0 ? observees : undefined,
      });
    } catch (e: any) {
      res.status(502).json({
        success: false,
        message: `Canvas sync failed: ${e.message}`,
      });
    }
  });

  app.get("/api/saved-filters", async (_req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });
      const filters = await storage.getSavedFilters(user.id);
      res.json(filters);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/saved-filters", async (req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });
      const parsed = insertSavedFilterSchema.safeParse({ ...req.body, userId: user.id });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const filter = await storage.createSavedFilter(parsed.data);
      res.status(201).json(filter);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/saved-filters/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        filters: z.object({
          course: z.string().optional(),
          status: z.array(z.string()).optional(),
          hideLocked: z.boolean().optional(),
          searchQuery: z.string().optional(),
        }).optional(),
      });
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const updated = await storage.updateSavedFilter(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Filter not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/saved-filters/:id", async (_req, res) => {
    try {
      await storage.deleteSavedFilter(_req.params.id);
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/saved-filters/:id/default", async (req, res) => {
    try {
      const user = await getDemoUser();
      if (!user) return res.status(404).json({ message: "User not found" });
      const updated = await storage.setDefaultFilter(user.id, req.params.id);
      if (!updated) return res.status(404).json({ message: "Filter not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
