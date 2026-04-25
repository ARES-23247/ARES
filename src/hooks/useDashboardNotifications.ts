// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useQuery } from "@tanstack/react-query";
import { DashboardSession, DashboardPermissions } from "./useDashboardSession";
import { api } from "../api/client";

export function useDashboardNotifications(
  session: DashboardSession | null,
  permissions: DashboardPermissions
) {
  const { data: actionItemsRes } = api.notifications.getDashboardActionItems.useQuery(
    ["admin", "action-items"],
    {}, 
    {
      enabled: !!(session && permissions.isAuthorized),
      refetchInterval: 60000,
    }
  );

  const data = actionItemsRes?.status === 200 ? actionItemsRes.body : { inquiries: [], posts: [], events: [], docs: [] };

  const pendingInquiries = data.inquiries || [];
  const pendingPosts = data.posts || [];
  const pendingEvents = data.events || [];
  const pendingDocs = data.docs || [];

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
