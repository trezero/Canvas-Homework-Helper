import type { Assignment } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, BookOpen, Award, Clock, FileText, AlertTriangle } from "lucide-react";

function StatusBadgeLarge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    missing: {
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20",
      label: "Missing",
    },
    missing_available: {
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20",
      label: "Missing (Available)",
    },
    graded_late: {
      className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20",
      label: "Graded (Late)",
    },
    submitted_late: {
      className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/20",
      label: "Submitted (Late)",
    },
    graded_on_time: {
      className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20",
      label: "Graded",
    },
    submitted_pending_grade: {
      className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20",
      label: "Submitted — Awaiting Grade",
    },
    upcoming: {
      className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/20",
      label: "Upcoming",
    },
    no_status: {
      className: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/20",
      label: "No Status",
    },
  };

  const v = variants[status.toLowerCase()] || variants.no_status;

  return (
    <Badge variant="outline" className={`text-xs font-semibold px-3 py-1 ${v.className}`} data-testid="badge-detail-status">
      {v.label}
    </Badge>
  );
}

function formatDateTime(isoString: string | null): string | null {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function ScoreDisplay({ score, pointsPossible }: { score: number | null; pointsPossible: number | null }) {
  if (score == null || pointsPossible == null || pointsPossible === 0) return null;

  const pct = Math.round((score / pointsPossible) * 100);
  const color = pct >= 90 ? "text-emerald-600 dark:text-emerald-400"
    : pct >= 80 ? "text-blue-600 dark:text-blue-400"
      : pct >= 70 ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="bg-muted/50 rounded-lg p-4 text-center" data-testid="section-score">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">Score</p>
      <p className={`text-3xl font-bold ${color}`} data-testid="text-detail-score">
        {score}<span className="text-lg text-muted-foreground font-normal">/{pointsPossible}</span>
      </p>
      <p className={`text-sm font-medium mt-0.5 ${color}`} data-testid="text-detail-percentage">{pct}%</p>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-muted-foreground flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function AssignmentDetailModal({
  assignment,
  open,
  onOpenChange,
}: {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!assignment) return null;

  const submittedFormatted = formatDateTime(assignment.submittedAt);
  const gradedFormatted = formatDateTime(assignment.gradedAt);

  const typeLabel = assignment.assignmentType === "quiz" ? "Quiz"
    : assignment.assignmentType === "discussion" ? "Discussion"
      : assignment.assignmentType === "announcement" ? "Announcement"
        : "Assignment";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] gap-0" data-testid="modal-assignment-detail">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold leading-tight pr-4" data-testid="text-detail-title">
                {assignment.courseName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-detail-course">
                {assignment.subject}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <StatusBadgeLarge status={assignment.status} />
            {assignment.isLate && (
              <Badge variant="outline" className="text-xs font-medium bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
                Late
              </Badge>
            )}
            <Badge variant="outline" className="text-xs font-medium bg-muted text-muted-foreground">
              {typeLabel}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <div className="py-4 space-y-1">
          <ScoreDisplay score={assignment.score} pointsPossible={assignment.pointsPossible} />

          <DetailRow
            icon={<Calendar className="w-4 h-4" />}
            label="Due Date"
            value={assignment.dueDate}
          />
          <DetailRow
            icon={<Clock className="w-4 h-4" />}
            label="Submitted"
            value={submittedFormatted}
          />
          <DetailRow
            icon={<Award className="w-4 h-4" />}
            label="Graded"
            value={gradedFormatted}
          />
          <DetailRow
            icon={<BookOpen className="w-4 h-4" />}
            label="Points Possible"
            value={assignment.pointsPossible != null ? String(assignment.pointsPossible) : null}
          />

          {(assignment.status === "missing" || assignment.status === "missing_available") && (
            <div className="mt-3 flex items-start gap-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3.5 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">
                This assignment is marked as missing. Check with your teacher about late submission options.
              </p>
            </div>
          )}

          {assignment.notes && (
            <>
              <Separator className="my-2" />
              <DetailRow
                icon={<FileText className="w-4 h-4" />}
                label="Notes"
                value={assignment.notes}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
