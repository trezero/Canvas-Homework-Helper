import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Assignment, DashboardMetrics, PriorityItem, CanvasObservee, CanvasSyncResult } from "@shared/schema";
import { MetricCards } from "@/components/metric-cards";
import { DeadlinesTable } from "@/components/deadlines-table";
import { PriorityFocus } from "@/components/priority-focus";
import { SemesterProgress } from "@/components/semester-progress";
import { UserSettingsModal } from "@/components/user-settings-modal";
import { ObserverStudentPicker } from "@/components/observer-student-picker";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Settings, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [pendingObservees, setPendingObservees] = useState<CanvasObservee[]>([]);
  const { toast } = useToast();

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
    const matchesCourse = courseFilter === "all" || a.subject === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const isLoading = userLoading || assignmentsLoading || metricsLoading || prioritiesLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const isObserver = user?.accountType === "observer";
  const displayName = isObserver && user?.observedStudentName
    ? user.observedStudentName
    : user?.fullName || "Student";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <header className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-greeting">
              {greeting()},{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {isObserver ? user?.fullName || "Parent" : displayName}
              </span>
            </h1>
            {isObserver && user?.observedStudentName ? (
              <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2" data-testid="text-subtitle">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Viewing <span className="font-semibold text-foreground">{user.observedStudentName}</span>'s academic progress
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm" data-testid="text-subtitle">
                You've maintained an <span className="font-semibold text-foreground">Excellent</span> consistency rate this week.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {isObserver && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchStudentMutation.mutate()}
                disabled={switchStudentMutation.isPending}
                data-testid="button-switch-student"
              >
                <Users className="w-4 h-4 mr-2" />
                {switchStudentMutation.isPending ? "Loading..." : "Switch Student"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate(user?.observedStudentId || undefined)}
              disabled={syncMutation.isPending}
              data-testid="button-sync"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Update Records
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {metrics && <MetricCards metrics={metrics} />}

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          courseFilter={courseFilter}
          onCourseFilterChange={setCourseFilter}
          courses={courses}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mt-6">
          <div className="space-y-6">
            <DeadlinesTable
              assignments={filteredAssignments || []}
              priorityCount={priorities?.length || 0}
            />
          </div>
          <div className="space-y-6">
            {priorities && <PriorityFocus items={priorities} />}
            {metrics && <SemesterProgress progress={metrics.semesterProgress} />}
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-border/50 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground tracking-wider uppercase">
          <span data-testid="text-footer-version">Student Achievement Dashboard // V4.2 Professional</span>
          <div className="flex items-center gap-6">
            <span>Support Portal</span>
            <span>Data & Privacy</span>
            <button className="text-destructive font-medium" data-testid="button-sign-out">Sign Out</button>
          </div>
        </footer>
      </div>

      <UserSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
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
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-4 w-64" />
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
