import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CanvasClient } from "./canvas";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { assignments, insertSavedFilterSchema } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { resolveAssignmentStatus } from "@shared/status-resolver";
import { z } from "zod";

async function migrateOldStatuses() {
  const oldStatuses = ["completed", "overdue", "pending", "priority", "in progress"];
  const staleRecords = await db.select().from(assignments).where(
    inArray(assignments.status, oldStatuses)
  );

  if (staleRecords.length === 0) return;

  console.log(`Migrating ${staleRecords.length} assignments to new status system...`);

  for (const a of staleRecords) {
    const hasSubmission = !!(a.submittedAt || (a.gradedAt && a.score != null));
    const isGraded = !!(a.score != null && a.gradedAt);
    const hasReplies = false;

    let dueDate: Date | null = null;
    try {
      if (a.dueDate && a.dueDate !== "No date") {
        const parsed = new Date(a.dueDate);
        if (!isNaN(parsed.getTime())) dueDate = parsed;
      }
    } catch {}

    let isLate = false;
    if (hasSubmission && a.submittedAt && dueDate) {
      const submitted = new Date(a.submittedAt);
      if (!isNaN(submitted.getTime())) {
        isLate = submitted > dueDate;
      }
    }

    const now = new Date();
    const isPastDue = dueDate ? dueDate < now : false;
    const isMissing = !hasSubmission && isPastDue && !isGraded;

    const resolved = resolveAssignmentStatus({
      hasSubmission,
      isGraded,
      isMissing,
      isLate,
      hasReplies,
      dueAtIsInFuture: dueDate ? dueDate > now : false,
    });

    const completed = resolved.status === "graded_on_time" || resolved.status === "graded_late";

    await db.update(assignments)
      .set({
        status: resolved.status,
        completed,
        hasSubmission,
        isGraded,
        isMissing,
        isLate,
        hasReplies,
        assignmentType: "assignment",
      })
      .where(eq(assignments.id, a.id));
  }

  console.log(`Migration complete: ${staleRecords.length} assignments updated.`);
}

function getUserId(req: Request): string {
  return (req.user as any)?.claims?.sub;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  await migrateOldStatuses();

  app.get("/api/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { canvasApiToken, ...safeUser } = user;
      res.json({
        ...safeUser,
        canvasApiToken: canvasApiToken ? "••••••••••••••••" : null,
        hasCanvasToken: !!canvasApiToken,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
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
      const { canvasApiToken, ...safeUser } = updated;
      res.json({
        ...safeUser,
        canvasApiToken: canvasApiToken ? "••••••••••••••••" : null,
        hasCanvasToken: !!canvasApiToken,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/assignments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getAssignments(userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/metrics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getMetrics(userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/priorities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getPriorities(userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/canvas/test", isAuthenticated, async (req: Request, res: Response) => {
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

  app.get("/api/canvas/observees", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
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

  app.post("/api/canvas/sync", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
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

  app.get("/api/saved-filters", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const filters = await storage.getSavedFilters(userId);
      res.json(filters);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/saved-filters", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const parsed = insertSavedFilterSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const filter = await storage.createSavedFilter(parsed.data);
      res.status(201).json(filter);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/saved-filters/:id", isAuthenticated, async (req: Request, res: Response) => {
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
      const updated = await storage.updateSavedFilter(req.params.id as string, parsed.data);
      if (!updated) return res.status(404).json({ message: "Filter not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/saved-filters/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteSavedFilter(req.params.id as string);
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/saved-filters/:id/default", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const updated = await storage.setDefaultFilter(userId, req.params.id as string);
      if (!updated) return res.status(404).json({ message: "Filter not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
