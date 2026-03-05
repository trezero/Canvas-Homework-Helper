import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, CanvasObservee } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User as UserIcon,
  Sparkles,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";

type UserLike = User & { hasCanvasToken?: boolean };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserLike | undefined;
};

type TestResult = {
  success: boolean;
  canvasUser?: { id: string; name: string; email: string | null };
  accountType?: "student" | "observer";
  observees?: CanvasObservee[];
  message?: string;
};

export function UserSettingsModal({ open, onOpenChange, user }: Props) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolAffiliation, setSchoolAffiliation] = useState("");
  const [canvasBaseUrl, setCanvasBaseUrl] = useState("");
  const [canvasApiToken, setCanvasApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setSchoolAffiliation(user.schoolAffiliation || "");
      setCanvasBaseUrl(user.canvasBaseUrl || "");
      setCanvasApiToken(user.canvasApiToken || "");
      setTestResult(null);
    }
  }, [user]);

  const testMutation = useMutation({
    mutationFn: async () => {
      const token = canvasApiToken === "••••••••••••••••" ? "" : canvasApiToken;
      if (!token) {
        throw new Error("Please enter a new Canvas API token to test the connection.");
      }
      const res = await apiRequest("POST", "/api/canvas/test", {
        canvasBaseUrl,
        canvasApiToken: token,
      });
      return res.json() as Promise<TestResult>;
    },
    onSuccess: (data) => {
      setTestResult(data);
      if (data.success) {
        toast({
          title: "Connection successful",
          description: `Connected as ${data.canvasUser?.name} (${data.accountType} account)`,
        });
      }
    },
    onError: (err: Error) => {
      setTestResult({ success: false, message: err.message });
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        fullName,
        email,
        schoolAffiliation,
        canvasBaseUrl,
      };
      if (canvasApiToken && canvasApiToken !== "••••••••••••••••") {
        payload.canvasApiToken = canvasApiToken;
      }
      if (testResult?.accountType) {
        payload.accountType = testResult.accountType;
      }
      await apiRequest("PATCH", "/api/user", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Settings saved", description: "Your profile has been updated." });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "S";

  const isConnected = user?.canvasConnected;
  const accountType = testResult?.accountType || user?.accountType || "student";
  const tokenChanged = canvasApiToken !== "••••••••••••••••" && canvasApiToken !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card border-card-border p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-semibold">User Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Manage your profile and external integrations.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6 mt-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold tracking-widest uppercase text-blue-400">
                Profile Settings
              </span>
            </div>

            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                  {initials}
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                    Full Name
                  </Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-background/50"
                    data-testid="input-full-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                    Email Address
                  </Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                School Affiliation
              </Label>
              <Input
                value={schoolAffiliation}
                onChange={(e) => setSchoolAffiliation(e.target.value)}
                className="bg-background/50"
                data-testid="input-school"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold tracking-widest uppercase text-blue-400">
                  Canvas Integration
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    CONNECTED
                  </span>
                )}
                {accountType === "observer" && (
                  <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20 no-default-active-elevate">
                    OBSERVER
                  </Badge>
                )}
                {accountType === "student" && isConnected && (
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 no-default-active-elevate">
                    STUDENT
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                    Canvas Base URL
                  </Label>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <Input
                  value={canvasBaseUrl}
                  onChange={(e) => setCanvasBaseUrl(e.target.value)}
                  placeholder="https://yourschool.instructure.com"
                  className="bg-background/50"
                  data-testid="input-canvas-url"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                    Canvas API Token
                  </Label>
                  <button
                    className="text-xs text-blue-400 font-medium"
                    onClick={() => setShowTokenHelp((v) => !v)}
                    data-testid="button-toggle-token-help"
                  >
                    HOW TO FIND YOUR TOKEN?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={canvasApiToken}
                    onChange={(e) => {
                      setCanvasApiToken(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="Enter your Canvas API token"
                    className="bg-background/50 pr-10"
                    data-testid="input-canvas-token"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowToken((v) => !v)}
                    data-testid="button-show-token"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {showTokenHelp && (
                <div className="rounded-md bg-background/50 p-3 text-xs text-muted-foreground space-y-2 border border-border/50">
                  <p className="font-medium text-foreground">How to generate a Canvas API token:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Log into your Canvas account</li>
                    <li>Go to Account &gt; Settings</li>
                    <li>Scroll to "Approved Integrations"</li>
                    <li>Click "+ New Access Token"</li>
                    <li>Give it a purpose (e.g. "Dashboard") and click "Generate Token"</li>
                    <li>Copy the token and paste it here</li>
                  </ol>
                  <p className="text-amber-400/80">
                    Your token is stored securely and never exposed in the frontend.
                  </p>
                </div>
              )}

              {canvasBaseUrl && tokenChanged && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending}
                  className="w-full"
                  data-testid="button-test-connection"
                >
                  {testMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              )}

              {testResult && (
                <div
                  className={`rounded-md p-3 text-xs space-y-2 border ${
                    testResult.success
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/5 border-red-500/20 text-red-400"
                  }`}
                  data-testid="text-test-result"
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="font-medium">
                      {testResult.success
                        ? `Connected as ${testResult.canvasUser?.name}`
                        : "Connection failed"}
                    </span>
                  </div>
                  {testResult.success && (
                    <div className="ml-6 space-y-1 text-muted-foreground">
                      <p>
                        Account type:{" "}
                        <span className="text-foreground font-medium capitalize">
                          {testResult.accountType}
                        </span>
                      </p>
                      {testResult.canvasUser?.email && (
                        <p>Email: {testResult.canvasUser.email}</p>
                      )}
                      {testResult.accountType === "observer" &&
                        testResult.observees &&
                        testResult.observees.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-purple-400 font-medium">
                                Linked Students ({testResult.observees.length})
                              </span>
                            </div>
                            <ul className="ml-5 space-y-0.5">
                              {testResult.observees.map((o) => (
                                <li key={o.id}>{o.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                  {!testResult.success && testResult.message && (
                    <p className="ml-6">{testResult.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {accountType === "observer" && isConnected && user?.observedStudentName && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold tracking-widest uppercase text-purple-400">
                  Viewing Student
                </span>
              </div>
              <div className="rounded-md bg-background/50 p-3 border border-border/50">
                <p className="text-sm font-medium">{user.observedStudentName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use "Update Records" on the dashboard to switch students or refresh data.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="button-cancel-settings">
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
              data-testid="button-save-settings"
            >
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
