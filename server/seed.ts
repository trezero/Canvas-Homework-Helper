import { storage } from "./storage";
import { db } from "./db";
import { users, assignments } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedAssignments(userId: string) {
  const assignmentData = [
    {
      userId,
      courseName: "2 Octave D Scale Proficiency",
      subject: "Orchestra",
      status: "missing",
      dueDate: "Aug 26",
      weight: 15,
      notes: "Submit before midnight to recover partial credit.",
      completed: false,
      grade: null,
      pointsPossible: 100,
      score: null,
      submittedAt: null,
      gradedAt: null,
      courseId: null,
      canvasAssignmentId: null,
      assignmentType: "assignment",
      hasSubmission: false,
      isGraded: false,
      isMissing: true,
      isLate: false,
      hasReplies: false,
    },
  ];

  for (const assignment of assignmentData) {
    await storage.createAssignment(assignment);
  }
}
