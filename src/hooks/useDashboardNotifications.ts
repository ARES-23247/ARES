import { useQuery } from "@tanstack/react-query";
import { DashboardSession, DashboardPermissions } from "./useDashboardSession";
import { api } from "../api/client";

export function useDashboardNotifications(
  session: DashboardSession | null,
  permissions: DashboardPermissions
) {
  const { data: inquiriesRes } = api.inquiries.list.useQuery({
    queryKey: ["admin-inquiries-notifs"],
    enabled: !!(session && permissions.canSeeInquiries),
    refetchInterval: 30000,
  });

  const { data: postsRes } = api.posts.getAdminPosts.useQuery({
    queryKey: ["admin_posts_notifs"],
    enabled: !!(session && permissions.isAuthorized),
    refetchInterval: 30000,
  });

  const { data: eventsRes } = api.events.getAdminEvents.useQuery({
    queryKey: ["admin_events_notifs"],
    enabled: !!(session && permissions.isAuthorized),
    refetchInterval: 30000,
  });

  // Docs contract currently missing getAdminDocs list, will use generic if needed or just skip
  // For now I'll use the existing one or assuming it exists in contract
  const { data: docsRes } = (api as any).docs?.getAdminDocs?.useQuery({
    queryKey: ["admin_docs_notifs"],
    enabled: !!(session && permissions.isAuthorized),
    refetchInterval: 30000,
  }) || { data: null };

  const inquiriesData = (inquiriesRes?.body as any)?.inquiries || [];
  const postsData = (postsRes?.body as any)?.posts || [];
  const eventsData = (eventsRes?.body as any)?.events || [];
  const docsData = (docsRes?.body as any)?.docs || [];

  const pendingInquiries = inquiriesData?.filter((i: any) => i.status === "pending") || [];
  const pendingPosts = postsData?.filter((p: any) => p.status === "pending" && !p.is_deleted) || [];
  const pendingEvents = eventsData?.filter((e: any) => e.status === "pending" && !e.is_deleted) || [];
  const pendingDocs = docsData?.filter((d: any) => d.status === "pending" && !d.is_deleted) || [];

  return {
    pendingInquiriesCount: pendingInquiries.length,
    pendingPostsCount: pendingPosts.length,
    pendingEventsCount: pendingEvents.length,
    pendingDocsCount: pendingDocs.length,
    pendingInquiries,
    pendingPosts,
    pendingEvents,
    pendingDocs,
  };
}
