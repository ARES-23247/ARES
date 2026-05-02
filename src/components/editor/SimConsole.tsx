import { Terminal, Trash2 } from "lucide-react";

export interface LogEntry {
  level: "log" | "warn" | "error" | "info";
  args: string[];
  timestamp: number;
}

export function SimConsole({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#0d0f14] border-t border-white/10 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0d0f14]">
        <span className="text-zinc-400 text-xs font-mono uppercase flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          Console
        </span>
        <button
          onClick={onClear}
          title="Clear console"
          className="p-1 text-white/20 hover:text-white/50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-white/20 px-2 py-1">Console is empty...</div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`px-2 py-1 flex items-start gap-2 border-b border-white/5 last:border-0 ${
                log.level === "error"
                  ? "text-red-400 bg-red-500/5"
                  : log.level === "warn"
                  ? "text-yellow-400 bg-yellow-500/5"
                  : log.level === "info"
                  ? "text-blue-400"
                  : "text-zinc-300"
              }`}
            >
              <span className="text-white/20 shrink-0 select-none">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="whitespace-pre-wrap break-all">{log.args.join(" ")}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
