import type { InsertAssignment, CanvasObservee } from "@shared/schema";
import { resolveAssignmentStatus } from "@shared/status-resolver";

export class CanvasClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
  }

  private async request(path: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json+canvas-string-ids",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Canvas API ${res.status}: ${text || res.statusText}`);
    }

    return res.json();
  }

  private async requestPaginated(path: string, params: Record<string, string> = {}): Promise<any[]> {
    const allResults: any[] = [];
    let url: string | null = `${this.baseUrl}/api/v1${path}`;
    const searchParams = new URLSearchParams(params);
    searchParams.set("per_page", "100");

    let page = 0;
    const maxPages = 10;

    while (url && page < maxPages) {
      const fullUrl = page === 0 ? `${url}?${searchParams.toString()}` : url;
      const res = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json+canvas-string-ids",
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Canvas API ${res.status}: ${text || res.statusText}`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        allResults.push(...data);
      }

      const linkHeader = res.headers.get("Link");
      url = this.parseNextLink(linkHeader);
      page++;
    }

    return allResults;
  }

  private parseNextLink(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    const parts = linkHeader.split(",");
    for (const part of parts) {
      const match = part.match(/<([^>]+)>;\s*rel="next"/);
      if (match) return match[1];
    }
    return null;
  }

  async getSelf(): Promise<any> {
    return this.request("/users/self", { "include[]": "email" });
  }

  async getObservees(): Promise<CanvasObservee[]> {
    try {
      return await this.requestPaginated("/users/self/observees");
    } catch {
      return [];
    }
  }

  async getCourses(enrollmentState = "active"): Promise<any[]> {
    return this.requestPaginated("/courses", {
      "enrollment_state": enrollmentState,
      "include[]": "total_scores",
    });
  }

  async getAssignmentsForCourse(courseId: string): Promise<any[]> {
    return this.requestPaginated(`/courses/${courseId}/assignments`, {
      "order_by": "due_at",
      "include[]": "submission",
    });
  }

  async getSubmissionsForStudent(courseId: string, studentId: string): Promise<any[]> {
    try {
      return await this.requestPaginated(
        `/courses/${courseId}/students/submissions`,
        {
          "student_ids[]": studentId,
          "include[]": "assignment",
        }
      );
    } catch {
      return [];
    }
  }

  async getEnrollments(): Promise<any[]> {
    return this.requestPaginated("/users/self/enrollments", {
      "state[]": "active",
    });
  }

  async detectAccountType(): Promise<"student" | "observer"> {
    const enrollments = await this.getEnrollments();
    const hasObserverEnrollment = enrollments.some(
      (e: any) => e.type === "ObserverEnrollment"
    );
    if (hasObserverEnrollment) {
      const observees = await this.getObservees();
      if (observees.length > 0) return "observer";
    }
    return "student";
  }

  private deriveAssignmentType(canvasAssignment: any): "assignment" | "quiz" | "discussion" | "announcement" | "other" {
    const types: string[] = canvasAssignment.submission_types || [];
    if (types.includes("online_quiz")) return "quiz";
    if (types.includes("discussion_topic")) return "discussion";
    if (canvasAssignment.is_quiz_assignment) return "quiz";
    if (types.length === 0) return "other";
    return "assignment";
  }

  private deriveFlags(
    submission: any,
    dueAt: Date | null,
    now: Date
  ): {
    status: string;
    completed: boolean;
    score: number | null;
    submittedAt: string | null;
    gradedAt: string | null;
    hasSubmission: boolean;
    isGraded: boolean;
    isMissing: boolean;
    isLate: boolean;
    hasReplies: boolean;
  } {
    let score: number | null = null;
    let submittedAt: string | null = null;
    let gradedAt: string | null = null;

    let hasSubmission = false;
    let isGraded = false;
    let isMissing = false;
    let isLate = false;
    let hasReplies = false;

    if (submission) {
      score = submission.score != null ? Number(submission.score) : null;
      submittedAt = submission.submitted_at || null;
      gradedAt = submission.graded_at || null;

      hasSubmission = !!(
        submission.submitted_at ||
        submission.workflow_state === "submitted" ||
        submission.workflow_state === "graded"
      );

      isGraded = !!(
        submission.workflow_state === "graded" &&
        submission.score != null
      );

      isMissing = !!submission.missing;

      isLate = !!submission.late;

      hasReplies = !!(
        (submission.discussion_entries && submission.discussion_entries.length > 0) ||
        (submission.submission_comments && submission.submission_comments.length > 0)
      );
    } else {
      if (dueAt && dueAt < now) {
        isMissing = true;
      }
    }

    const dueAtIsInFuture = dueAt ? dueAt > now : false;

    const resolved = resolveAssignmentStatus({
      hasSubmission,
      isGraded,
      isMissing,
      isLate,
      hasReplies,
      dueAtIsInFuture,
    });

    const completed = resolved.status === "graded_on_time" || resolved.status === "graded_late";

    return {
      status: resolved.status,
      completed,
      score,
      submittedAt,
      gradedAt,
      hasSubmission,
      isGraded,
      isMissing,
      isLate,
      hasReplies,
    };
  }

  async syncStudentData(userId: string, targetStudentId?: string): Promise<{
    assignments: InsertAssignment[];
    coursesCount: number;
    currentGrade: number | null;
  }> {
    const courses = await this.getCourses();

    const validCourses = courses.filter(
      (c: any) => c.id && c.name && c.workflow_state !== "deleted"
    );

    const allAssignments: InsertAssignment[] = [];
    let totalGradePoints = 0;
    let totalGradeCount = 0;

    for (const course of validCourses) {
      try {
        if (targetStudentId) {
          const submissions = await this.getSubmissionsForStudent(
            String(course.id),
            targetStudentId
          );

          for (const sub of submissions) {
            const ca = sub.assignment;
            if (!ca || !ca.name) continue;

            const dueAt = ca.due_at ? new Date(ca.due_at) : null;
            const now = new Date();

            const derived = this.deriveFlags(sub, dueAt, now);
            const assignmentType = this.deriveAssignmentType(ca);

            allAssignments.push({
              userId,
              courseName: ca.name,
              subject: course.name || "Unknown Course",
              status: derived.status,
              dueDate: dueAt ? formatDueDate(dueAt) : "No date",
              weight: ca.points_possible ? Number(ca.points_possible) : 0,
              completed: derived.completed,
              canvasAssignmentId: String(ca.id),
              grade: derived.score,
              pointsPossible: ca.points_possible ? Number(ca.points_possible) : null,
              score: derived.score,
              submittedAt: derived.submittedAt,
              gradedAt: derived.gradedAt,
              courseId: String(course.id),
              notes: null,
              assignmentType,
              hasSubmission: derived.hasSubmission,
              isGraded: derived.isGraded,
              isMissing: derived.isMissing,
              isLate: derived.isLate,
              hasReplies: derived.hasReplies,
            });

            if (sub.score != null && ca.points_possible) {
              totalGradePoints += (Number(sub.score) / Number(ca.points_possible)) * 100;
              totalGradeCount++;
            }
          }
        } else {
          const canvasAssignments = await this.getAssignmentsForCourse(String(course.id));

          const courseEnrollments = course.enrollments || [];
          for (const enrollment of courseEnrollments) {
            if (enrollment.computed_current_score != null) {
              totalGradePoints += enrollment.computed_current_score;
              totalGradeCount++;
            }
          }

          for (const ca of canvasAssignments) {
            if (!ca.name) continue;

            const submission = ca.submission;
            const dueAt = ca.due_at ? new Date(ca.due_at) : null;
            const now = new Date();

            const derived = this.deriveFlags(submission, dueAt, now);
            const assignmentType = this.deriveAssignmentType(ca);

            allAssignments.push({
              userId,
              courseName: ca.name,
              subject: course.name || "Unknown Course",
              status: derived.status,
              dueDate: dueAt ? formatDueDate(dueAt) : "No date",
              weight: ca.points_possible ? Number(ca.points_possible) : 0,
              completed: derived.completed,
              canvasAssignmentId: String(ca.id),
              grade: derived.score,
              pointsPossible: ca.points_possible ? Number(ca.points_possible) : null,
              score: derived.score,
              submittedAt: derived.submittedAt,
              gradedAt: derived.gradedAt,
              courseId: String(course.id),
              notes: null,
              assignmentType,
              hasSubmission: derived.hasSubmission,
              isGraded: derived.isGraded,
              isMissing: derived.isMissing,
              isLate: derived.isLate,
              hasReplies: derived.hasReplies,
            });
          }
        }
      } catch {
        continue;
      }
    }

    const currentGrade =
      totalGradeCount > 0
        ? Math.round((totalGradePoints / totalGradeCount) * 10) / 10
        : null;

    return {
      assignments: allAssignments,
      coursesCount: validCourses.length,
      currentGrade,
    };
  }
}

function formatDueDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diffDays <= 7)
    return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
