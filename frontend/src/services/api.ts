import {
  ApiError,
  type ActionItem,
  type AnalysisResponse,
  type Insights,
} from "@/types/analysis";

export const API_BASE_URL = (
  (import.meta.env['VITE_API_URL'] as string | undefined) ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function asActionItems(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { assignee: "Unassigned", task: item };
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const task = typeof record['task'] === "string" ? record['task'] : "";
        const assignee =
          typeof record['assignee'] === "string" && record['assignee'].trim()
            ? record['assignee']
            : "Unassigned";
        return task ? { assignee, task } : null;
      }
      return null;
    })
    .filter((item): item is ActionItem => item !== null);
}

/** Defensive parsing: a missing optional array must never crash the UI. */
export function normalizeAnalysis(raw: unknown): AnalysisResponse {
  const root = (raw ?? {}) as Record<string, unknown>;
  const rawInsights = (root['insights'] ?? {}) as Record<string, unknown>;

  const insights: Insights = {
    key_points: asStringArray(rawInsights['key_points']),
    action_items: asActionItems(rawInsights['action_items']),
    decisions: asStringArray(rawInsights['decisions']),
    topics: asStringArray(rawInsights['topics']),
  };

  return {
    summary: typeof root['summary'] === "string" ? root['summary'] : "",
    insights,
  };
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function analyzeConversation(conversation: string): Promise<AnalysisResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/analyze-conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation }),
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the Conversation Intelligence API.",
      null,
      `Check that the FastAPI backend is running at ${API_BASE_URL} and that CORS allows this origin.`,
    );
  }

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body['detail'] === "string") detail = body['detail'];
      else if (body['detail']) detail = JSON.stringify(body['detail']);
    } catch {
      detail = undefined;
    }

    if (res.status >= 500) {
      throw new ApiError(
        "The analysis could not be completed. Please try again.",
        res.status,
        detail,
      );
    }
    throw new ApiError(detail ?? `Request failed with status ${res.status}.`, res.status, detail);
  }

  const data: unknown = await res.json();
  return normalizeAnalysis(data);
}
