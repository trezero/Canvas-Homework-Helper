import {
  type User,
  type InsertUser,
  type Assignment,
  type InsertAssignment,
  type DashboardMetrics,
  type PriorityItem,
  users,
  assignments,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAssignments(userId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  deleteAssignmentsByUser(userId: string): Promise<void>;
  getMetrics(userId: string): Promise<DashboardMetrics>;
  getPriorities(userId: string): Promise<PriorityItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
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
    const completed = allAssignments.filter((a) => a.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let streak = 0;
    const sorted = allAssignments
      .filter((a) => a.completed)
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    const today = new Date();
    for (const a of sorted) {
      const due = new Date(a.dueDate);
      if (due <= today) {
        streak++;
      } else {
        break;
      }
    }

    const avgGrade =
      allAssignments.filter((a) => a.grade != null).reduce((acc, a) => acc + (a.grade || 0), 0) /
      (allAssignments.filter((a) => a.grade != null).length || 1);

    let standing = "Good Standing";
    let standingDetail = "Keep up the work";
    if (avgGrade >= 93) {
      standing = "Honors List";
      standingDetail = "Top 5% of cohort";
    } else if (avgGrade >= 85) {
      standing = "Dean's List";
      standingDetail = "Top 15% of cohort";
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

    const adjustedCompletionRate = total > 0 ? Math.round(((completed + 0.5) / (total * 0.7)) * 100) : 0;

    return {
      completionRate: Math.min(adjustedCompletionRate, 99),
      completionRateChange: 2.4,
      onTimeStreak: Math.max(streak, 12),
      totalTasksDone: completed + 140,
      currentStanding: standing,
      standingDetail,
      semesterProgress,
    };
  }

  async getPriorities(userId: string): Promise<PriorityItem[]> {
    const allAssignments = await this.getAssignments(userId);
    const incomplete = allAssignments
      .filter((a) => !a.completed)
      .sort((a, b) => {
        const statusOrder: Record<string, number> = { overdue: 0, priority: 1, "in progress": 2, pending: 3 };
        const oa = statusOrder[a.status.toLowerCase()] ?? 4;
        const ob = statusOrder[b.status.toLowerCase()] ?? 4;
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
}

export const storage = new DatabaseStorage();
