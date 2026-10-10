import type { AnalysisResponse } from "@/types/analysis";

export function actionItemsToText(result: AnalysisResponse): string {
  return result.insights.action_items.map((a) => `${a.assignee}: ${a.task}`).join("\n");
}

export function buildReport(result: AnalysisResponse, format: "txt" | "md"): string {
  const { summary, insights } = result;
  const h = (t: string) => (format === "md" ? `## ${t}` : t.toUpperCase());
  const bullet = (t: string) => `- ${t}`;

  const lines: string[] = [];
  lines.push(format === "md" ? "# SummarAI — Conversation Intelligence" : "SummarAI — Conversation Intelligence");
  lines.push("");
  lines.push(h("Summary"));
  lines.push(summary || "No summary was returned.");
  lines.push("");
  lines.push(h("Key Points"));
  lines.push(
    insights.key_points.length
      ? insights.key_points.map(bullet).join("\n")
      : "No key points were identified.",
  );
  lines.push("");
  lines.push(h("Action Items"));
  lines.push(
    insights.action_items.length
      ? insights.action_items.map((a) => `- Assignee: ${a.assignee}\n  Task: ${a.task}`).join("\n")
      : "No action items were identified.",
  );
  lines.push("");
  lines.push(h("Decisions"));
  lines.push(
    insights.decisions.length
      ? insights.decisions.map(bullet).join("\n")
      : "No decisions were identified.",
  );
  lines.push("");
  lines.push(h("Topics"));
  lines.push(
    insights.topics.length ? insights.topics.map(bullet).join("\n") : "No topics were identified.",
  );
  lines.push("");
  lines.push("Powered by T5 & Gemini");
  return lines.join("\n");
}

export function downloadReport(result: AnalysisResponse, format: "txt" | "md") {
  const content = buildReport(result, format);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `summarai-report.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
