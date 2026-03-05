import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className="relative overflow-hidden"
    >
      <Sun className={`w-4 h-4 transition-all duration-300 ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
      <Moon className={`w-4 h-4 absolute transition-all duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
    </Button>
  );
}
