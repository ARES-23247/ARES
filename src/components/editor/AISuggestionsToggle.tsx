import { Sparkles, Loader2 } from "lucide-react";

interface AISuggestionsToggleProps {
  enabled: boolean;
  isLoading: boolean;
  onToggle: (val: boolean) => void;
}

/**
 * Toggle button for AI inline suggestions.
 * Shows a sparkle icon with loading state indicator.
 */
export function AISuggestionsToggle({ enabled, isLoading, onToggle }: AISuggestionsToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      title={enabled ? "Disable AI suggestions (Ctrl+Space for manual)" : "Enable AI suggestions"}
      aria-label={enabled ? "Disable AI suggestions" : "Enable AI suggestions"}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
        enabled
          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30"
          : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-400"
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      <span>z.ai</span>
    </button>
  );
}
