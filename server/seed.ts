import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existing = await db.select().from(users).where(eq(users.username, "demo"));
  if (existing.length > 0) {
    return;
  }

  const user = await storage.createUser({
    username: "demo",
    password: "demo123",
    fullName: "Solace",
    email: "solace@student.edu",
    schoolAffiliation: "Pasadena High School",
  });

  await storage.updateUser(user.id, {
    canvasBaseUrl: "https://pasadena.instructure.com",
    canvasConnected: false,
  });

  const assignmentData = [
    {
      userId: user.id,
      courseName: "2 Octave D Scale Proficiency",
      subject: "Orchestra",
      status: "overdue",
      dueDate: "Aug 26",
      weight: 15,
      notes: "Submit before midnight to recover partial credit.",
      completed: false,
      grade: null,
    },
    {
      userId: user.id,
      courseName: "Neuroscience of Music Theory",
      subject: "Orchestra",
      status: "priority",
      dueDate: "Sep 28",
      weight: 10,
      notes: "Review Chapter 3 notes before starting.",
      completed: false,
      grade: null,
    },
    {
      userId: user.id,
      courseName: "Composition Analysis Exercise",
      subject: "Orchestra",
      status: "in progress",
      dueDate: "Today",
      weight: 20,
      notes: "Analyze the harmonic structure of Beethoven's 5th.",
      completed: false,
      grade: null,
    },
    {
      userId: user.id,
      courseName: "Theory Workbook Chapter 4",
      subject: "Orchestra",
      status: "pending",
      dueDate: "Tomorrow",
      weight: 5,
      notes: "Theory Workbook Ex. 4",
      completed: false,
      grade: null,
    },
    {
      userId: user.id,
      courseName: "AP Bio Research Phase",
      subject: "Biology",
      status: "pending",
      dueDate: "Mar 9",
      weight: 25,
      notes: "Due in 4 days.",
      completed: false,
      grade: null,
    },
    {
      userId: user.id,
      courseName: "Calculus Problem Set 7",
      subject: "Mathematics",
      status: "completed",
      dueDate: "Feb 20",
      weight: 10,
      completed: true,
      grade: 95,
      notes: null,
    },
    {
      userId: user.id,
      courseName: "English Literature Essay",
      subject: "English",
      status: "completed",
      dueDate: "Feb 15",
      weight: 15,
      completed: true,
      grade: 92,
      notes: null,
    },
    {
      userId: user.id,
      courseName: "History Research Paper",
      subject: "History",
      status: "completed",
      dueDate: "Feb 10",
      weight: 20,
      completed: true,
      grade: 98,
      notes: null,
    },
    {
      userId: user.id,
      courseName: "Physics Lab Report 3",
      subject: "Physics",
      status: "completed",
      dueDate: "Feb 5",
      weight: 10,
      completed: true,
      grade: 94,
      notes: null,
    },
    {
      userId: user.id,
      courseName: "Spanish Oral Presentation",
      subject: "Spanish",
      status: "completed",
      dueDate: "Jan 28",
      weight: 8,
      completed: true,
      grade: 96,
      notes: null,
    },
    {
      userId: user.id,
      courseName: "Art Portfolio Review",
      subject: "Art",
      status: "completed",
      dueDate: "Jan 20",
      weight: 12,
      completed: true,
      grade: 91,
      notes: null,
    },
    {
      userId: user.id,
      courseName: "Chemistry Midterm",
      subject: "Chemistry",
      status: "completed",
      dueDate: "Jan 15",
      weight: 25,
      completed: true,
      grade: 93,
      notes: null,
    },
    {
      userId: user.id,
      courseName: "PE Fitness Assessment",
      subject: "PE",
      status: "completed",
      dueDate: "Jan 10",
      weight: 5,
      completed: true,
      grade: 100,
      notes: null,
    },
  ];

  for (const a of assignmentData) {
    await storage.createAssignment(a);
  }
}
