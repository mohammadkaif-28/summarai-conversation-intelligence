import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STAGES = [
  "Analyzing conversation",
  "Generating summary",
  "Extracting insights",
  "Finalizing results",
];

export function ProcessingPanel() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      aria-live="polite"
      className="premium-border rounded-2xl bg-card/90 p-8 shadow-card backdrop-blur-xl sm:p-10"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        <h2 className="text-lg font-semibold">Analyzing conversation</h2>
      </div>
      <div className="mt-7 rounded-xl border border-border/70 bg-surface-deep/70 p-5">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Currently processing</p>
        <div className="mt-3 flex items-center gap-3 text-sm font-medium">
          <span className="relative flex size-3" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-50" />
            <span className="relative inline-flex size-3 rounded-full bg-primary" />
          </span>
          <span key={stage} className="animate-in fade-in duration-300">{STAGES[stage]}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Activity labels rotate while the request runs; completion is confirmed only when results arrive.
        </p>
      </div>
    </section>
  );
}
