import { z } from "zod";

export const integrationSchema = z.object({
  discord_webhook_url: z.string().optional().nullable(),
  slack_webhook_url: z.string().optional().nullable(),
  teams_webhook_url: z.string().optional().nullable(),
  gchat_webhook_url: z.string().optional().nullable(),
  github_repo: z.string().optional().nullable(),
  instagram_access_token: z.string().optional().nullable(),
  twitter_api_key: z.string().optional().nullable(),
  facebook_access_token: z.string().optional().nullable()
});

export type IntegrationPayload = z.infer<typeof integrationSchema>;
