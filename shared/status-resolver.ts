import type { AssignmentStatusEnum, AssignmentFlags } from "./schema";

export type StatusResolverInput = AssignmentFlags & {
  dueAtIsInFuture: boolean;
};

export type StatusResolverOutput = {
  status: AssignmentStatusEnum;
  flags: AssignmentFlags;
};

export function resolveAssignmentStatus(input: StatusResolverInput): StatusResolverOutput {
  const { hasSubmission, isGraded, isMissing, isLate, hasReplies, dueAtIsInFuture } = input;

  const flags: AssignmentFlags = { hasSubmission, isGraded, isMissing, isLate, hasReplies };

  let status: AssignmentStatusEnum;

  if (isMissing && !hasSubmission) {
    status = "missing";
  } else if (hasSubmission && isLate && isGraded) {
    status = "graded_late";
  } else if (hasSubmission && isLate && !isGraded) {
    status = "submitted_late";
  } else if (hasSubmission && !isLate && isGraded) {
    status = "graded_on_time";
  } else if (hasSubmission && !isLate && !isGraded) {
    status = "submitted_pending_grade";
  } else if (!hasSubmission && !isMissing && dueAtIsInFuture) {
    status = "upcoming";
  } else {
    status = "no_status";
  }

  return { status, flags };
}
