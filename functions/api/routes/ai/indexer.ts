import { Kysely, sql } from "kysely";
import { DB } from "../../../../shared/schemas/database";

/**
 * Indexes site content (events, blog posts, docs) into Cloudflare Vectorize
 * for the RAG chatbot. Runs on a cron schedule via the `scheduled` handler.
 * 
 * Strategy: Full re-index on each run. Vectorize upserts by ID, so duplicates
 * are naturally handled. We batch inserts to stay within Workers limits.
 */

interface IndexableDocument {
  id: string;
  text: string;
  metadata: Record<string, string>;
}

// Max vectors per upsert call
const BATCH_SIZE = 20;

export async function indexSiteContent(
  db: Kysely<DB>,
  ai: { run: (model: string, input: unknown) => Promise<unknown> },
  vectorize: VectorizeIndex
): Promise<{ indexed: number; errors: string[] }> {
  const documents: IndexableDocument[] = [];
  const errors: string[] = [];

  // ── 1. Index PUBLIC events only (not deleted, not draft, published_at in the past or null) ──
  try {
    const events = await db
      .selectFrom("events")
      .select(["id", "title", "description", "date_start", "date_end", "location", "category"])
      .where("is_deleted", "!=", 1)
      .where("is_draft", "!=", 1)
      .where((eb) => eb.or([eb("published_at", "is", null), eb("published_at", "<=", sql`datetime('now')` as any)]))
      .orderBy("date_start", "desc")
      .limit(100)
      .execute();

    for (const event of events) {
      let descText = event.description || "";
      // Try to parse AST, fall back to raw string
      try {
        const ast = JSON.parse(descText);
        descText = extractTextFromAst(ast);
      } catch {
        // Already plain text
      }

      const dateStr = event.date_start
        ? new Date(event.date_start).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "TBD";

      const endStr = event.date_end
        ? ` to ${new Date(event.date_end).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}`
        : "";

      documents.push({
        id: `event_${event.id}`,
        text: `Event: ${event.title}. Date: ${dateStr}${endStr}. Location: ${event.location || "TBD"}. Category: ${event.category || "general"}. ${descText}`.trim(),
        metadata: {
          type: "event",
          title: event.title || "",
          date: event.date_start || "",
        },
      });
    }
  } catch (e) {
    errors.push(`Events indexing failed: ${e}`);
  }

  // ── 2. Index published blog posts ──
  try {
    const posts = await db
      .selectFrom("posts")
      .select(["id", "title", "ast", "published_at"])
      .where("is_draft", "!=", 1)
      .where("is_deleted", "!=", 1)
      .orderBy("published_at", "desc")
      .limit(50)
      .execute();

    for (const post of posts) {
      let bodyText = "";
      if (post.ast) {
        try {
          const ast = JSON.parse(post.ast);
          bodyText = extractTextFromAst(ast);
        } catch {
          bodyText = post.ast.substring(0, 500);
        }
      }

      documents.push({
        id: `post_${post.id}`,
        text: `Blog Post: ${post.title}. Published: ${post.published_at || "unknown"}. ${bodyText}`.trim(),
        metadata: {
          type: "post",
          title: post.title || "",
          date: post.published_at || "",
        },
      });
    }
  } catch (e) {
    errors.push(`Posts indexing failed: ${e}`);
  }

  // ── 3. Index PUBLIC documentation articles only ──
  try {
    const docs = await db
      .selectFrom("documentation")
      .select(["id", "title", "content", "category"])
      .where("is_deleted", "!=", 1)
      .where("is_draft", "!=", 1)
      .limit(100)
      .execute();

    for (const doc of docs) {
      let bodyText = doc.content || "";
      try {
        const ast = JSON.parse(bodyText);
        bodyText = extractTextFromAst(ast);
      } catch {
        // Already plain text
      }

      documents.push({
        id: `doc_${doc.id}`,
        text: `Documentation: ${doc.title}. Category: ${doc.category || "general"}. ${bodyText}`.trim(),
        metadata: {
          type: "documentation",
          title: doc.title || "",
          category: doc.category || "",
        },
      });
    }
  } catch (e) {
    errors.push(`Docs indexing failed: ${e}`);
  }

  // ── 4. Index PUBLIC season records only ──
  try {
    const seasons = await db
      .selectFrom("seasons")
      .select(["id", "start_year", "challenge_name", "robot_name", "summary", "robot_description"])
      .where("status", "=", "published")
      .limit(20)
      .execute();

    for (const season of seasons) {
      let descText = season.robot_description || "";
      try {
        const ast = JSON.parse(descText);
        descText = extractTextFromAst(ast);
      } catch {
        // plain text
      }

      documents.push({
        id: `season_${season.id}`,
        text: `Season ${season.start_year}-${season.start_year + 1}: ${season.challenge_name}. Robot: ${season.robot_name || "unnamed"}. ${season.summary || ""}. ${descText}`.trim(),
        metadata: {
          type: "season",
          title: `${season.start_year} ${season.challenge_name}`,
        },
      });
    }
  } catch (e) {
    errors.push(`Seasons indexing failed: ${e}`);
  }

  if (documents.length === 0) {
    return { indexed: 0, errors };
  }

  // ── 5. Generate embeddings and upsert in batches ──
  let indexed = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);

    try {
      // Generate embeddings for the batch
      const texts = batch.map((d) => d.text.substring(0, 2000)); // Truncate to embedding model limits
      const embeddingRes = (await ai.run("@cf/baai/bge-base-en-v1.5", { text: texts })) as {
        data: number[][];
      };

      if (!embeddingRes?.data || embeddingRes.data.length !== batch.length) {
        errors.push(`Embedding batch ${i} returned mismatched results`);
        continue;
      }

      // Build vectors for Vectorize upsert
      const vectors = batch.map((doc, j) => ({
        id: doc.id,
        values: embeddingRes.data[j],
        metadata: { ...doc.metadata, text: doc.text.substring(0, 1000) },
      }));

      await vectorize.upsert(vectors);
      indexed += batch.length;
    } catch (e) {
      errors.push(`Batch ${i} upsert failed: ${e}`);
    }
  }

  return { indexed, errors };
}

/**
 * Recursively extract plain text from a Tiptap/ProseMirror AST.
 */
function extractTextFromAst(node: Record<string, unknown>): string {
  if (!node) return "";

  let text = "";

  if (node.text && typeof node.text === "string") {
    text += node.text;
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      text += extractTextFromAst(child as Record<string, unknown>) + " ";
    }
  }

  return text.trim();
}
