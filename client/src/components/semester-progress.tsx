import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function SemesterProgress({ progress }: { progress: number }) {
  const message = progress >= 80
    ? "Almost there — finish strong this semester!"
    : progress >= 50
    ? "Over halfway through — stay consistent."
    : "The semester is just getting started.";

  return (
    <Card className="p-5 bg-gradient-to-br from-card to-background" data-testid="card-semester-progress">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Semester Timeline
        </span>
        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
      </div>
      <h3 className="font-semibold text-lg mb-3">Semester Progress</h3>
      <Progress value={progress} className="h-2 mb-3" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        {message}
      </p>
    </Card>
  );
}
