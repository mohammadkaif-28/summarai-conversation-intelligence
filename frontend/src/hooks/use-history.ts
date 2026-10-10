import { useCallback, useEffect, useState } from "react";
import type { AnalysisResponse, HistoryEntry } from "@/types/analysis";

const STORAGE_KEY = "summarai-history";
const MAX_HISTORY = 50;

function makeTitle(conversation: string): string {
  const firstLine = conversation
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);

  const base = (firstLine ?? "Conversation").replace(/^[^:]{1,20}:\s*/, "");

  return base.length > 42 ? `${base.slice(0, 42)}…` : base || "Conversation";
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved history when the app starts
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const saved = JSON.parse(raw);

        if (Array.isArray(saved)) {
          setEntries(saved);
        }
      }
    } catch (error) {
      console.error("Failed to load saved history:", error);
      setEntries([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save history to localStorage
  const persist = useCallback((next: HistoryEntry[]) => {
    setEntries(next);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  }, []);

  // Save a new analysis
  const saveEntry = useCallback(
    (conversation: string, result: AnalysisResponse): HistoryEntry => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        preview: conversation.slice(0, 160),
        title: makeTitle(conversation),
        conversation,
        result,
      };

      setEntries((prev) => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
          console.error("Failed to save analysis:", error);
        }

        return next;
      });

      return entry;
    },
    [],
  );

  // Delete one analysis
  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((entry) => entry.id !== id);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("Failed to update history:", error);
      }

      return next;
    });
  }, []);

  // Delete all history
  const clearAll = useCallback(() => {
    setEntries([]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  }, []);

  return {
    entries,
    loaded,
    saveEntry,
    deleteEntry,
    clearAll,
  };
}

export function groupByDay(
  entries: HistoryEntry[],
): Array<[string, HistoryEntry[]]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today.getTime() - 86400000);

  const groups = new Map<string, HistoryEntry[]>();

  for (const entry of entries) {
    const d = new Date(entry.createdAt);

    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);

    let label: string;

    if (dayStart.getTime() === today.getTime()) {
      label = "Today";
    } else if (dayStart.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const list = groups.get(label) ?? [];
    list.push(entry);
    groups.set(label, list);
  }

  return Array.from(groups.entries());
}