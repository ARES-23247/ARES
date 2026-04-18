---
name: aresweb-ast-migration
description: Reusable pipeline and standards for safely converting standard Markdown strings into Cloudflare D1-compatible Tiptap ProseMirror Abstract Syntax Trees (AST). Use this anytime there are malformed legacy documents or large-scale document imports.
---

# ARESWEB Tiptap AST Migration Skill

The ARES 23247 CMS publisher suite natively relies on the Tiptap/ProseMirror Abstract Syntax Tree (AST) JSON format to display technical documentation, blog posts, and interactive simulators. Because the legacy framework previously utilized Astro with standard string Markdown, raw imports directly into the Cloudflare D1 `docs` table will result in unrenderable pages and `"Untitled"` dashboard names. 

Whenever you are tasked with importing, auditing, or repairing documentation in the live D1 database, you **MUST** follow this AST conversion protocol.

## 1. Remote Auditing Protocol

Always export the D1 dataset natively into JSON before diagnosing, as `wrangler` CLI strings will truncate large Markdown files in terminal environments:
```bash
npx wrangler d1 execute ares-db --remote --command="SELECT slug, title, content FROM docs;" --json > db_dump.json
```
*Note: PowerShell output environments may stream UTF-16LE containing BOM `\uFEFF`, so ensure your parser accounts for clean file reading before executing `JSON.parse()`.*

## 2. Missing Title Resolution

The ARES dashboard dynamically matches routing to titles. If a database entry shows `Untitled` (often because a legacy markdown header was stripped), implement a heuristic fallback utilizing RegEx to extract the `# Heading1` string directly from the markdown representation and securely update the table row's `title` logic.

### 3. Tiptap AST Translation Standards

Never attempt to manually structure JSON objects yourself for large files. Create a discrete sub-pipeline strictly leveraging `@tiptap/html` and `marked`. 
Do so natively within the ARES repo context (using an isolated directory with temporary non-saved packages if resolving immediate edge-cases):

```javascript
import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

// First resolve raw markdown string to standard HTML layout
const html = marked.parse(markdownContent);

// Translate directly into Tiptap's schema utilizing equivalent extensions setup
const jsonAst = generateJSON(html, [
  StarterKit,
  Image,
  Link,
]);

const finalContent = JSON.stringify(jsonAst);
```

## 4. Live Edge Execution

All operations fixing the generated Tiptap JSON should be bulk-executed safely over the Cloudflare edge to prevent local-to-remote file wiping conflicts.
1. Generate your transactions via Node.js into a standard `.sql` file utilizing standard `UPDATE docs SET title = '...', content = '...' WHERE slug = '...';` queries.
2. Escape all internal apostrophes (`'`) natively for SQLite logic by rendering them as `''`.
3. Submit the script securely via Wrangler:
```bash
npx wrangler d1 execute ares-db --remote --file=migration_queries.sql
```
4. Conclude the workflow by deleting temporary scripts to preserve zero-allocation standards inside the repository workspace.
