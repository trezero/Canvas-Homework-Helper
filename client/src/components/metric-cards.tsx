import type { DashboardMetrics } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, TrendingUp, BookOpen } from "lucide-react";

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const scoreColor = metrics.averageScore != null
    ? metrics.averageScore >= 90 ? "text-emerald-600 dark:text-emerald-400"
    : metrics.averageScore >= 80 ? "text-blue-600 dark:text-blue-400"
    : metrics.averageScore >= 70 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400"
    : "text-muted-foreground";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-5 relative" data-testid="card-graded">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Graded
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold" data-testid="text-graded-count">{metrics.gradedCount}</span>
          <span className="text-sm text-muted-foreground">of {metrics.totalCount}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {metrics.totalCount > 0
            ? `${Math.round((metrics.gradedCount / metrics.totalCount) * 100)}% complete`
            : "No assignments yet"}
        </p>
      </Card>

      <Card className="p-5 relative" data-testid="card-average-score">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Average Score
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${scoreColor}`} data-testid="text-average-score">
            {metrics.averageScore != null ? `${metrics.averageScore}%` : "—"}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {metrics.averageScore != null && metrics.averageScore >= 90
            ? "Excellent work — keep it up!"
            : metrics.averageScore != null && metrics.averageScore >= 80
            ? "Solid progress — you're doing well"
            : metrics.averageScore != null
            ? "Room to improve — stay focused"
            : "No scores yet"}
        </p>
      </Card>

      <Card className={`p-5 relative ${metrics.missingCount > 0 ? "" : ""}`} data-testid="card-missing">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className={`w-4 h-4 ${metrics.missingCount > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"}`} />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Needs Attention
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${metrics.missingCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`} data-testid="text-missing-count">
            {metrics.missingCount}
          </span>
          <span className="text-sm text-muted-foreground">missing</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {metrics.missingCount === 0
            ? "All caught up — great job!"
            : metrics.pendingGradeCount > 0
            ? `${metrics.pendingGradeCount} more awaiting grades`
            : "Check the table below for details"}
        </p>
      </Card>

      <Card
        className={`p-5 relative ${
          metrics.focusCourse
            ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 border-amber-200/50 dark:border-amber-500/20"
            : "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 dark:from-emerald-500/5 dark:to-cyan-500/5 border-emerald-200/50 dark:border-emerald-500/20"
        }`}
        data-testid="card-focus-course"
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className={`w-4 h-4 ${metrics.focusCourse ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            {metrics.focusCourse ? "Course to Focus On" : "All Courses Strong"}
          </span>
        </div>
        <div>
          <span className="text-base font-bold leading-tight line-clamp-2" data-testid="text-focus-course">
            {metrics.focusCourse || "You're on track!"}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1.5" data-testid="text-focus-reason">
            {metrics.focusCourseReason || "No courses need extra attention right now"}
          </p>
        </div>
      </Card>
    </div>
  );
}
