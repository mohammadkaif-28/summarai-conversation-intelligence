import { BrainCircuit } from "lucide-react";

const CAPABILITIES = [
  "Multi-person conversation summarization",
  "Key point extraction",
  "Action item extraction",
  "Decision extraction",
  "Topic identification",
];

const TECHNOLOGY = [
  "Python",
  "FastAPI",
  "PyTorch",
  "Hugging Face Transformers",
  "T5",
  "Google Gemini",
];

export function AboutPanel({ apiBaseUrl }: { apiBaseUrl: string }) {
  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <span className="metallic-mark flex size-11 items-center justify-center rounded-xl text-primary-foreground">
          <BrainCircuit className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">About SummarAI</h2>
          <p className="text-sm text-muted-foreground">Conversation Intelligence</p>
        </div>
      </header>

      <section className="premium-border rounded-2xl bg-card/90 p-6 shadow-card backdrop-blur-xl">
        <p className="leading-relaxed text-card-foreground/90">
          SummarAI is a Conversation Intelligence application that combines a fine-tuned T5
          summarization model with Gemini-based structured information extraction. This interface is
          a frontend client; all analysis runs in the existing FastAPI backend.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="premium-border rounded-2xl bg-card/90 p-6 shadow-card backdrop-blur-xl">
          <h3 className="text-sm font-semibold tracking-wide uppercase">Capabilities</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {CAPABILITIES.map((c) => (
              <li key={c} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="premium-border rounded-2xl bg-card/90 p-6 shadow-card backdrop-blur-xl">
          <h3 className="text-sm font-semibold tracking-wide uppercase">Technology</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {TECHNOLOGY.map((t) => (
              <li
                key={t}
                className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium"
              >
                {t}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="premium-border rounded-2xl bg-card/90 p-6 shadow-card backdrop-blur-xl">
        <h3 className="text-sm font-semibold tracking-wide uppercase">Backend configuration</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The API base URL is read from the <code className="text-foreground">VITE_API_URL</code>{" "}
          environment variable and currently points to{" "}
          <code className="text-foreground">{apiBaseUrl}</code>. If the frontend runs on a different
          origin (for example <code className="text-foreground">http://localhost:5173</code>), the
          FastAPI application must enable <code className="text-foreground">CORSMiddleware</code> for
          that origin, otherwise the browser will block requests.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">Powered by T5 &amp; Gemini</p>
    </div>
  );
}
