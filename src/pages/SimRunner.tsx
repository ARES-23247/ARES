import { useEffect, useState, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { SIM_METADATA } from '../components/generated/sim-registry';

// Dynamic import component loader for sims
const SimComponentWrapper = ({ simId }: { simId: string }) => {
  const simInfo = SIM_METADATA.find(s => s.id === simId);
  
  if (!simInfo) {
    return <div className="text-ares-danger p-4">Simulation not found: {simId}</div>;
  }

  // Use Vite's import.meta.glob to dynamically load the simulation
  // This avoids needing to manually maintain imports
  const modules = import.meta.glob('../sims/*/index.tsx');
  const path = `../sims/${simInfo.folder || simId}/index.tsx`;
  
  if (!modules[path]) {
    return <div className="text-ares-danger p-4">Simulation file not found: {path}</div>;
  }

  const LazySim = lazy(modules[path] as any);

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-marble">Loading Sim...</div>}>
      <LazySim />
    </Suspense>
  );
};

export default function SimRunner() {
  const [simId, setSimId] = useState<string | null>(null);
  const location = useLocation();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sim = params.get('sim');
    if (sim) {
      setSimId(sim);
    }
  }, [location.search]);

  // Intercept console.log and errors for the VS Code Webview overlay
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev, `[INFO] ${args.join(' ')}`]);
      originalLog(...args);
    };
    console.error = (...args) => {
      setLogs(prev => [...prev, `[ERROR] ${args.join(' ')}`]);
      originalError(...args);
    };

    window.onerror = (message) => {
      setLogs(prev => [...prev, `[CRITICAL] ${message}`]);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      window.onerror = null;
    };
  }, []);

  if (!simId) {
    return <div className="p-4 text-marble bg-obsidian h-screen">No sim specified in URL (?sim=name).</div>;
  }

  return (
    <div className="flex h-screen w-full bg-obsidian overflow-hidden">
      <div className="flex-1 relative">
        <SimComponentWrapper simId={simId} />
      </div>

      {/* Embedded Debug Console for Students */}
      {logs.length > 0 && (
        <div className="absolute bottom-0 right-0 w-80 h-48 bg-black/90 border-t border-l border-white/20 text-green-400 font-mono text-xs p-2 overflow-y-auto">
          <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-1">
            <span className="text-white/70">Debug Console</span>
            <button onClick={() => setLogs([])} className="text-white/50 hover:text-white">Clear</button>
          </div>
          {logs.map((log, i) => {
            const isError = log.includes('[ERROR]') || log.includes('[CRITICAL]');
            return (
              <div key={i} className={`mb-1 ${isError ? 'text-red-400' : ''}`}>
                {log}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
