import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull().default("Student"),
  email: text("email").notNull().default(""),
  schoolAffiliation: text("school_affiliation").notNull().default(""),
  canvasBaseUrl: text("canvas_base_url"),
  canvasApiToken: text("canvas_api_token"),
  canvasConnected: boolean("canvas_connected").notNull().default(false),
  accountType: text("account_type").notNull().default("student"),
  observedStudentId: text("observed_student_id"),
  observedStudentName: text("observed_student_name"),
  canvasUserId: text("canvas_user_id"),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  courseName: text("course_name").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("pending"),
  dueDate: text("due_date").notNull(),
  weight: real("weight").notNull().default(0),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  canvasAssignmentId: text("canvas_assignment_id"),
  grade: real("grade"),
  pointsPossible: real("points_possible"),
  score: real("score"),
  submittedAt: text("submitted_at"),
  gradedAt: text("graded_at"),
  courseId: text("course_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  schoolAffiliation: true,
});

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  schoolAffiliation: z.string().min(1),
});

export const updateCanvasSettingsSchema = z.object({
  canvasBaseUrl: z.string().url(),
  canvasApiToken: z.string().min(1),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type DashboardMetrics = {
  completionRate: number;
  completionRateChange: number;
  onTimeStreak: number;
  totalTasksDone: number;
  currentStanding: string;
  standingDetail: string;
  semesterProgress: number;
};

export type PriorityItem = {
  type: "critical" | "standard" | "upcoming";
  label: string;
  title: string;
  description: string;
};

export type CanvasObservee = {
  id: number;
  name: string;
  sortable_name: string;
  short_name: string;
};

export type CanvasSyncResult = {
  success: boolean;
  message: string;
  accountType: "student" | "observer";
  coursesCount: number;
  assignmentsCount: number;
  observees?: CanvasObservee[];
};

export const savedFilters = pgTable("saved_filters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull().$type<{
    course?: string;
    status?: string[];
    hideLocked?: boolean;
    searchQuery?: string;
  }>(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSavedFilterSchema = createInsertSchema(savedFilters).omit({
  id: true,
  createdAt: true,
});

export type SavedFilter = typeof savedFilters.$inferSelect;
export type InsertSavedFilter = z.infer<typeof insertSavedFilterSchema>;
