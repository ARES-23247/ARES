import { BarChart3, Users, Eye, Database, Activity, Clock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Card, Title, Text, Flex } from "@tremor/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

import DashboardPageHeader from "./dashboard/DashboardPageHeader";

export default function UsageMetricsDashboard() {
  const { data: metricsData, isLoading, isError } = api.analytics.getUsageMetrics.useQuery(["usage-metrics"], {});

  interface MetricsData {
    summary: {
      totalPageViews: number;
      uniqueVisitors: number;
      avgSessionDuration: number;
      topPages: { path: string; views: number; uniqueVisitors: number }[];
      topReferrers: { referrer: string; visits: number }[];
      userActivity: { date: string; pageViews: number; uniqueVisitors: number }[];
      latency?: { date: string; avg_latency: number }[];
      resourceUsage: {
        totalAssets: number;
        totalStorage: number;
        apiCalls: number;
      };
    };
  }

  const rawBody = (metricsData as unknown as { body?: MetricsData | unknown[] })?.body;
  const data = metricsData?.status === 200 && rawBody && !Array.isArray(rawBody) ? rawBody.summary : null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-32 bg-white/5 ares-cut-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-white/5 ares-cut-lg" />
          <div className="h-32 bg-white/5 ares-cut-lg" />
          <div className="h-32 bg-white/5 ares-cut-lg" />
          <div className="h-32 bg-white/5 ares-cut-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white/5 ares-cut-lg" />
          <div className="h-64 bg-white/5 ares-cut-lg" />
        </div>
      </div>
    );
  }

  // Format activity data for Recharts
  const activityData = data?.userActivity?.map(a => ({
    date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    "Page Views": a.pageViews,
    "Unique Visitors": a.uniqueVisitors,
  })) || [];

  // Format latency data for Recharts
  const latencyData = data?.latency?.map(l => ({
    date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    "Avg Latency (ms)": Math.round(l.avg_latency),
  })) || [];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Usage Metrics"
        subtitle="Admin-only visibility into platform traffic patterns and resource consumption."
        icon={<BarChart3 className="text-ares-cyan" />}
      />

      {isError && (
        <div className="bg-ares-red/10 border border-ares-red/30 p-4 ares-cut-sm text-ares-red text-xs font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ares-red animate-pulse" />
          TELEMETRY FAULT: Failed to synchronize usage metrics.
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-black/40 border-white/5 ares-cut-lg">
          <Flex alignItems="start">
            <div className="truncate">
              <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px]">Total API Calls</Text>
              <Title className="text-white text-2xl font-black">{data?.resourceUsage?.apiCalls.toLocaleString() || "0"}</Title>
            </div>
            <Activity className="text-ares-cyan" size={20} />
          </Flex>
        </Card>

        <Card className="bg-black/40 border-white/5 ares-cut-lg">
          <Flex alignItems="start">
            <div className="truncate">
              <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px]">Total Page Views</Text>
              <Title className="text-white text-2xl font-black">{data?.totalPageViews.toLocaleString() || "0"}</Title>
            </div>
            <Eye className="text-ares-gold" size={20} />
          </Flex>
        </Card>

        <Card className="bg-black/40 border-white/5 ares-cut-lg">
          <Flex alignItems="start">
            <div className="truncate">
              <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px]">Unique Visitors</Text>
              <Title className="text-white text-2xl font-black">{data?.uniqueVisitors.toLocaleString() || "0"}</Title>
            </div>
            <Users className="text-ares-bronze" size={20} />
          </Flex>
        </Card>

        <Card className="bg-black/40 border-white/5 ares-cut-lg">
          <Flex alignItems="start">
            <div className="truncate">
              <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px]">Total Assets</Text>
              <Title className="text-white text-2xl font-black">{data?.resourceUsage?.totalAssets.toLocaleString() || "0"}</Title>
            </div>
            <Database className="text-ares-red" size={20} />
          </Flex>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Activity Chart */}
        <Card className="bg-black/40 border-white/5 ares-cut-lg p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-ares-cyan" />
            User Activity (Last 30 Days)
          </h3>
          {activityData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Page Views" stroke="#00e5ff" strokeWidth={2} dot={{ r: 3, fill: '#00e5ff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Unique Visitors" stroke="#ffc107" strokeWidth={2} dot={{ r: 3, fill: '#ffc107' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-marble/40 text-center py-8">No activity data available</p>
          )}
        </Card>

        {/* API Latency Chart */}
        <Card className="bg-black/40 border-white/5 ares-cut-lg p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-ares-bronze" />
            API Latency (Last 30 Days)
          </h3>
          {latencyData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(val) => `${val}ms`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                    formatter={(val) => [`${val} ms`, 'Avg Latency']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Avg Latency (ms)" stroke="#ff5722" strokeWidth={2} dot={{ r: 3, fill: '#ff5722' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-marble/40 text-center py-8">No latency data available</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Pages */}
        <Card className="bg-black/40 border-white/5 ares-cut-lg p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity size={20} className="text-ares-cyan" />
            Top Performing Pages
          </h3>
          <div className="space-y-3">
            {(data?.topPages || []).map((page: { path: string; views: number }, idx: number) => (
              <div key={page.path} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xs font-mono text-marble/40 w-4">0{idx + 1}</span>
                  <div className="flex flex-col truncate">
                    <Link to={page.path} className="text-sm text-marble hover:text-ares-gold transition-colors truncate flex items-center gap-1">
                      {page.path}
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </div>
                <div className="text-sm font-black text-white bg-white/5 px-2 py-1 ares-cut-sm">{page.views}</div>
              </div>
            ))}
            {(!data?.topPages || data.topPages.length === 0) && (
              <p className="text-sm text-marble/40 text-center py-8">No page data available</p>
            )}
          </div>
        </Card>

        {/* Top Referrers */}
        <Card className="bg-black/40 border-white/5 ares-cut-lg p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ExternalLink size={20} className="text-ares-gold" />
            Top Referrers
          </h3>
          <div className="space-y-3">
            {(data?.topReferrers || []).map((referrer: { referrer: string; visits: number }, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xs font-mono text-marble/40 w-4">0{idx + 1}</span>
                  <span className="text-sm text-marble truncate max-w-[250px]">
                    {referrer.referrer.length > 40 ? referrer.referrer.substring(0, 40) + "..." : referrer.referrer}
                  </span>
                </div>
                <div className="text-sm font-black text-white bg-white/5 px-2 py-1 ares-cut-sm">{referrer.visits}</div>
              </div>
            ))}
            {(!data?.topReferrers || data.topReferrers.length === 0) && (
              <p className="text-sm text-marble/40 text-center py-8">No referrer data available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
