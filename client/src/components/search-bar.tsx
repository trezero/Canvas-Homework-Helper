import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchBarProps = {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  courseFilter: string;
  onCourseFilterChange: (val: string) => void;
  courses: string[];
};

export function SearchBar({
  searchQuery,
  onSearchChange,
  courseFilter,
  onCourseFilterChange,
  courses,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
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
      <Button size="icon" variant="outline" data-testid="button-filter">
        <SlidersHorizontal className="w-4 h-4" />
      </Button>
    </div>
  );
}
