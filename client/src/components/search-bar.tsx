import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type StatusFilter = "all" | "missing" | "submitted_late" | "graded_late" | "graded_on_time" | "submitted_pending_grade" | "upcoming" | "no_status";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "missing", label: "Missing" },
  { value: "submitted_late", label: "Submitted (Late)" },
  { value: "graded_late", label: "Graded (Late)" },
  { value: "graded_on_time", label: "Graded" },
  { value: "submitted_pending_grade", label: "Submitted" },
  { value: "upcoming", label: "Upcoming" },
];

type SearchBarProps = {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  courseFilter: string[];
  onCourseFilterChange: (val: string[]) => void;
  courses: string[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (val: StatusFilter) => void;
  hideLocked: boolean;
  onHideLockedChange: (val: boolean) => void;
};

function CourseMultiSelect({
  selected,
  onChange,
  courses,
}: {
  selected: string[];
  onChange: (val: string[]) => void;
  courses: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleCourse = (course: string) => {
    if (selected.includes(course)) {
      onChange(selected.filter((c) => c !== course));
    } else {
      onChange([...selected, course]);
    }
  };

  const label =
    selected.length === 0
      ? "All Courses"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} courses`;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-[200px] justify-between bg-card border-card-border font-normal h-9 px-3"
        data-testid="select-course-filter"
      >
        <span className="truncate text-sm">{label}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-[240px] rounded-md border border-border bg-popover p-1 shadow-md max-h-[280px] overflow-y-auto">
          <button
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onChange([]);
              setOpen(false);
            }}
            data-testid="option-course-all"
          >
            <span className={`mr-2 flex h-4 w-4 items-center justify-center ${selected.length === 0 ? "opacity-100" : "opacity-0"}`}>
              <Check className="h-4 w-4" />
            </span>
            All Courses
          </button>
          {courses.map((course) => {
            const isSelected = selected.includes(course);
            return (
              <button
                key={course}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => toggleCourse(course)}
                data-testid={`option-course-${course}`}
              >
                <span className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span className="truncate">{course}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  if (courseFilter.length > 0) {
    if (courseFilter.length === 1) {
      activeFilters.push({
        key: "course",
        label: `Course: ${courseFilter[0]}`,
        onRemove: () => onCourseFilterChange([]),
      });
    } else {
      courseFilter.forEach((c) => {
        activeFilters.push({
          key: `course-${c}`,
          label: c,
          onRemove: () => onCourseFilterChange(courseFilter.filter((x) => x !== c)),
        });
      });
    }
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
      label: "Hiding graded",
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
        <CourseMultiSelect
          selected={courseFilter}
          onChange={onCourseFilterChange}
          courses={courses}
        />
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
            Hide graded
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
                onCourseFilterChange([]);
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
