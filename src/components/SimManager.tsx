import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, FolderOpen, Copy, Check, AlertCircle, Code, Zap } from "lucide-react";
import { toast } from "sonner";

interface Sim {
  id: string;
  name: string;
  path: string;
  requiresContext: boolean;
}

const DEFAULT_SIM: Omit<Sim, "id"> = {
  name: "",
  path: "./",
  requiresContext: false,
};

export default function SimManager() {
  const [sims, setSims] = useState<Sim[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<Sim, "id">>(DEFAULT_SIM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [newSimForm, setNewSimForm] = useState(DEFAULT_SIM);

  // Load sims from simRegistry.json
  useEffect(() => {
    fetch("/src/sims/simRegistry.json")
      .then(res => res.json())
      .then(data => setSims(data.simulators || []))
      .catch(() => {
        // Fallback to relative path for dev
        fetch("/sims/simRegistry.json")
          .then(res => res.json())
          .then(data => setSims(data.simulators || []))
          .catch(() => {
            // Try generated registry
            fetch("/src/components/generated/sim-registry.ts")
              .then(res => res.text())
              .then(content => {
                // Parse the SIM_COMPONENTS object from the file
                const match = content.match(/const SIM_COMPONENTS.*?=\s*{([\s\S]*?)};/);
                if (match) {
                  const entries = match[1].split(',').map((line: string) => {
                    const [key, value] = line.split(':').map(s => s.trim());
                    return { key, value };
                  }).filter((e: any) => e.key && e.value);
                  const parsedSims = entries.map((e: any) => ({
                    id: e.value,
                    name: e.value.replace(/([A-Z])/g, ' $1').trim(),
                    path: `./${e.key}`,
                    requiresContext: false,
                  }));
                  setSims(parsedSims);
                }
              })
              .catch(() => console.error("Failed to load sim registry"));
          });
      });
  }, []);

  const handleCopyJson = () => {
    const jsonContent = JSON.stringify({ simulators: sims }, null, 2);
    navigator.clipboard.writeText(jsonContent);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    toast.success("Copied simRegistry.json to clipboard");
  };

  const handleAddSim = () => {
    // Generate folder name from name: "Monty Hall Problem" -> "montyhall"
    const folderName = newSimForm.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim();

    // Generate PascalCase ID: "montyhall" -> "Montyhall" -> "MontyHall"
    const id = folderName
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    const newSim: Sim = {
      id,
      name: newSimForm.name,
      path: `./${folderName}`,
      requiresContext: newSimForm.requiresContext,
    };

    setSims([...sims, newSim]);
    setNewSimForm(DEFAULT_SIM);
    setShowAddForm(false);
    toast.success(`Sim "${newSim.name}" added! Remember to create the folder and index.tsx`);
  };

  const handleUpdateSim = () => {
    if (!editingId) return;
    setSims(sims.map(sim => sim.id === editingId ? { ...editForm, id: editingId } : sim));
    setEditingId(null);
    setEditForm(DEFAULT_SIM);
    toast.success("Sim updated");
  };

  const handleDeleteSim = (id: string) => {
    if (confirm("Are you sure you want to remove this sim from the registry?")) {
      setSims(sims.filter(sim => sim.id !== id));
      toast.success("Sim removed from registry");
    }
  };

  const startEdit = (sim: Sim) => {
    setEditingId(sim.id);
    setEditForm({ name: sim.name, path: sim.path, requiresContext: sim.requiresContext });
  };

  const generateRegistryFile = () => {
    return JSON.stringify({ simulators: sims }, null, 2);
  };

  const generateInstructions = (sim: Sim) => {
    const folderName = sim.path.replace('./', '');
    return `# To add "${sim.name}" to the codebase:

1. Create the folder:
   src/sims/${folderName}/

2. Create src/sims/${folderName}/index.tsx:
   export default function ${sim.id}() {
     return <div className="sim-container">${sim.name}</div>;
   }

3. Run: npm run generate:sims

4. The sim tag will be: <${sim.id.toLowerCase()} />`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-ares-cyan/20 to-ares-gold/20 ares-cut-sm border border-white/10">
              <Zap className="text-ares-cyan" size={24} />
            </div>
            Sim Registry Manager
          </h2>
          <p className="text-marble/40 text-sm mt-1">
            Manage simulation components for ARESWEB docs and playground
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-2 px-4 py-2 bg-ares-gold/20 text-ares-gold border border-ares-gold/30 ares-cut-sm hover:bg-ares-gold/30 transition-colors font-bold text-sm"
          >
            {copiedJson ? <Check size={16} /> : <Copy size={16} />}
            {copiedJson ? "Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-ares-cyan/20 text-ares-cyan border border-ares-cyan/30 ares-cut-sm hover:bg-ares-cyan/30 transition-colors font-bold text-sm"
          >
            <Plus size={16} />
            Add Sim
          </button>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="p-4 bg-ares-gold/10 border border-ares-gold/30 ares-cut-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-ares-gold shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-marble/90">
            <p className="font-bold text-ares-gold mb-1">How to add a new sim:</p>
            <ol className="list-decimal list-inside space-y-1 text-marble/80">
              <li>Fill out the form below and click "Add Sim"</li>
              <li>Copy the JSON and update <code className="bg-black/30 px-1 py-0.5 rounded">src/sims/simRegistry.json</code></li>
              <li>Create the sim folder with <code className="bg-black/30 px-1 py-0.5 rounded">index.tsx</code></li>
              <li>Run <code className="bg-black/30 px-1 py-0.5 rounded">npm run generate:sims</code> to update imports</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Add New Sim Form */}
      {showAddForm && (
        <div className="p-6 bg-white/5 border border-white/10 ares-cut-sm space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-ares-cyan" />
            Add New Sim
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-marble/60 uppercase tracking-wider mb-2">
                Sim Name
              </label>
              <input
                type="text"
                value={newSimForm.name}
                onChange={e => setNewSimForm({ ...newSimForm, name: e.target.value })}
                placeholder="e.g., Monty Hall Problem"
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded text-white placeholder:text-marble/40 focus:border-ares-cyan/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-marble/60 uppercase tracking-wider mb-2">
                Folder Path
              </label>
              <input
                type="text"
                value={newSimForm.path}
                onChange={e => setNewSimForm({ ...newSimForm, path: e.target.value })}
                placeholder="./montyhall"
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded text-white placeholder:text-marble/40 focus:border-ares-cyan/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-marble/80 cursor-pointer">
              <input
                type="checkbox"
                checked={newSimForm.requiresContext}
                onChange={e => setNewSimForm({ ...newSimForm, requiresContext: e.target.checked })}
                className="accent-ares-cyan"
              />
              Requires Context (needs team data/environment)
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddSim}
              disabled={!newSimForm.name}
              className="px-4 py-2 bg-ares-cyan text-black font-bold ares-cut-sm hover:bg-ares-cyan/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add Sim
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-white/5 text-marble/80 font-bold ares-cut-sm hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Sim Form */}
      {editingId && (
        <div className="p-6 bg-ares-gold/10 border border-ares-gold/30 ares-cut-sm space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit size={18} className="text-ares-gold" />
            Edit: {sims.find(s => s.id === editingId)?.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-marble/60 uppercase tracking-wider mb-2">
                Sim Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded text-white placeholder:text-marble/40 focus:border-ares-gold/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-marble/60 uppercase tracking-wider mb-2">
                Folder Path
              </label>
              <input
                type="text"
                value={editForm.path}
                onChange={e => setEditForm({ ...editForm, path: e.target.value })}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded text-white placeholder:text-marble/40 focus:border-ares-gold/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-marble/80 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.requiresContext}
                onChange={e => setEditForm({ ...editForm, requiresContext: e.target.checked })}
                className="accent-ares-gold"
              />
              Requires Context
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpdateSim}
              className="px-4 py-2 bg-ares-gold text-black font-bold ares-cut-sm hover:bg-ares-gold/80 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => { setEditingId(null); setEditForm(DEFAULT_SIM); }}
              className="px-4 py-2 bg-white/5 text-marble/80 font-bold ares-cut-sm hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sims Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sims.map(sim => (
          <div
            key={sim.id}
            className="p-4 bg-white/5 border border-white/10 ares-cut-sm hover:border-white/20 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white truncate">{sim.name}</h4>
                <p className="text-xs text-marble/50 font-mono truncate mt-1">{sim.path}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(sim)}
                  className="p-1.5 hover:bg-white/10 rounded text-marble/60 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDeleteSim(sim.id)}
                  className="p-1.5 hover:bg-ares-red/20 rounded text-marble/60 hover:text-ares-red transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                sim.requiresContext
                  ? "bg-ares-gold/20 text-ares-gold"
                  : "bg-white/5 text-marble/60"
              }`}>
                {sim.requiresContext ? "Needs Context" : "Standalone"}
              </span>
              <span className="text-xs text-marble/40 font-mono">&lt;{sim.id.toLowerCase()} /&gt;</span>
            </div>
          </div>
        ))}
      </div>

      {/* Generated JSON Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-marble/60 uppercase tracking-wider flex items-center gap-2">
            <Code size={16} />
            Generated simRegistry.json
          </h3>
          <button
            onClick={() => {
              const folderName = prompt("Enter folder name to check:", "montyhall");
              if (folderName) {
                const sim = sims.find(s => s.path.includes(folderName));
                if (sim) {
                  alert(generateInstructions(sim));
                }
              }
            }}
            className="text-xs text-ares-cyan hover:text-ares-cyan/80 underline underline-offset-2"
          >
            Get Setup Instructions
          </button>
        </div>
        <pre className="p-4 bg-black/30 border border-white/10 rounded text-xs text-marble/80 font-mono overflow-x-auto max-h-64 scrollbar-thin scrollbar-thumb-white/10">
          {generateRegistryFile()}
        </pre>
      </div>
    </div>
  );
}
