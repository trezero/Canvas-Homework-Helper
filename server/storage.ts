import {
  type User,
  type UpsertUser,
  type Assignment,
  type InsertAssignment,
  type DashboardMetrics,
  type PriorityItem,
  type SavedFilter,
  type InsertSavedFilter,
  users,
  assignments,
  savedFilters,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAssignments(userId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  deleteAssignmentsByUser(userId: string): Promise<void>;
  getMetrics(userId: string): Promise<DashboardMetrics>;
  getPriorities(userId: string): Promise<PriorityItem[]>;
  getSavedFilters(userId: string): Promise<SavedFilter[]>;
  createSavedFilter(filter: InsertSavedFilter): Promise<SavedFilter>;
  updateSavedFilter(id: string, data: Partial<SavedFilter>): Promise<SavedFilter | undefined>;
  deleteSavedFilter(id: string): Promise<void>;
  setDefaultFilter(userId: string, filterId: string): Promise<SavedFilter | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAssignments(userId: string): Promise<Assignment[]> {
    return db.select().from(assignments).where(eq(assignments.userId, userId));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [created] = await db.insert(assignments).values(assignment).returning();
    return created;
  }

  async deleteAssignmentsByUser(userId: string): Promise<void> {
    await db.delete(assignments).where(eq(assignments.userId, userId));
  }

  async getMetrics(userId: string): Promise<DashboardMetrics> {
    const allAssignments = await this.getAssignments(userId);
    const total = allAssignments.length;

    const graded = allAssignments.filter((a) => a.status === "graded_on_time" || a.status === "graded_late");
    const gradedCount = graded.length;

    const scored = graded.filter((a) => a.score != null && a.pointsPossible != null && a.pointsPossible > 0);
    const averageScore = scored.length > 0
      ? Math.round(scored.reduce((acc, a) => acc + (a.score! / a.pointsPossible!) * 100, 0) / scored.length * 10) / 10
      : null;

    const missingCount = allAssignments.filter((a) => a.status === "missing").length;
    const pendingGradeCount = allAssignments.filter((a) => a.status === "submitted_pending_grade" || a.status === "submitted_late").length;

    let focusCourse: string | null = null;
    let focusCourseReason: string | null = null;

    const missingByCourse: Record<string, number> = {};
    allAssignments.filter((a) => a.status === "missing").forEach((a) => {
      missingByCourse[a.subject] = (missingByCourse[a.subject] || 0) + 1;
    });

    if (Object.keys(missingByCourse).length > 0) {
      const sorted = Object.entries(missingByCourse).sort((a, b) => b[1] - a[1]);
      focusCourse = sorted[0][0];
      focusCourseReason = `${sorted[0][1]} missing assignment${sorted[0][1] > 1 ? "s" : ""}`;
    } else {
      const courseScores: Record<string, { total: number; count: number }> = {};
      scored.forEach((a) => {
        if (!courseScores[a.subject]) courseScores[a.subject] = { total: 0, count: 0 };
        courseScores[a.subject].total += (a.score! / a.pointsPossible!) * 100;
        courseScores[a.subject].count++;
      });
      const coursesWithAvg = Object.entries(courseScores)
        .map(([name, v]) => ({ name, avg: v.total / v.count }))
        .filter((c) => c.avg < 90)
        .sort((a, b) => a.avg - b.avg);
      if (coursesWithAvg.length > 0) {
        focusCourse = coursesWithAvg[0].name;
        focusCourseReason = `${Math.round(coursesWithAvg[0].avg)}% average`;
      }
    }

    const now = new Date();
    const month = now.getMonth();
    let semesterStart: Date;
    let semesterEnd: Date;
    if (month >= 0 && month <= 4) {
      semesterStart = new Date(now.getFullYear(), 0, 15);
      semesterEnd = new Date(now.getFullYear(), 4, 30);
    } else if (month >= 7 && month <= 11) {
      semesterStart = new Date(now.getFullYear(), 7, 15);
      semesterEnd = new Date(now.getFullYear(), 11, 15);
    } else {
      semesterStart = new Date(now.getFullYear(), 4, 15);
      semesterEnd = new Date(now.getFullYear(), 7, 15);
    }
    const totalDays = (semesterEnd.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24);
    const elapsed = (now.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24);
    const semesterProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));

    return {
      gradedCount,
      totalCount: total,
      averageScore,
      missingCount,
      pendingGradeCount,
      focusCourse,
      focusCourseReason,
      semesterProgress,
    };
  }

  async getPriorities(userId: string): Promise<PriorityItem[]> {
    const allAssignments = await this.getAssignments(userId);
    const incomplete = allAssignments
      .filter((a) => a.status !== "graded_on_time" && a.status !== "graded_late")
      .sort((a, b) => {
        const statusOrder: Record<string, number> = {
          missing: 0,
          submitted_late: 1,
          submitted_pending_grade: 2,
          upcoming: 3,
          no_status: 4,
        };
        const oa = statusOrder[a.status] ?? 5;
        const ob = statusOrder[b.status] ?? 5;
        if (oa !== ob) return oa - ob;
        return b.weight - a.weight;
      });

    const items: PriorityItem[] = [];
    if (incomplete.length > 0) {
      const a = incomplete[0];
      items.push({
        type: "critical",
        label: "Critical Action",
        title: a.courseName,
        description: a.notes || `Due ${a.dueDate} - ${a.weight}% of grade`,
      });
    }
    if (incomplete.length > 1) {
      const a = incomplete[1];
      items.push({
        type: "standard",
        label: "Standard Task",
        title: a.courseName,
        description: a.notes || `Due ${a.dueDate} - ${a.weight}% of grade`,
      });
    }
    if (incomplete.length > 2) {
      const a = incomplete[2];
      items.push({
        type: "upcoming",
        label: "Coming Up",
        title: a.courseName,
        description: a.notes || `Due ${a.dueDate}`,
      });
    }

    return items;
  }

  async getSavedFilters(userId: string): Promise<SavedFilter[]> {
    return db.select().from(savedFilters).where(eq(savedFilters.userId, userId));
  }

  async createSavedFilter(filter: InsertSavedFilter): Promise<SavedFilter> {
    const [created] = await db.insert(savedFilters).values(filter).returning();
    return created;
  }

  async updateSavedFilter(id: string, data: Partial<SavedFilter>): Promise<SavedFilter | undefined> {
    const [updated] = await db.update(savedFilters).set(data).where(eq(savedFilters.id, id)).returning();
    return updated;
  }

  async deleteSavedFilter(id: string): Promise<void> {
    await db.delete(savedFilters).where(eq(savedFilters.id, id));
  }

  async setDefaultFilter(userId: string, filterId: string): Promise<SavedFilter | undefined> {
    await db.update(savedFilters).set({ isDefault: false }).where(eq(savedFilters.userId, userId));
    const [updated] = await db.update(savedFilters).set({ isDefault: true }).where(and(eq(savedFilters.id, filterId), eq(savedFilters.userId, userId))).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
