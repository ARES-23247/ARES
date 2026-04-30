import { RefreshCw, Radio, MessageSquare, Database } from "lucide-react";
import TeamAvailability from "./TeamAvailability";
import IntegrationHealthMonitor from "./command/IntegrationHealthMonitor";
import PlatformQuickStats from "./command/PlatformQuickStats";
import CommandQuickActions from "./command/CommandQuickActions";
import ZulipBotCommands from "./command/ZulipBotCommands";
import BroadcastWidget from "./command/BroadcastWidget";
import ExternalSourcesManager from "./command/ExternalSourcesManager";
import { useQueryClient } from "@tanstack/react-query";

// -- Command Center Component -----------------------------------------
export default function CommandCenter({ stats: prefetchedStats }: { stats?: { posts: number; events: number; docs: number; integrations: Record<string, boolean> } }) {
  const queryClient = useQueryClient();

  // Using prefetched stats from parent to avoid waterfall
  const stats = prefetchedStats || { posts: 0, events: 0, docs: 0, integrations: {} };
  
  const health = stats.integrations ? [
    { name: "Task Board", key: "tasks", icon: <Database className="w-8 h-8 mx-auto text-ares-cyan" />, configured: true },
    { name: "Zulip Chat", key: "zulip", icon: <img src="/icons/zulip.svg" alt="Zulip" className="w-8 h-8 mx-auto" />, configured: stats.integrations.zulip },
    { name: "GitHub", key: "github", icon: <img src="/icons/github.svg" alt="GitHub" className="w-8 h-8 mx-auto" />, configured: stats.integrations.github },
    { name: "Discord", key: "discord", icon: <img src="/icons/discord.svg" alt="Discord" className="w-8 h-8 mx-auto" />, configured: stats.integrations.discord },
    { name: "Bluesky", key: "bluesky", icon: <img src="/icons/bluesky.svg" alt="Bluesky" className="w-8 h-8 mx-auto" />, configured: stats.integrations.bluesky },
    { name: "BAND", key: "band", icon: <MessageSquare className="w-8 h-8 mx-auto text-brand-facebook" />, configured: stats.integrations.band },
    { name: "Slack", key: "slack", icon: <img src="/icons/slack.svg" alt="Slack" className="w-8 h-8 mx-auto grayscale invert" />, configured: stats.integrations.slack },
    { name: "Google Calendar", key: "gcal", icon: <img src="/icons/gcal.svg" alt="Google Calendar" className="w-8 h-8 mx-auto" />, configured: stats.integrations.gcal },
  ] : [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["command-health"] });
    queryClient.invalidateQueries({ queryKey: ["command-stats"] });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-ares-cyan/20 to-ares-red/20 ares-cut-sm border border-white/10">
              <Radio className="text-ares-cyan" size={24} />
            </div>
            Command Center
          </h2>
          <p className="text-marble/40 text-sm mt-1">
            Unified view of ARESWEB, Zulip, and team task management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-white/5 border border-white/10 ares-cut-sm text-xs font-bold text-marble flex items-center gap-2 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-ares-gold animate-pulse" />
            D1 Connected
          </span>
          <button
            onClick={handleRefresh}
            title="Refresh dashboard data"
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 ares-cut-sm text-marble/40 hover:text-white transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Integration Health Monitor */}
      <IntegrationHealthMonitor health={health} />

      {/* Platform Quick Stats + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformQuickStats stats={{ posts: stats.posts, events: stats.events, docs: stats.docs }} />
        <CommandQuickActions />
      </div>

      {/* Zulip Bot Status */}
      <ZulipBotCommands />

      {/* External Knowledge Sources Manager */}
      <ExternalSourcesManager />

      {/* Team Availability Widget and Broadcast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamAvailability />
        <BroadcastWidget />
      </div>
    </div>
  );
}
