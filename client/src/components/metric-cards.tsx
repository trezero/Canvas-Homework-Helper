import type { DashboardMetrics } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, CheckSquare, TrendingUp } from "lucide-react";

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-5 relative" data-testid="card-completion-rate">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Completion Rate
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{metrics.completionRate}%</span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            +{metrics.completionRateChange}%
          </span>
        </div>
      </Card>

      <Card className="p-5 relative" data-testid="card-streak">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            On-Time Streak
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{metrics.onTimeStreak}</span>
          <span className="text-sm text-muted-foreground">Days</span>
        </div>
      </Card>

      <Card className="p-5 relative" data-testid="card-total-tasks">
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Total Tasks Done
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{metrics.totalTasksDone}</span>
          <span className="text-sm text-muted-foreground">This Semester</span>
        </div>
      </Card>

      <Card className="p-5 relative bg-gradient-to-br from-blue-600 to-purple-600 border-0 text-white" data-testid="card-standing">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-white/80" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-white/70">
            Current Standing
          </span>
        </div>
        <div>
          <span className="text-xl font-bold">{metrics.currentStanding}</span>
          <p className="text-xs text-white/60 mt-0.5">{metrics.standingDetail}</p>
        </div>
      </Card>
    </div>
  );
}
