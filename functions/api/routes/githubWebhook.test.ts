 
import { describe, it, expect, vi, beforeEach } from "vitest";
import githubWebhookRouter from "./githubWebhook";
import { mockExecutionContext } from "../../../src/test/utils";

describe("GitHub Webhook Router", () => {
  const env = {
    GITHUB_WEBHOOK_SECRET: "test-secret",
    DB: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject requests with invalid signature", async () => {
    const payload = JSON.stringify({ action: "created" });
    const req = new Request("http://localhost/", {
      method: "POST",
      body: payload,
      headers: {
        "X-Hub-Signature-256": "sha256=invalid",
        "X-GitHub-Event": "push",
      },
    });

    const res = await githubWebhookRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(401);
  });

  it("should fail-closed if secret is missing", async () => {
    const req = new Request("http://localhost/", { method: "POST" });
    const res = await githubWebhookRouter.request(req, {}, { ...env, GITHUB_WEBHOOK_SECRET: "" }, mockExecutionContext);
    expect(res.status).toBe(503);
  });
});
