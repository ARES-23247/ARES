import { useQuery } from "@tanstack/react-query";
import { DashboardSession, DashboardPermissions } from "./useDashboardSession";
import { adminApi } from "../api/adminApi";

export function useDashboardNotifications(
  session: DashboardSession | null,
  permissions: DashboardPermissions
) {
  const { data: inquiriesData } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: async () => {
      const d = await adminApi.get<{ inquiries?: { id: string, status: string, name: string, type: string }[] }>("/api/inquiries");
      return d.inquiries || [];
    },
    enabled: !!(session && permissions.canSeeInquiries),
    refetchInterval: 30000,
  });

  const { data: postsData } = useQuery({
    queryKey: ["admin_posts"],
    queryFn: async () => {
      const d = await adminApi.get<{ posts?: { slug: string, status: string, title: string, is_deleted?: number, author_nickname?: string }[] }>("/api/admin/posts/list");
      return d.posts || [];
    },
    enabled: !!(session && permissions.isAuthorized),
    refetchInterval: 30000,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["admin_events_notifications"],
    queryFn: async () => {
      const d = await adminApi.get<{ events?: { id: string, status: string, title: string, is_deleted?: number }[] }>("/api/admin/events");
      return d.events || [];
    },
    enabled: !!(session && permissions.isAuthorized),
    refetchInterval: 30000,
  });

  const { data: docsData } = useQuery({
    queryKey: ["admin_docs"],
    queryFn: async () => {
      const d = await adminApi.get<{ docs?: { slug: string, status: string, title: string, is_deleted?: number }[] }>("/api/admin/docs/list");
      return d.docs || [];
    },
    enabled: !!(session && permissions.isAuthorized),
    refetchInterval: 30000,
  });

  const pendingInquiries = inquiriesData?.filter((i) => i.status === "pending") || [];
  const pendingPosts = postsData?.filter((p) => p.status === "pending" && !p.is_deleted) || [];
  const pendingEvents = eventsData?.filter((e) => e.status === "pending" && !e.is_deleted) || [];
  const pendingDocs = docsData?.filter((d) => d.status === "pending" && !d.is_deleted) || [];

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
