import { useState, useMemo } from "react";
import type { Assignment } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignmentDetailModal } from "@/components/assignment-detail-modal";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, List, LayoutGrid, ChevronDown, ChevronUp } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    missing: {
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20",
      label: "MISSING",
    },
    graded_late: {
      className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20",
      label: "GRADED (LATE)",
    },
    submitted_late: {
      className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/20",
      label: "SUBMITTED (LATE)",
    },
    graded_on_time: {
      className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20",
      label: "GRADED",
    },
    submitted_pending_grade: {
      className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20",
      label: "SUBMITTED",
    },
    upcoming: {
      className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/20",
      label: "UPCOMING",
    },
    no_status: {
      className: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/20",
      label: "\u2014",
    },
  };

  const v = variants[status.toLowerCase()] || variants.no_status;

  return (
    <Badge variant="outline" className={`text-[10px] font-semibold tracking-wider ${v.className} no-default-active-elevate`}>
      {v.label}
    </Badge>
  );
}

function SecondaryBadges({ assignment }: { assignment: Assignment }) {
  return (
    <>
      {assignment.isLate && (
        <Badge variant="outline" className="text-[9px] font-medium tracking-wider bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 no-default-active-elevate" data-testid={`badge-late-${assignment.id}`}>
          Late
        </Badge>
      )}
      {assignment.hasReplies && (
        <Badge variant="outline" className="text-[9px] font-medium tracking-wider bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 no-default-active-elevate" data-testid={`badge-replied-${assignment.id}`}>
          Replied
        </Badge>
      )}
      {assignment.isGraded && assignment.score != null && assignment.pointsPossible != null && (
        <Badge variant="outline" className="text-[9px] font-medium tracking-wider bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 no-default-active-elevate" data-testid={`badge-score-${assignment.id}`}>
          {assignment.score}/{assignment.pointsPossible}
        </Badge>
      )}
    </>
  );
}

type SortField = "courseName" | "subject" | "status" | "dueDate" | "score" | "weight";
type SortDirection = "asc" | "desc";
type ViewMode = "list" | "grouped";

const PAGE_SIZE = 15;

const statusOrder: Record<string, number> = {
  missing: 0,
  submitted_late: 1,
  graded_late: 2,
  submitted_pending_grade: 3,
  upcoming: 4,
  graded_on_time: 5,
  no_status: 6,
};

function parseDateForSort(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? Infinity : d.getTime();
}

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField | null; sortDirection: SortDirection }) {
  if (sortField !== field) {
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  }
  return sortDirection === "asc"
    ? <ArrowUp className="w-3 h-3 ml-1" />
    : <ArrowDown className="w-3 h-3 ml-1" />;
}

type CourseGroup = {
  subject: string;
  assignments: Assignment[];
  overdue: number;
  completed: number;
  total: number;
  avgScore: number | null;
};

function CourseGroupedView({ assignments, onSelect }: { assignments: Assignment[]; onSelect: (a: Assignment) => void }) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    assignments.forEach((a) => {
      const list = map.get(a.subject) || [];
      list.push(a);
      map.set(a.subject, list);
    });

    const result: CourseGroup[] = [];
    map.forEach((items, subject) => {
      const overdue = items.filter((a) => a.status === "missing").length;
      const completed = items.filter((a) => a.status === "graded_on_time" || a.status === "graded_late").length;
      const scored = items.filter((a) => a.score != null && a.pointsPossible != null && a.pointsPossible > 0);
      const avgScore = scored.length > 0
        ? Math.round(scored.reduce((acc, a) => acc + ((a.score! / a.pointsPossible!) * 100), 0) / scored.length)
        : null;

      result.push({ subject, assignments: items, overdue, completed, total: items.length, avgScore });
    });

    return result.sort((a, b) => b.overdue - a.overdue || a.subject.localeCompare(b.subject));
  }, [assignments]);

  const toggle = (subject: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedCourses.has(group.subject);
        return (
          <Card key={group.subject} className="p-0 overflow-hidden" data-testid={`course-group-${group.subject}`}>
            <button
              className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              onClick={() => toggle(group.subject)}
              data-testid={`button-toggle-course-${group.subject}`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{group.subject}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">{group.total} assignments</span>
                  {group.overdue > 0 && (
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">{group.overdue} missing</span>
                  )}
                  <span className="text-xs text-muted-foreground">{group.completed} completed</span>
                  {group.avgScore !== null && (
                    <span className={`text-xs font-medium ${group.avgScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : group.avgScore >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                      avg {group.avgScore}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {group.overdue > 0 && (
                  <Badge variant="outline" className="text-[10px] font-semibold tracking-wider bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20 no-default-active-elevate">
                    {group.overdue}
                  </Badge>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            {isExpanded && (
              <div className="border-t border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Assignment</th>
                      <th className="text-left py-2 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Due Date</th>
                      <th className="text-right py-2 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Score</th>
                      <th className="text-right py-2 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.assignments.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-border/20 last:border-0 hover-elevate cursor-pointer"
                        onClick={() => onSelect(a)}
                        data-testid={`row-grouped-assignment-${a.id}`}
                      >
                        <td className="py-2.5 px-4 font-medium text-sm">{a.courseName}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusBadge status={a.status} />
                            <SecondaryBadges assignment={a} />
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground text-sm">{a.dueDate}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-sm">
                          {a.score != null && a.pointsPossible != null
                            ? `${a.score}/${a.pointsPossible}`
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-sm">{a.weight}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}
      {groups.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">No assignments found.</Card>
      )}
    </div>
  );
}

export function DeadlinesTable({
  assignments,
  totalCount,
  priorityCount,
}: {
  assignments: Assignment[];
  totalCount: number;
  priorityCount: number;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDetailOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(0);
  };

  const sorted = useMemo(() => {
    if (!sortField) return assignments;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...assignments].sort((a, b) => {
      switch (sortField) {
        case "courseName":
          return dir * a.courseName.localeCompare(b.courseName);
        case "subject":
          return dir * a.subject.localeCompare(b.subject);
        case "status": {
          const aOrder = statusOrder[a.status.toLowerCase()] ?? 3;
          const bOrder = statusOrder[b.status.toLowerCase()] ?? 3;
          return dir * (aOrder - bOrder);
        }
        case "dueDate":
          return dir * (parseDateForSort(a.dueDate) - parseDateForSort(b.dueDate));
        case "score": {
          const aScore = a.score ?? -1;
          const bScore = b.score ?? -1;
          return dir * (aScore - bScore);
        }
        case "weight":
          return dir * (a.weight - b.weight);
        default:
          return 0;
      }
    });
  }, [assignments, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const paged = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const thClass = "text-left py-3 px-4 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground cursor-pointer select-none";

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold" data-testid="text-deadlines-title">All Assignments</h2>
          <span className="text-xs text-muted-foreground" data-testid="text-assignment-count">
            {assignments.length === totalCount
              ? `${totalCount} total`
              : `${assignments.length} of ${totalCount} shown`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {priorityCount > 0 && (
            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 no-default-active-elevate">
              {priorityCount} PRIORITY ITEMS
            </Badge>
          )}
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <Button
              size="icon"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              className="h-7 w-7 rounded-none"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === "grouped" ? "secondary" : "ghost"}
              className="h-7 w-7 rounded-none"
              onClick={() => setViewMode("grouped")}
              data-testid="button-view-grouped"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "grouped" ? (
        <CourseGroupedView assignments={assignments} onSelect={openDetail} />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className={thClass} onClick={() => handleSort("courseName")} data-testid="header-sort-course">
                    <span className="inline-flex items-center">
                      Course Assignment
                      <SortIcon field="courseName" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => handleSort("subject")} data-testid="header-sort-subject">
                    <span className="inline-flex items-center">
                      Subject
                      <SortIcon field="subject" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => handleSort("status")} data-testid="header-sort-status">
                    <span className="inline-flex items-center">
                      Status
                      <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => handleSort("dueDate")} data-testid="header-sort-due-date">
                    <span className="inline-flex items-center">
                      Due Date
                      <SortIcon field="dueDate" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort("score")} data-testid="header-sort-score">
                    <span className="inline-flex items-center justify-end w-full">
                      Score
                      <SortIcon field="score" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort("weight")} data-testid="header-sort-weight">
                    <span className="inline-flex items-center justify-end w-full">
                      Weight
                      <SortIcon field="weight" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-b border-border/30 last:border-0 hover-elevate cursor-pointer"
                    onClick={() => openDetail(assignment)}
                    data-testid={`row-assignment-${assignment.id}`}
                  >
                    <td className="py-3.5 px-4 font-medium" data-testid={`text-assignment-name-${assignment.id}`}>
                      {assignment.courseName}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {assignment.subject}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={assignment.status} />
                        <SecondaryBadges assignment={assignment} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {assignment.dueDate}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium" data-testid={`text-score-${assignment.id}`}>
                      {assignment.score != null && assignment.pointsPossible != null
                        ? `${assignment.score}/${assignment.pointsPossible}`
                        : assignment.score != null
                          ? `${assignment.score}`
                          : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {assignment.weight}%
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border/30">
              <span className="text-xs text-muted-foreground" data-testid="text-page-info">
                Page {safePage + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={safePage === 0}
                  onClick={() => setCurrentPage(safePage - 1)}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setCurrentPage(safePage + 1)}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <AssignmentDetailModal
        assignment={selectedAssignment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
