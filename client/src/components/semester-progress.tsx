import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function SemesterProgress({ progress }: { progress: number }) {
  return (
    <Card className="p-5 bg-gradient-to-br from-card to-background" data-testid="card-semester-progress">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Academic Milestone
        </span>
        <span className="text-lg font-bold text-emerald-400">{progress}%</span>
      </div>
      <h3 className="font-semibold text-lg mb-3">Semester Progress</h3>
      <Progress value={progress} className="h-2 mb-3" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        Maintain your current <span className="text-blue-400 font-medium">4.0 streak</span> to reach Honors Platinum status by the end of November.
      </p>
    </Card>
  );
}
