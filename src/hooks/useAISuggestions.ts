import { useEffect, useRef, useCallback, useState } from "react";
import { Editor } from "@tiptap/react";

/**
 * useAISuggestions — Debounced AI inline ghost text suggestions.
 *
 * Listens to editor updates. After a 1.5s typing pause, extracts
 * ~500 chars before the cursor and fetches a short completion from
 * the `/api/ai/suggest` endpoint. Renders the suggestion as ghost
 * text via GhostTextExtension. User accepts with Tab.
 *
 * Also supports manual trigger via Ctrl+Space.
 */
export function useAISuggestions(editor: Editor | null) {
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestion = useCallback(async () => {
    if (!editor || !enabled) return;

    // Get text content before cursor
    const { from } = editor.state.selection;
    const docText = editor.state.doc.textBetween(0, from, " ");

    // Need at least 20 chars of context
    if (docText.trim().length < 20) return;

    // Take last 500 chars as context
    const context = docText.slice(-500);

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
        signal: controller.signal,
      });

      if (!res.ok || controller.signal.aborted) return;

      const data = await res.json() as { suggestion?: string };
      const suggestion = data.suggestion?.trim();

      // Only show if we got a real suggestion and cursor hasn't moved
      if (suggestion && suggestion.length > 0 && !controller.signal.aborted) {
        editor.commands.setGhostText(suggestion);
      }
    } catch (e) {
      // Silently ignore abort errors and network failures
      if ((e as Error).name !== "AbortError") {
        console.warn("[AI Suggestions] Fetch failed:", e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [editor, enabled]);

  // Listen to editor updates with debounce
  useEffect(() => {
    if (!editor || !enabled) return;

    const handleUpdate = () => {
      // Clear any pending debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Clear existing ghost text on new input
      editor.commands.clearGhostText();

      // Abort any in-flight request
      abortRef.current?.abort();

      // Set new debounce — 1.5s after last keystroke
      debounceRef.current = setTimeout(() => {
        fetchSuggestion();
      }, 1500);
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [editor, enabled, fetchSuggestion]);

  // Ctrl+Space manual trigger
  useEffect(() => {
    if (!editor || !enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        // Clear debounce and trigger immediately
        if (debounceRef.current) clearTimeout(debounceRef.current);
        fetchSuggestion();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, enabled, fetchSuggestion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { enabled, setEnabled, isLoading };
}
