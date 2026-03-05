import type { CanvasObservee } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  observees: CanvasObservee[];
  onStudentSelected: (studentId: string) => void;
};

export function ObserverStudentPicker({
  open,
  onOpenChange,
  observees,
  onStudentSelected,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-card-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-purple-400" />
            <DialogTitle className="text-lg font-semibold">Select a Student</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Your observer account is linked to the following students. Choose one to view their academic progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {observees.map((observee) => (
            <button
              key={observee.id}
              onClick={() => onStudentSelected(String(observee.id))}
              className="w-full flex items-center gap-3 p-3 rounded-md bg-background/50 border border-border/50 text-left hover-elevate transition-colors"
              data-testid={`button-select-student-${observee.id}`}
            >
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {observee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{observee.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {observee.sortable_name || observee.short_name || "Student"}
                </p>
              </div>
              <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="button-cancel-student-picker">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
