import { Suspense, lazy, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SIM_METADATA } from '../components/generated/sim-registry';

// Dynamic import map - must be top-level for static analysis and to avoid re-creation
const SIM_MODULES = import.meta.glob('../sims/*/index.tsx');

// Pre-create lazy components at top level to satisfy react-hooks/static-components
// This ensures they are stable and don't reset state on every render
const LAZY_SIM_MAP = Object.fromEntries(
  Object.entries(SIM_MODULES).map(([path, importFn]) => [
    path,
    lazy(importFn as () => Promise<{ default: React.ComponentType }>)
  ])
);

// Helper component to resolve and render a simulation
const SimComponentWrapper = ({ simId }: { simId: string }) => {
  const simInfo = useMemo(() => SIM_METADATA.find(s => s.id === simId), [simId]);
  const path = useMemo(() => `../sims/${simInfo?.folder || simId}/index.tsx`, [simInfo, simId]);
  
  const LazySim = LAZY_SIM_MAP[path];

  if (!simInfo) {
    return <div className="text-ares-danger p-4 text-center">Simulation metadata not found: {simId}</div>;
  }

  if (!SIM_MODULES[path]) {
    return <div className="text-ares-danger p-4 text-center">Simulation source not found: {path}</div>;
  }

  if (!LazySim) return null;

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-marble">Loading Sim...</div>}>
      <LazySim />
    </Suspense>
  );
};

const SimRunner = () => {
  const { simId: urlSimId } = useParams();
  const [searchParams] = useSearchParams();
  const simId = urlSimId || searchParams.get('sim');

  if (!simId) {
    return <div className="text-marble p-8">No simulation ID provided.</div>;
  }

  return (
    <div className="w-full h-full min-h-screen bg-obsidian flex flex-col">
      <SimComponentWrapper simId={simId} />
    </div>
  );
};

export default SimRunner;
