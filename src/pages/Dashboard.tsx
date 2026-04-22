import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useDashboardSession } from "../hooks/useDashboardSession";
import { useDashboardNotifications } from "../hooks/useDashboardNotifications";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardRoutes from "../components/dashboard/DashboardRoutes";

export default function Dashboard() {
  const { session, isPending, permissions } = useDashboardSession();
  const notifications = useDashboardNotifications(session, permissions);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <RefreshCw size={32} className="text-ares-cyan" />
          </motion.div>
          <span className="text-sm font-bold text-white uppercase tracking-widest">Validating Session...</span>
        </div>
      </div>
    );
  }

  if (!session?.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 p-6 text-center">
        <ShieldAlert size={64} className="text-ares-danger mb-4 opacity-50" />
        <h1 className="text-2xl font-black text-white mb-2">Authentication Required</h1>
        <p className="text-marble/60 mb-8 max-w-md">You must be signed in with a verified ARES account to access the administrative dashboard.</p>
        <Link to="/auth" className="px-6 py-3 bg-ares-red text-white font-bold ares-cut hover:bg-red-700 transition-colors">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden font-medium selection:bg-ares-red/30">
      <DashboardSidebar session={session} permissions={permissions} notifications={notifications} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-ares-red/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 overflow-hidden z-10">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase mb-1">
                ARES<span className="text-ares-red">Workspace</span>
              </h1>
              <p className="text-marble/60 text-sm font-bold tracking-wide">Command Center & Administration</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 ares-cut-sm text-xs font-bold text-marble/80 flex items-center gap-2 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-ares-gold animate-pulse" />
                D1 Connected
              </span>
              {permissions.isUnverified && (
                <span className="px-4 py-2 bg-ares-danger/10 border border-ares-danger/30 text-ares-danger-soft text-xs font-bold rounded-full uppercase tracking-wider animate-pulse flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <ShieldAlert size={14} /> Locked: View Only
                </span>
              )}
            </div>
          </div>

          <DashboardRoutes session={session} permissions={permissions} />

          <div className="mt-6 flex items-center justify-between text-zinc-600 text-[10px] font-bold uppercase tracking-widest px-4 pb-4">
             <span>ARES Robotics 23247</span>
             <span>D1 Edge Server</span>
          </div>
        </div>
      </main>
    </div>
  );
}
