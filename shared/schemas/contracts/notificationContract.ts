import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().nullable().optional(),
  priority: z.string().optional(),
  is_read: z.number(),
  created_at: z.string(),
});

export const notificationContract = c.router({
  getNotifications: {
    method: "GET",
    path: "/",
    responses: {
      200: z.object({
        notifications: z.array(notificationSchema),
      }),
      401: z.object({
        error: z.string(),
      }),
      500: z.object({
        error: z.string(),
        notifications: z.array(notificationSchema).optional(),
      }),
    },
    summary: "Get user notifications",
  },
  markAsRead: {
    method: "PUT",
    path: "/:id/read",
    pathParams: z.object({
      id: z.string(),
    }),
    body: c.type<null>(),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      401: z.object({
        error: z.string(),
      }),
      500: z.object({
        error: z.string(),
      }),
    },
    summary: "Mark a notification as read",
  },
  markAllAsRead: {
    method: "PUT",
    path: "/read-all",
    body: c.noBody(),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      401: z.object({
        error: z.string(),
      }),
      500: z.object({
        error: z.string(),
      }),
    },
    summary: "Mark all notifications as read",
  },
  deleteNotification: {
    method: "DELETE",
    path: "/:id",
    pathParams: z.object({
      id: z.string(),
    }),
    body: c.noBody(),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      401: z.object({
        error: z.string(),
      }),
      500: z.object({
        error: z.string(),
      }),
    },
    summary: "Delete a notification",
  },
  getPendingCounts: {
    method: "GET",
    path: "/pending-counts",
    responses: {
      200: z.object({
        inquiries: z.number(),
        posts: z.number(),
        events: z.number(),
        docs: z.number(),
      }),
      401: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
    summary: "Get counts of pending items for dashboard badges",
  },
  getDashboardActionItems: {
    method: "GET",
    path: "/action-items",
    responses: {
      200: z.object({
        inquiries: z.array(z.any()),
        posts: z.array(z.any()),
        events: z.array(z.any()),
        docs: z.array(z.any()),
      }),
      401: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
    summary: "Get detailed action items (pending requests) in a single batch",
  },
});
export type NotificationContract = typeof notificationContract;
