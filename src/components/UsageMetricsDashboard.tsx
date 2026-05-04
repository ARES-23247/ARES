import { BarChart3, Users, Eye, Database, Activity, Clock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Card, Title, Text, Flex, LineChart } from "@tremor/react";

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
              <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px]">Total Page Views</Text>
              <Title className="text-white text-2xl font-black">{data?.totalPageViews.toLocaleString() || "0"}</Title>
            </div>
            <Eye className="text-ares-cyan" size={20} />
          </Flex>
        </Card>

        <Card className="bg-black/40 border-white/5 ares-cut-lg">
          <Flex alignItems="start">
            <div className="truncate">
              <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px]">Unique Visitors</Text>
              <Title className="text-white text-2xl font-black">{data?.uniqueVisitors.toLocaleString() || "0"}</Title>
            </div>
            <Users className="text-ares-gold" size={20} />
          </Flex>
        </Card>

        <Card className="bg-black/40 border-white/5 ares-cut-lg">
          <Flex alignItems="start">
            <div className="truncate">
              <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px]">Avg Session</Text>
              <Title className="text-white text-2xl font-black">{(data?.avgSessionDuration ?? 0) > 0 ? `${data?.avgSessionDuration ?? 0}s` : "N/A"}</Title>
            </div>
            <Clock className="text-ares-bronze" size={20} />
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

      {/* User Activity Chart */}
      <Card className="bg-black/40 border-white/5 ares-cut-lg p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <BarChart3 size={20} className="text-ares-cyan" />
          User Activity (Last 30 Days)
        </h3>
        {data?.userActivity && data.userActivity.length > 0 ? (
          <LineChart
            className="h-64 mt-4"
            data={data.userActivity.map(a => ({
              date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              'Page Views': a.pageViews,
              'Unique Visitors': a.uniqueVisitors,
            }))}
            index="date"
            categories={['Page Views', 'Unique Visitors']}
            colors={['cyan', 'amber']}
            valueFormatter={(value) => value.toLocaleString()}
            showAnimation={true}
          />
        ) : (
          <p className="text-sm text-marble/40 text-center py-8">No activity data available</p>
        )}
      </Card>

      {/* Resource Usage */}
      <Card className="bg-black/40 border-white/5 ares-cut-lg p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Database size={20} className="text-ares-bronze" />
          Resource Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 p-4 ares-cut-sm">
            <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px] mb-2">Total Assets</Text>
            <Title className="text-white text-xl font-black">{data?.resourceUsage?.totalAssets.toLocaleString() || "0"}</Title>
          </div>
          <div className="bg-white/5 p-4 ares-cut-sm">
            <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px] mb-2">Storage Used</Text>
            <Title className="text-white text-xl font-black">
              {(data?.resourceUsage?.totalStorage ?? 0) > 0
                ? `${((data?.resourceUsage?.totalStorage ?? 0) / 1024 / 1024).toFixed(2)} MB`
                : "N/A"}
            </Title>
          </div>
          <div className="bg-white/5 p-4 ares-cut-sm">
            <Text className="text-marble/40 uppercase tracking-widest font-black text-[10px] mb-2">API Calls</Text>
            <Title className="text-white text-xl font-black">{data?.resourceUsage?.apiCalls.toLocaleString() || "0"}</Title>
          </div>
        </div>
      </Card>
    </div>
  );
}
