export interface ConversationRequest {
  conversation: string;
}

export interface ActionItem {
  assignee: string;
  task: string;
}

export interface Insights {
  key_points: string[];
  action_items: ActionItem[];
  decisions: string[];
  topics: string[];
}

export interface AnalysisResponse {
  summary: string;
  insights: Insights;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  preview: string;
  title: string;
  conversation: string;
  result: AnalysisResponse;
}

export class ApiError extends Error {
  status: number | null;
  detail?: string | undefined;

  constructor(message: string, status: number | null = null, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}
