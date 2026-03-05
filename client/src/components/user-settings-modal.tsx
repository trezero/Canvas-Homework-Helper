import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Sparkles, Eye, EyeOff, HelpCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | undefined;
};

export function UserSettingsModal({ open, onOpenChange, user }: Props) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolAffiliation, setSchoolAffiliation] = useState("");
  const [canvasBaseUrl, setCanvasBaseUrl] = useState("");
  const [canvasApiToken, setCanvasApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setSchoolAffiliation(user.schoolAffiliation || "");
      setCanvasBaseUrl(user.canvasBaseUrl || "");
      setCanvasApiToken(user.canvasApiToken || "");
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/user", {
        fullName,
        email,
        schoolAffiliation,
        canvasBaseUrl,
        canvasApiToken,
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card border-card-border p-0">
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
              {user?.canvasConnected && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  CONNECTED
                </span>
              )}
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
                    onClick={() => setShowToken((v) => !v)}
                    data-testid="button-toggle-token"
                  >
                    HOW TO FIND YOUR TOKEN?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={canvasApiToken}
                    onChange={(e) => setCanvasApiToken(e.target.value)}
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
            </div>
          </div>

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
