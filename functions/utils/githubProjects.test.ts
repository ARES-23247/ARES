import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @octokit/graphql
const mockGraphqlFn = vi.fn();
vi.mock("@octokit/graphql", () => ({
  graphql: {
    defaults: vi.fn(() => mockGraphqlFn),
  },
}));

// Mock site config
vi.mock("./site.config", () => ({
  siteConfig: {
    team: { name: "ARES" },
    urls: { githubOrg: "ARES-23247" },
  },
}));

import {
  buildGitHubConfig,
  fetchProjectBoard,
  fetchProjectFields,
  createProjectItem,
  updateProjectItemStatus,
  queryProjectItem,
} from "./githubProjects";

describe("githubProjects Utilities", () => {
  const config = {
    pat: "ghp_test123",
    projectId: "PVT_test_id",
    org: "ARES-23247",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildGitHubConfig", () => {
    it("should return config when PAT and projectId are present", () => {
      const result = buildGitHubConfig({
        GITHUB_PAT: "ghp_abc",
        GITHUB_PROJECT_ID: "PVT_123",
        GITHUB_ORG: "TestOrg",
      });
      expect(result).toEqual({
        pat: "ghp_abc",
        projectId: "PVT_123",
        org: "TestOrg",
      });
    });

    it("should fall back to siteConfig org when GITHUB_ORG is missing", () => {
      const result = buildGitHubConfig({
        GITHUB_PAT: "ghp_abc",
        GITHUB_PROJECT_ID: "PVT_123",
      });
      expect(result).toEqual({
        pat: "ghp_abc",
        projectId: "PVT_123",
        org: "ARES-23247",
      });
    });

    it("should return null when PAT is missing", () => {
      expect(buildGitHubConfig({ GITHUB_PROJECT_ID: "PVT_123" })).toBeNull();
    });

    it("should return null when projectId is missing", () => {
      expect(buildGitHubConfig({ GITHUB_PAT: "ghp_abc" })).toBeNull();
    });

    it("should return null for empty settings", () => {
      expect(buildGitHubConfig({})).toBeNull();
    });
  });

  describe("fetchProjectBoard", () => {
    it("should parse and return project board data", async () => {
      mockGraphqlFn.mockResolvedValueOnce({
        node: {
          title: "Sprint Board",
          shortDescription: "Current sprint",
          items: {
            totalCount: 2,
            nodes: [
              {
                id: "item-1",
                type: "DRAFT_ISSUE",
                createdAt: "2025-01-01T00:00:00Z",
                updatedAt: "2025-01-02T00:00:00Z",
                content: { title: "Fix bug", body: "Description here" },
                fieldValues: {
                  nodes: [
                    { name: "In Progress", field: { name: "Status" } },
                    { users: { nodes: [{ login: "dev1" }] }, field: { name: "Assignees" } },
                  ],
                },
              },
              {
                id: "item-2",
                type: "ISSUE",
                createdAt: "2025-01-03T00:00:00Z",
                updatedAt: "2025-01-04T00:00:00Z",
                content: { title: "Add feature", body: "New feature", url: "https://github.com/issue/2" },
                fieldValues: {
                  nodes: [{ name: "Done", field: { name: "Status" } }],
                },
              },
            ],
          },
        },
      });

      const board = await fetchProjectBoard(config);
      expect(board.title).toBe("Sprint Board");
      expect(board.shortDescription).toBe("Current sprint");
      expect(board.totalCount).toBe(2);
      expect(board.items).toHaveLength(2);
      expect(board.items[0].title).toBe("Fix bug");
      expect(board.items[0].status).toBe("In Progress");
      expect(board.items[0].assignees).toEqual(["dev1"]);
      expect(board.items[1].url).toBe("https://github.com/issue/2");
    });
  });

  describe("fetchProjectFields", () => {
    it("should return mapped field data", async () => {
      mockGraphqlFn.mockResolvedValueOnce({
        node: {
          fields: {
            nodes: [
              { id: "f1", name: "Status", dataType: "SINGLE_SELECT", options: [{ id: "o1", name: "Todo" }] },
              { id: "f2", name: "Title", dataType: "TEXT" },
            ],
          },
        },
      });

      const fields = await fetchProjectFields(config);
      expect(fields).toHaveLength(2);
      expect(fields[0].name).toBe("Status");
      expect(fields[0].options).toEqual([{ id: "o1", name: "Todo" }]);
      expect(fields[1].dataType).toBe("TEXT");
    });
  });

  describe("createProjectItem", () => {
    it("should create a draft issue and return item id", async () => {
      mockGraphqlFn.mockResolvedValueOnce({
        addProjectV2DraftIssue: { projectItem: { id: "new-item-id" } },
      });

      const id = await createProjectItem(config, "New Task", "Task body");
      expect(id).toBe("new-item-id");
      expect(mockGraphqlFn).toHaveBeenCalledWith(
        expect.stringContaining("addProjectV2DraftIssue"),
        expect.objectContaining({ title: "New Task", body: "Task body" })
      );
    });

    it("should pass null body when not provided", async () => {
      mockGraphqlFn.mockResolvedValueOnce({
        addProjectV2DraftIssue: { projectItem: { id: "no-body-id" } },
      });

      await createProjectItem(config, "No Body Task");
      expect(mockGraphqlFn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: null })
      );
    });
  });

  describe("updateProjectItemStatus", () => {
    it("should update status field and return true", async () => {
      mockGraphqlFn.mockResolvedValueOnce({
        updateProjectV2ItemFieldValue: { projectV2Item: { id: "item-1" } },
      });

      const result = await updateProjectItemStatus(config, "item-1", "field-1", "option-1");
      expect(result).toBe(true);
    });
  });

  describe("queryProjectItem", () => {
    it("should return a project item with parsed fields", async () => {
      mockGraphqlFn.mockResolvedValueOnce({
        node: {
          id: "item-1",
          type: "ISSUE",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
          content: { title: "Bug Fix", body: "Fix it", url: "https://github.com/issue/1" },
          fieldValues: {
            nodes: [
              { name: "In Review", field: { name: "Status" } },
              { users: { nodes: [{ login: "reviewer1" }] }, field: { name: "Reviewers" } },
            ],
          },
        },
      });

      const item = await queryProjectItem(config, "item-1");
      expect(item).not.toBeNull();
      expect(item!.title).toBe("Bug Fix");
      expect(item!.status).toBe("In Review");
      expect(item!.assignees).toEqual(["reviewer1"]);
      expect(item!.url).toBe("https://github.com/issue/1");
    });

    it("should return null when item is not found", async () => {
      mockGraphqlFn.mockResolvedValueOnce({ node: null });

      const item = await queryProjectItem(config, "nonexistent");
      expect(item).toBeNull();
    });
  });
});
