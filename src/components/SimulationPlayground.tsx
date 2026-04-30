import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { Play, Sparkles, Save, Loader2, RotateCcw, Copy, Check } from "lucide-react";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));
const SimPreviewFrame = lazy(() => import("./editor/SimPreviewFrame"));

// Babel standalone for JSX transpilation
let Babel: { transform: (code: string, opts: Record<string, unknown>) => { code: string } } | null = null;
const loadBabel = async () => {
  if (!Babel) {
    // @ts-expect-error -- @babel/standalone provides a global export
    const mod = await import("@babel/standalone");
    Babel = mod.default || mod;
  }
  return Babel!;
};

const DEFAULT_CODE = `// ARES Simulation Playground
// Your code must export a function called SimComponent
// Available: React, useState, useEffect, useRef, useCallback, useMemo

function SimComponent() {
  const [angle, setAngle] = React.useState(0);
  const [speed, setSpeed] = React.useState(2);

  React.useEffect(() => {
    const id = setInterval(() => {
      setAngle(prev => (prev + speed) % 360);
    }, 16);
    return () => clearInterval(id);
  }, [speed]);

  const radius = 80;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <div className="sim-container">
      <div className="sim-title">Robot Arm Visualizer</div>
      <svg width="300" height="300" viewBox="-150 -150 300 300" className="sim-canvas" style={{ display: 'block', margin: '0 auto 16px' }}>
        <circle cx="0" cy="0" r="5" fill="#d4a030" />
        <line x1="0" y1="0" x2={x} y2={y} stroke="#58a6ff" strokeWidth="3" strokeLinecap="round" />
        <circle cx={x} cy={y} r="8" fill="#58a6ff" />
        <circle cx="0" cy="0" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
      </svg>
      <div className="sim-flex" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="sim-label">Speed</div>
          <input type="range" min="0.5" max="10" step="0.5" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="sim-slider" style={{ width: 180 }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="sim-label">Angle</div>
          <div className="sim-value">{angle.toFixed(0)}°</div>
        </div>
      </div>
    </div>
  );
}`;

export default function SimulationPlayground() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [compiledCode, setCompiledCode] = useState("");
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simName, setSimName] = useState("Untitled Simulation");
  const compileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-compile on code change (debounced 800ms)
  const compileCode = useCallback(async (source: string) => {
    setIsCompiling(true);
    setCompileError(null);
    try {
      const babel = await loadBabel();
      const result = babel.transform(source, {
        presets: ["react"],
        filename: "sim.jsx",
      });
      setCompiledCode(result.code || "");
    } catch (e) {
      setCompileError((e as Error).message);
    } finally {
      setIsCompiling(false);
    }
  }, []);

  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    if (compileTimeoutRef.current) clearTimeout(compileTimeoutRef.current);
    compileTimeoutRef.current = setTimeout(() => compileCode(newCode), 800);
  }, [compileCode]);

  // Initial compile
  useEffect(() => {
    compileCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual run
  const handleRun = () => compileCode(code);

  // Reset to default
  const handleReset = () => {
    setCode(DEFAULT_CODE);
    compileCode(DEFAULT_CODE);
  };

  // Copy code
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // z.AI Generate
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Generate a React simulation component for an FRC/FTC robotics team. The component must be named SimComponent. Use React hooks (React.useState, React.useEffect, etc.) — do NOT import React. Use these CSS classes for styling: sim-container, sim-title, sim-label, sim-value, sim-slider, sim-canvas, sim-btn, sim-grid, sim-flex. Output ONLY the JavaScript code, no markdown, no explanation. Here is the current code for reference:\n\n${code}`;

      const res = await fetch("/api/ai/liveblocks-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentContext: prompt, action: "expand" }),
      });

      if (!res.ok || !res.body) throw new Error("AI request failed");

      let accumulatedText = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              accumulatedText += data.chunk;
            } catch { /* ignore parse errors */ }
          }
        }
      }

      if (accumulatedText.trim()) {
        // Strip markdown code fences if present
        let cleaned = accumulatedText.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\n?/, "").replace(/\n?```$/, "");
        }
        setCode(cleaned);
        compileCode(cleaned);
      }
    } catch (e) {
      console.error("[SimPlayground] AI generation failed:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save simulation
  const handleSave = async () => {
    if (!simName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: simName, code }),
      });
      if (res.ok) {
        const { toast } = await import("sonner");
        toast.success("Simulation saved!");
      }
    } catch (e) {
      console.error("[SimPlayground] Save failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-h-[900px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-obsidian">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-ares-gold font-black text-xs uppercase tracking-[0.2em]">⚡ Sim Playground</span>
          <input
            type="text"
            value={simName}
            onChange={e => setSimName(e.target.value)}
            className="bg-transparent border border-white/10 text-white text-sm px-3 py-1.5 rounded-md focus:border-ares-gold/50 focus:outline-none transition-colors max-w-[250px]"
            placeholder="Simulation name..."
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleRun} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-emerald-600/30 transition-colors">
            <Play className="w-3.5 h-3.5" /> Run
          </button>
          <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-indigo-600/30 transition-colors disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            z.ai Generate
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md text-xs font-bold uppercase tracking-wider hover:text-zinc-300 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md text-xs font-bold uppercase tracking-wider hover:text-zinc-300 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-ares-gold/20 text-ares-gold border border-ares-gold/30 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-ares-gold/30 transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex min-h-0">
        {/* Code Editor */}
        <div className="w-1/2 border-r border-white/10 flex flex-col min-h-0">
          <div className="px-3 py-1.5 border-b border-white/10 bg-[#1e1e1e] flex items-center gap-2">
            <span className="text-white/40 text-xs font-mono">SimComponent.jsx</span>
            {isCompiling && <Loader2 className="w-3 h-3 animate-spin text-ares-gold" />}
          </div>
          <div className="flex-1 min-h-0">
            <Suspense fallback={<div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white/40 text-sm">Loading editor...</div>}>
              <MonacoEditor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 12 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  lineNumbers: "on",
                  renderLineHighlight: "gutter",
                  bracketPairColorization: { enabled: true },
                  guides: { indentation: true },
                }}
              />
            </Suspense>
          </div>
        </div>

        {/* Live Preview */}
        <div className="w-1/2 flex flex-col min-h-0">
          <div className="px-3 py-1.5 border-b border-white/10 bg-[#0d1117] flex items-center gap-2">
            <span className="text-white/40 text-xs font-mono">Live Preview</span>
            <div className={`w-2 h-2 rounded-full ${compileError ? 'bg-red-500' : 'bg-emerald-500'}`} />
          </div>
          <div className="flex-1 min-h-0">
            <Suspense fallback={<div className="flex items-center justify-center h-full bg-[#0d1117] text-white/40 text-sm">Loading preview...</div>}>
              <SimPreviewFrame compiledCode={compiledCode} compileError={compileError} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
