import type { PriorityItem } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const typeStyles: Record<string, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500 dark:bg-red-400", label: "CRITICAL ACTION" },
  standard: { dot: "bg-blue-500 dark:bg-blue-400", label: "STANDARD TASK" },
  upcoming: { dot: "bg-slate-400 dark:bg-slate-400", label: "COMING UP" },
};

export function PriorityFocus({ items }: { items: PriorityItem[] }) {
  return (
    <Card className="p-5" data-testid="card-priority-focus">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        <h3 className="font-semibold">Priority Focus</h3>
      </div>
      <div className="space-y-5">
        {items.map((item, index) => {
          const style = typeStyles[item.type] || typeStyles.upcoming;
          return (
            <div key={index} className="flex gap-3" data-testid={`priority-item-${index}`}>
              <div className="flex flex-col items-center pt-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                {index < items.length - 1 && (
                  <div className="w-px flex-1 bg-border/50 mt-1.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  {style.label}
                </span>
                <h4 className="font-medium text-sm mt-0.5">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
