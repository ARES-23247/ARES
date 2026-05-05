/**
 * Shared constants for ARESWEB frontend.
 */

/** Default fallback image used when a blog post, event, or doc has no cover image. */
export const DEFAULT_COVER_IMAGE = "/api/media/1776551060548-favicon.webp";

/**
 * GitHub repository configuration for ARES simulations.
 * Centralized to avoid hardcoded references throughout the codebase.
 */
export const GITHUB_REPO = {
  owner: process.env.GITHUB_REPO_OWNER || 'ARES-23247',
  repo: process.env.GITHUB_REPO_NAME || 'ARESWEB',
  branch: process.env.GITHUB_BRANCH || 'main',
  apiUrl: `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER || 'ARES-23247'}/${process.env.GITHUB_REPO_NAME || 'ARESWEB'}`,
  rawUrl: `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER || 'ARES-23247'}/${process.env.GITHUB_REPO_NAME || 'ARESWEB'}/${process.env.GITHUB_BRANCH || 'main'}`,
} as const;
