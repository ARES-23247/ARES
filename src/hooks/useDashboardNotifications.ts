import { useState, useEffect } from "react";
import { DashboardSession, DashboardPermissions } from "./useDashboardSession";
import { adminApi } from "../api/adminApi";

export function useDashboardNotifications(
  session: DashboardSession | null,
  permissions: DashboardPermissions
) {
  const [pendingInquiriesCount, setPendingInquiriesCount] = useState(0);
  const [pendingPostsCount, setPendingPostsCount] = useState(0);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);

  useEffect(() => {
    if (session && permissions.canSeeInquiries) {
      adminApi.get<{ inquiries?: { status: string }[] }>("/api/inquiries")
        .then((data) => {
          if (data.inquiries) {
            setPendingInquiriesCount(data.inquiries.filter((i) => i.status === "pending").length);
          }
        })
        .catch(() => {});
    }
    
    if (session && permissions.isAuthorized) {
      adminApi.get<{ posts?: { status: string }[] }>("/api/admin/posts/list")
        .then((data) => {
          if (data.posts) {
            setPendingPostsCount(data.posts.filter((p) => p.status === "pending").length);
          }
        })
        .catch(() => {});

      adminApi.get<{ events?: { status: string }[] }>("/api/admin/events")
        .then((data) => {
          if (data.events) {
            setPendingEventsCount(data.events.filter((e) => e.status === "pending").length);
          }
        })
        .catch(() => {});

      adminApi.get<{ docs?: { status: string }[] }>("/api/admin/docs/list")
        .then((data) => {
          if (data.docs) {
            setPendingDocsCount(data.docs.filter((d) => d.status === "pending").length);
          }
        })
        .catch(() => {});
    }
  }, [session, permissions.canSeeInquiries, permissions.isAuthorized]);

  return {
    pendingInquiriesCount,
    pendingPostsCount,
    pendingEventsCount,
    pendingDocsCount,
  };
}
