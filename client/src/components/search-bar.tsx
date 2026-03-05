import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type StatusFilter = "all" | "overdue" | "pending" | "in progress" | "priority" | "completed";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "priority", label: "Priority" },
  { value: "in progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

type SearchBarProps = {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  courseFilter: string;
  onCourseFilterChange: (val: string) => void;
  courses: string[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (val: StatusFilter) => void;
  hideLocked: boolean;
  onHideLockedChange: (val: boolean) => void;
};

export function SearchBar({
  searchQuery,
  onSearchChange,
  courseFilter,
  onCourseFilterChange,
  courses,
  statusFilter,
  onStatusFilterChange,
  hideLocked,
  onHideLockedChange,
}: SearchBarProps) {
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];

  if (searchQuery) {
    activeFilters.push({
      key: "search",
      label: `Search: "${searchQuery}"`,
      onRemove: () => onSearchChange(""),
    });
  }
  if (courseFilter !== "all") {
    activeFilters.push({
      key: "course",
      label: `Course: ${courseFilter}`,
      onRemove: () => onCourseFilterChange("all"),
    });
  }
  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`,
      onRemove: () => onStatusFilterChange("all"),
    });
  }
  if (hideLocked) {
    activeFilters.push({
      key: "locked",
      label: "Hiding completed",
      onRemove: () => onHideLockedChange(false),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assignments, topics, or faculty..."
            className="pl-10 bg-card border-card-border"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <Select value={courseFilter} onValueChange={onCourseFilterChange}>
          <SelectTrigger className="w-[200px] bg-card border-card-border" data-testid="select-course-filter">
            <SelectValue placeholder="All Academic Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Academic Courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(val) => onStatusFilterChange(val as StatusFilter)}>
          <SelectTrigger className="w-[160px] bg-card border-card-border" data-testid="select-status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            id="hide-locked"
            checked={hideLocked}
            onCheckedChange={onHideLockedChange}
            data-testid="switch-hide-locked"
          />
          <Label htmlFor="hide-locked" className="text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
            Hide completed
          </Label>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Active filters:</span>
          {activeFilters.map((f) => (
            <Badge
              key={f.key}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={f.onRemove}
              data-testid={`chip-filter-${f.key}`}
            >
              {f.label}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                onSearchChange("");
                onCourseFilterChange("all");
                onStatusFilterChange("all");
                onHideLockedChange(false);
              }}
              data-testid="button-clear-all-filters"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
