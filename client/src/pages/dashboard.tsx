import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Assignment, DashboardMetrics, PriorityItem, CanvasObservee, CanvasSyncResult, SavedFilter } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { MetricCards } from "@/components/metric-cards";
import { DeadlinesTable } from "@/components/deadlines-table";
import { PriorityFocus } from "@/components/priority-focus";
import { SemesterProgress } from "@/components/semester-progress";
import { UserSettingsModal } from "@/components/user-settings-modal";
import { ObserverStudentPicker } from "@/components/observer-student-picker";
import { SearchBar, type StatusFilter } from "@/components/search-bar";
import { SavedFiltersBar } from "@/components/saved-filters-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Settings, LogOut, GraduationCap, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hideLocked, setHideLocked] = useState(false);
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [pendingObservees, setPendingObservees] = useState<CanvasObservee[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [defaultApplied, setDefaultApplied] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const [firstTimeChecked, setFirstTimeChecked] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User & { hasCanvasToken?: boolean }>({
    queryKey: ["/api/user"],
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/metrics"],
  });

  const { data: priorities, isLoading: prioritiesLoading } = useQuery<PriorityItem[]>({
    queryKey: ["/api/priorities"],
  });

  const { data: savedFilters } = useQuery<SavedFilter[]>({
    queryKey: ["/api/saved-filters"],
  });

  useEffect(() => {
    if (firstTimeChecked || userLoading || !user) return;
    setFirstTimeChecked(true);
    if (!user.canvasConnected && !user.hasCanvasToken) {
      setSettingsOpen(true);
    }
  }, [user, userLoading, firstTimeChecked]);

  const applyFilter = useCallback((filter: SavedFilter) => {
    const f = filter.filters as { course?: string | string[]; status?: string[]; hideLocked?: boolean; searchQuery?: string };
    if (Array.isArray(f.course)) {
      setCourseFilter(f.course);
    } else {
      setCourseFilter(f.course ? [f.course] : []);
    }
    setStatusFilter((f.status?.[0] as StatusFilter) || "all");
    setHideLocked(f.hideLocked || false);
    setSearchQuery(f.searchQuery || "");
    setActiveFilterId(filter.id);
  }, []);

  useEffect(() => {
    if (defaultApplied || !savedFilters) return;
    const defaultFilter = savedFilters.find((f) => f.isDefault);
    if (defaultFilter) {
      applyFilter(defaultFilter);
    }
    setDefaultApplied(true);
  }, [savedFilters, defaultApplied, applyFilter]);

  const currentFilterState = {
    course: courseFilter.length > 0 ? courseFilter : undefined,
    status: statusFilter !== "all" ? [statusFilter] : undefined,
    hideLocked: hideLocked || undefined,
    searchQuery: searchQuery || undefined,
  };

  const hasActiveFilters = courseFilter.length > 0 || statusFilter !== "all" || hideLocked || searchQuery !== "";

  const saveFilterMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/saved-filters", {
        userId: user?.id,
        name,
        filters: currentFilterState,
        isDefault: false,
      });
      return res.json() as Promise<SavedFilter>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-filters"] });
      setActiveFilterId(data.id);
      toast({ title: "View saved", description: `"${data.name}" has been saved.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save filter.", variant: "destructive" });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/saved-filters/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-filters"] });
      if (activeFilterId === id) setActiveFilterId(null);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/saved-filters/${id}/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-filters"] });
      toast({ title: "Default view set", description: "This view will load when you open the app." });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (observedStudentId?: string) => {
      const body = observedStudentId ? { observedStudentId } : {};
      const res = await apiRequest("POST", "/api/canvas/sync", body);
      return res.json() as Promise<CanvasSyncResult & { needsStudentSelection?: boolean }>;
    },
    onSuccess: (data) => {
      if (data.needsStudentSelection && data.observees) {
        setPendingObservees(data.observees);
        setStudentPickerOpen(true);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/priorities"] });
      toast({
        title: "Records updated",
        description: data.message || "Your Canvas data has been synced.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  const switchStudentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/canvas/observees");
      if (!res.ok) throw new Error("Failed to load linked students.");
      return res.json() as Promise<CanvasObservee[]>;
    },
    onSuccess: (observees) => {
      if (observees.length === 0) {
        toast({ title: "No students found", description: "No linked students on this account.", variant: "destructive" });
        return;
      }
      if (observees.length === 1) {
        syncMutation.mutate(String(observees[0].id));
        return;
      }
      setPendingObservees(observees);
      setStudentPickerOpen(true);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleStudentSelected = (studentId: string) => {
    setStudentPickerOpen(false);
    syncMutation.mutate(studentId);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const courses = assignments
    ? [...new Set(assignments.map((a) => a.subject))]
    : [];

  const filteredAssignments = assignments?.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCourse = courseFilter.length === 0 || courseFilter.includes(a.subject);
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "missing" ? (a.status === "missing" || a.status === "missing_available") : a.status === statusFilter);
    const matchesLocked = !hideLocked || (a.status !== "graded_on_time" && a.status !== "graded_late");
    return matchesSearch && matchesCourse && matchesStatus && matchesLocked;
  });

  const isLoading = userLoading || assignmentsLoading || metricsLoading || prioritiesLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const isObserver = user?.accountType === "observer";
  const firstName = (name: string) => name.split(" ")[0];
  const displayName = user?.fullName || authUser?.firstName || "Student";
  const greetingName = isObserver
    ? firstName(displayName || "Parent")
    : firstName(displayName || "Student");

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-greeting">
                {greeting()},{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  {greetingName}
                </span>
              </h1>
              {!(isObserver && user?.observedStudentName) && (
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm" data-testid="text-subtitle">
                  {metrics && metrics.missingCount === 0
                    ? "All assignments are on track — keep it up!"
                    : metrics && metrics.averageScore != null && metrics.averageScore >= 85
                      ? `${metrics.missingCount} assignment${metrics.missingCount !== 1 ? "s" : ""} to catch up on`
                      : "Here's your progress at a glance."}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate(user?.observedStudentId || undefined)}
                disabled={syncMutation.isPending}
                data-testid="button-sync"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Update Records</span>
                <span className="sm:hidden">Sync</span>
              </Button>
              <ThemeToggle />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setSettingsOpen(true)}
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isObserver && user?.observedStudentName && (
            <div
              className="flex items-center gap-3 sm:gap-4 rounded-xl border border-border/60 bg-card/80 px-4 py-3"
              data-testid="text-subtitle"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Viewing Profile
                </p>
                <p className="text-sm sm:text-base font-semibold truncate mt-0.5">
                  {user.observedStudentName}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 gap-1.5"
                onClick={() => switchStudentMutation.mutate()}
                disabled={switchStudentMutation.isPending}
                data-testid="button-switch-student"
              >
                {switchStudentMutation.isPending ? "Loading..." : "Switch"}
                <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </div>
          )}
        </header>

        {metrics && <MetricCards metrics={metrics} />}

        <SavedFiltersBar
          savedFilters={savedFilters || []}
          activeFilterId={activeFilterId}
          onApply={applyFilter}
          onSave={(name) => saveFilterMutation.mutate(name)}
          onDelete={(id) => deleteFilterMutation.mutate(id)}
          onSetDefault={(id) => setDefaultMutation.mutate(id)}
          hasActiveFilters={hasActiveFilters}
          isSaving={saveFilterMutation.isPending}
        />

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); setActiveFilterId(null); }}
          courseFilter={courseFilter}
          onCourseFilterChange={(val: string[]) => { setCourseFilter(val); setActiveFilterId(null); }}
          courses={courses}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => { setStatusFilter(val); setActiveFilterId(null); }}
          hideLocked={hideLocked}
          onHideLockedChange={(val) => { setHideLocked(val); setActiveFilterId(null); }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mt-6">
          <div className="space-y-6">
            <DeadlinesTable
              assignments={filteredAssignments || []}
              totalCount={assignments?.length || 0}
              priorityCount={priorities?.length || 0}
            />
          </div>
          <div className="space-y-6">
            {priorities && <PriorityFocus items={priorities} />}
            {metrics && <SemesterProgress progress={metrics.semesterProgress} />}
          </div>
        </div>

        <footer className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-muted-foreground tracking-wider uppercase">
          <span data-testid="text-footer-version" className="text-center sm:text-left">Canvas Homework Helper // V4.2 Professional</span>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden sm:inline">Support Portal</span>
            <span className="hidden sm:inline">Data & Privacy</span>
            <a href="/api/logout" className="text-destructive font-medium flex items-center gap-1" data-testid="button-sign-out">
              <LogOut className="w-3 h-3" />
              Sign Out
            </a>
          </div>
        </footer>
      </div>

      <UserSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
        onCanvasSettingsSaved={() => {
          syncMutation.mutate(user?.observedStudentId || undefined);
        }}
      />

      <ObserverStudentPicker
        open={studentPickerOpen}
        onOpenChange={setStudentPickerOpen}
        observees={pendingObservees}
        onStudentSelected={handleStudentSelected}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-8 sm:h-10 w-64 sm:w-80 mb-2" />
          <Skeleton className="h-4 w-48 sm:w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-12 w-full mb-6 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-52 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
