import {
  BrainCircuit,
  ChevronLeft,
  History,
  Info,
  Moon,
  PenLine,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { groupByDay } from "@/hooks/use-history";
import type { HistoryEntry } from "@/types/analysis";

export type View = "new" | "history" | "about";

interface AppSidebarProps {
  view: View;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectView: (view: View) => void;
  entries: HistoryEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  apiOnline: boolean | null;
}

const NAV: Array<{ key: View; label: string; icon: typeof PenLine }> = [
  { key: "new", label: "New Analysis", icon: PenLine },
  { key: "history", label: "History", icon: History },
  { key: "about", label: "About", icon: Info },
];

export function AppSidebar({
  view,
  collapsed,
  onToggleCollapse,
  onSelectView,
  entries,
  activeEntryId,
  onSelectEntry,
  onClearHistory,
  theme,
  onToggleTheme,
  apiOnline,
}: AppSidebarProps) {
  const statusLabel =
    apiOnline === null ? "Checking API…" : apiOnline ? "API Online" : "API Offline";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <span className="metallic-mark flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
          <BrainCircuit className="size-5" aria-hidden />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">SummarAI</p>
            <p className="truncate text-xs text-muted-foreground">Conversation Intelligence</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden size-8 shrink-0 text-muted-foreground lg:inline-flex"
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="space-y-1 px-2 py-3" aria-label="Main">
        {NAV.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            onClick={() => onSelectView(key)}
            aria-current={view === key ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "h-10 w-full justify-start gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-300",
              view === key
                ? "bg-primary/15 text-sidebar-accent-foreground shadow-sm ring-1 ring-primary/20"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span>{label}</span>}
          </Button>
        ))}
      </nav>

      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Saved analyses
            </p>
            {entries.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    aria-label="Clear all history"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Every saved analysis stored in this browser will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onClearHistory}>Clear All History</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {entries.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Saved analyses appear here. Nothing saved yet.
            </p>
          ) : (
            groupByDay(entries).map(([label, group]) => (
              <div key={label} className="mb-3">
                <p className="px-3 py-1 text-[11px] font-medium text-muted-foreground">{label}</p>
                <ul className="space-y-1">
                  {group.map((entry) => (
                    <li key={entry.id}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onSelectEntry(entry)}
                        className={cn(
                          "h-auto w-full justify-start truncate rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          activeEntryId === entry.id
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        {entry.title}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      <div
        className={cn(
          "mt-auto space-y-2 border-t border-sidebar-border p-3",
          collapsed && "flex flex-col items-center",
        )}
      >
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className={cn("text-muted-foreground/70", !collapsed && "w-full justify-start gap-3")}
        >
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          {!collapsed && <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>}
        </Button>

        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
            collapsed && "justify-center px-0",
          )}
          role="status"
        >
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              apiOnline === null
                ? "animate-pulse bg-warning"
                : apiOnline
                  ? "bg-success"
                  : "animate-pulse bg-warning",
            )}
          />
          {!collapsed && <span className="text-muted-foreground/60">{statusLabel}</span>}
          <span className="sr-only">{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}
