import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  Menu,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AppSidebar, type View } from "@/components/AppSidebar";
import { ProcessingPanel } from "@/components/ProcessingPanel";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { AboutPanel } from "@/components/AboutPanel";
import { useTheme } from "@/hooks/use-theme";
import { useHistory } from "@/hooks/use-history";
import { analyzeConversation, checkApiHealth, API_BASE_URL } from "@/services/api";
import { ApiError, type AnalysisResponse, type HistoryEntry } from "@/types/analysis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SummarAI — Conversation Intelligence" },
      {
        name: "description",
        content:
          "Turn lengthy multi-person conversations into concise summaries, key points, action items, decisions and topics.",
      },
      { property: "og:title", content: "SummarAI — Conversation Intelligence" },
      {
        property: "og:description",
        content:
          "Turn lengthy multi-person conversations into concise summaries and actionable insights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SummarAIApp,
});

const SOFT_LIMIT = 20000;

const PLACEHOLDER = `User 1: Good morning everyone...
User 2: Good morning...
User 3: Let's discuss the project...`;

const EXAMPLE_CONVERSATION = `Maya: Let's finalize the launch plan. The product page is ready, but we still need final screenshots.
Jon: I can deliver those by Thursday afternoon.
Maya: Great. Priya, can you schedule the customer email for Friday morning?
Priya: Yes, and I'll share a preview with the team first.
Maya: Perfect. We've decided to launch Friday at 10 AM, pending the screenshot review.`;

interface ErrorState {
  message: string;
  detail?: string | undefined;
  retryable: boolean;
}

function SummarAIApp() {
  const { theme, toggleTheme } = useTheme();
  const { entries, saveEntry, deleteEntry, clearAll } = useHistory();

  const [view, setView] = useState<View>("new");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversation, setConversation] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<HistoryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const refreshHealth = useCallback(() => {
    let cancelled = false;
    void checkApiHealth().then((ok) => {
      if (!cancelled) setApiOnline(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = refreshHealth();
    const id = setInterval(refreshHealth, 30000);
    return () => {
      cancel();
      clearInterval(id);
    };
  }, [refreshHealth]);

  const charCount = conversation.length;
  const overLimit = charCount > SOFT_LIMIT;
  const nearLimit = !overLimit && charCount > SOFT_LIMIT * 0.9;

  const startNewAnalysis = useCallback(() => {
    setView("new");
    setConversation("");
    setResult(null);
    setAnalyzedText("");
    setActiveEntry(null);
    setSavedId(null);
    setError(null);
    setDrawerOpen(false);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (loading) return;
    if (!conversation.trim()) {
      setError({ message: "Please enter a conversation before analyzing.", retryable: false });
      return;
    }
    if (overLimit) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSavedId(null);
    setActiveEntry(null);

    try {
      const data = await analyzeConversation(conversation);
      setResult(data);
      setAnalyzedText(conversation);
      refreshHealth();
    } catch (err) {
      if (err instanceof ApiError) {
        setError({
          message: err.message,
          detail: err.detail,
          retryable: err.status === null || err.status >= 500,
        });
        if (err.status === null) setApiOnline(false);
      } else {
        setError({
          message: "The analysis could not be completed. Please try again.",
          detail: err instanceof Error ? err.message : undefined,
          retryable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [conversation, loading, overLimit, refreshHealth]);

  const handleSave = useCallback(() => {
    if (!result) return;
    const entry = saveEntry(analyzedText, result);
    setSavedId(entry.id);
  }, [analyzedText, result, saveEntry]);

  const handleSelectEntry = useCallback((entry: HistoryEntry) => {
    setActiveEntry(entry);
    setView("history");
    setError(null);
    setDrawerOpen(false);
  }, []);

  const handleDeleteEntry = useCallback(() => {
    if (!activeEntry) return;
    deleteEntry(activeEntry.id);
    setActiveEntry(null);
  }, [activeEntry, deleteEntry]);

  const sidebar = useMemo(
    () => (
      <AppSidebar
        view={view}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onSelectView={(next) => {
          setView(next);
          setDrawerOpen(false);
          if (next === "new") startNewAnalysis();
        }}
        entries={entries}
        activeEntryId={activeEntry?.id ?? null}
        onSelectEntry={handleSelectEntry}
        onClearHistory={() => {
          clearAll();
          setActiveEntry(null);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        apiOnline={apiOnline}
      />
    ),
    [
      activeEntry,
      apiOnline,
      clearAll,
      collapsed,
      entries,
      handleSelectEntry,
      startNewAnalysis,
      theme,
      toggleTheme,
      view,
    ],
  );

  return (
    <div className="ambient-shell flex min-h-screen bg-background">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border bg-sidebar/85 backdrop-blur-xl transition-all duration-300 lg:block",
          collapsed ? "w-[72px]" : "w-72",
        )}
      >
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="metallic-mark flex size-8 items-center justify-center rounded-lg text-primary-foreground"><BrainCircuit className="size-4" aria-hidden /></span>
            SummarAI
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-9 sm:py-12 lg:px-14 lg:py-16">
          {view === "about" ? (
            <AboutPanel apiBaseUrl={API_BASE_URL} />
          ) : view === "history" ? (
            activeEntry ? (
              <ResultsDashboard
                result={activeEntry.result}
                subtitle={`Saved ${new Date(activeEntry.createdAt).toLocaleString()}`}
                onNewAnalysis={startNewAnalysis}
                onDelete={handleDeleteEntry}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <h2 className="text-lg font-semibold">History</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {entries.length
                    ? "Select a saved analysis from the sidebar to view it again."
                    : "No saved analyses yet. Run an analysis and choose Save to History."}
                </p>
              </div>
            )
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Conversation Intelligence
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Turn lengthy conversations into concise summaries and actionable insights.
                </p>
              </div>

              {loading ? (
                <ProcessingPanel />
              ) : result ? (
                <ResultsDashboard
                  result={result}
                  onNewAnalysis={startNewAnalysis}
                  onSave={handleSave}
                  saved={savedId !== null}
                />
              ) : (
                <div className="space-y-8">
                  <section className="premium-border rounded-2xl bg-card/85 p-7 shadow-card backdrop-blur-xl sm:p-9">
                    <h2 className="text-lg font-semibold">Conversation Transcript</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Paste a multi-person conversation below to analyze it.
                    </p>

                    <label htmlFor="conversation" className="sr-only">
                      Conversation transcript
                    </label>
                    <div className="relative mt-6">
                      <Textarea
                        id="conversation"
                        value={conversation}
                        onChange={(e) => setConversation(e.target.value)}
                        placeholder={PLACEHOLDER}
                        aria-describedby="char-count"
                        aria-invalid={overLimit}
                        className="min-h-72 resize-y bg-surface-deep/80 pb-11 font-mono text-sm leading-relaxed shadow-inner focus-visible:bg-surface-deep"
                      />
                      <p
                        id="char-count"
                        className={cn(
                          "pointer-events-none absolute right-3 bottom-3 rounded-md bg-surface-deep/90 px-2 py-1 text-xs tabular-nums backdrop-blur-sm",
                          overLimit
                            ? "font-medium text-destructive"
                            : nearLimit
                              ? "font-medium text-warning"
                              : "text-muted-foreground",
                        )}
                      >
                        {charCount.toLocaleString()} / {SOFT_LIMIT.toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Button
                        variant="premium"
                        size="lg"
                        onClick={() => void runAnalysis()}
                        disabled={loading || overLimit}
                        className="w-full gap-2 sm:w-auto"
                      >
                        <Sparkles className="size-4" aria-hidden />
                        Analyze Conversation
                      </Button>
                    </div>

                    {overLimit && (
                      <p className="mt-3 flex gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>
                          This conversation exceeds the {SOFT_LIMIT.toLocaleString()} character
                          guideline. Shorten it before analyzing — nothing is truncated
                          automatically.
                        </span>
                      </p>
                    )}
                  </section>

                  {error && (
                    <section
                      role="alert"
                      className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-destructive">{error.message}</p>
                          {error.detail && (
                            <Collapsible className="mt-2">
                              <CollapsibleTrigger className="text-xs font-medium text-muted-foreground underline underline-offset-4">
                                Technical details
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
                                  {error.detail}
                                </pre>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          {error.retryable && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 gap-2"
                              onClick={() => void runAnalysis()}
                            >
                              <RefreshCw className="size-4" aria-hidden />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="rounded-2xl border border-dashed border-border bg-card/35 p-10 text-center backdrop-blur-sm sm:p-12">
                    <span className="metallic-mark mx-auto flex size-16 items-center justify-center rounded-2xl text-primary-foreground">
                      <BrainCircuit className="size-8" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">Ready to analyze</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                      Begin by pasting your meeting transcript or conversation log above. SummarAI
                      will instantly generate concise summaries and structured insights.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-5 bg-transparent"
                      onClick={() => {
                        setConversation(EXAMPLE_CONVERSATION);
                        document.getElementById("conversation")?.focus();
                      }}
                    >
                      View Example Summary
                    </Button>
                  </section>
                </div>
              )}
            </>
          )}

          <footer className="mt-20 border-t border-border/60 pt-5 text-xs text-muted-foreground/50">
            SummarAI — Conversation Intelligence · Powered by T5 &amp; Gemini
          </footer>
        </main>
      </div>
    </div>
  );
}
