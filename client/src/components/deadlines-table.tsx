import type { Assignment } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    overdue: { className: "bg-red-500/15 text-red-400 border-red-500/20", label: "OVERDUE" },
    priority: { className: "bg-orange-500/15 text-orange-400 border-orange-500/20", label: "PRIORITY" },
    "in progress": { className: "bg-blue-500/15 text-blue-400 border-blue-500/20", label: "IN PROGRESS" },
    pending: { className: "bg-slate-500/15 text-slate-400 border-slate-500/20", label: "PENDING" },
    completed: { className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", label: "COMPLETED" },
  };

  const v = variants[status.toLowerCase()] || variants.pending;

  return (
    <Badge variant="outline" className={`text-[10px] font-semibold tracking-wider ${v.className} no-default-active-elevate`}>
      {v.label}
    </Badge>
  );
}

export function DeadlinesTable({
  assignments,
  priorityCount,
}: {
  assignments: Assignment[];
  priorityCount: number;
}) {
  const upcoming = assignments.filter((a) => !a.completed).slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-deadlines-title">Upcoming Deadlines</h2>
        {priorityCount > 0 && (
          <Badge variant="outline" className="text-[10px] font-semibold tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/20 no-default-active-elevate">
            {priorityCount} PRIORITY ITEMS
          </Badge>
        )}
      </div>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Course Assignment
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Subject
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Due Date
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="border-b border-border/30 last:border-0 hover-elevate"
                  data-testid={`row-assignment-${assignment.id}`}
                >
                  <td className="py-3.5 px-4 font-medium" data-testid={`text-assignment-name-${assignment.id}`}>
                    {assignment.courseName}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {assignment.subject}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={assignment.status} />
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {assignment.dueDate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">
                    {assignment.weight}%
                  </td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No upcoming assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {assignments.filter((a) => !a.completed).length > 8 && (
          <div className="py-3 text-center border-t border-border/30">
            <button className="text-xs font-semibold tracking-widest uppercase text-muted-foreground" data-testid="button-view-all">
              View All Assignments
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
