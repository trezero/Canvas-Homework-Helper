import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  fullName: text("full_name").default("Student"),
  schoolAffiliation: text("school_affiliation").default(""),
  canvasBaseUrl: text("canvas_base_url"),
  canvasApiToken: text("canvas_api_token"),
  canvasConnected: boolean("canvas_connected").notNull().default(false),
  accountType: text("account_type").notNull().default("student"),
  observedStudentId: text("observed_student_id"),
  observedStudentName: text("observed_student_name"),
  canvasUserId: text("canvas_user_id"),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
