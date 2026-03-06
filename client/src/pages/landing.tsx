import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GraduationCap, BarChart3, Bell, Shield } from "lucide-react";
import heroImage from "@assets/canvasHomeworkHelper_1772758626967.jpg";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-lg tracking-tight" data-testid="text-brand">Canvas Homework Helper</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href="/api/login">
              <Button data-testid="button-login">Sign In</Button>
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="max-w-[1200px] mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight font-serif">
                Track Your{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Academic Progress
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Stay on top of your assignments, grades, and deadlines with a clean, focused dashboard that connects directly to Canvas LMS.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/api/login">
                  <Button size="lg" className="text-base px-8" data-testid="button-get-started">
                    Get Started
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-green-500" />
                  Secure sign-in
                </span>
                <span>Free to use</span>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Students using Canvas Homework Helper"
                  className="rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 w-full object-cover hover:scale-105 transition-transform duration-500"
                  data-testid="img-hero"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:bg-accent/50">
              <div className="mb-4 inline-flex rounded-lg bg-blue-100 dark:bg-blue-500/15 p-3">
                <BarChart3 className="w-6 h-6 text-blue-700 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Real-Time Grades</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                See your scores, averages, and assignment statuses updated directly from Canvas LMS.
              </p>
            </div>
            <div className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:bg-accent/50">
              <div className="mb-4 inline-flex rounded-lg bg-amber-100 dark:bg-amber-500/15 p-3">
                <Bell className="w-6 h-6 text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Smart Alerts</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Know exactly which assignments need attention with priority-ranked focus panels and missing work alerts.
              </p>
            </div>
            <div className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:bg-accent/50">
              <div className="mb-4 inline-flex rounded-lg bg-purple-100 dark:bg-purple-500/15 p-3">
                <Shield className="w-6 h-6 text-purple-700 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Parent & Observer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Observer accounts can view linked students' progress — perfect for parents monitoring academic performance.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider">
          <span>Canvas Homework Helper</span>
          <span>Data & Privacy</span>
        </div>
      </footer>
    </div>
  );
}
