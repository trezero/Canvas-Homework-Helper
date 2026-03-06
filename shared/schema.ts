import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const ASSIGNMENT_STATUSES = [
  "missing",
  "graded_late",
  "submitted_late",
  "graded_on_time",
  "submitted_pending_grade",
  "upcoming",
  "no_status",
] as const;

export type AssignmentStatusEnum = (typeof ASSIGNMENT_STATUSES)[number];

export type AssignmentFlags = {
  hasSubmission: boolean;
  isGraded: boolean;
  isMissing: boolean;
  isLate: boolean;
  hasReplies: boolean;
};

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  courseName: text("course_name").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("no_status"),
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
  assignmentType: text("assignment_type").notNull().default("assignment"),
  hasSubmission: boolean("has_submission").notNull().default(false),
  isGraded: boolean("is_graded").notNull().default(false),
  isMissing: boolean("is_missing").notNull().default(false),
  isLate: boolean("is_late").notNull().default(false),
  hasReplies: boolean("has_replies").notNull().default(false),
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

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type DashboardMetrics = {
  gradedCount: number;
  totalCount: number;
  averageScore: number | null;
  missingCount: number;
  pendingGradeCount: number;
  focusCourse: string | null;
  focusCourseReason: string | null;
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
    course?: string | string[];
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
