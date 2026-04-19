import fs from 'fs';
import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

const slug = process.argv[2];
const triggers = (process.argv[3] || 'Solution:').split(',');
const outputFile = process.argv[4];

if (!slug) {
  console.error("Usage: node migrate_docs.mjs <slug> [triggerText1,triggerText2,...] [outputFile]");
  process.exit(1);
}

function convertMarkdownToAST(markdown) {
  try {
    // Check if it's already JSON
    if (markdown.trim().startsWith('{')) {
      return JSON.parse(markdown);
    }
    const html = marked.parse(markdown);
    const jsonAst = generateJSON(html, [
      StarterKit,
      Image,
      Link,
    ]);
    return jsonAst;
  } catch (e) {
    console.error("Failed to convert Markdown to AST", e);
    return null;
  }
}

function migrateAST(ast, triggers) {
  if (!ast || ast.type !== 'doc' || !Array.isArray(ast.content)) {
    return null;
  }

  const newContent = [];
  let i = 0;
  const oldContent = ast.content;

  while (i < oldContent.length) {
    const node = oldContent[i];

    // Check if this node is one of the triggers
    const nodeText = (node.content?.map(c => c.text).join('') || '').trim();
    const trigger = triggers.find(t => nodeText.startsWith(t) || nodeText.startsWith(t.replace(':', '')));

    if (trigger && node.type === 'paragraph') {
      const revealNodes = [];
      const summary = nodeText; // Use the whole paragraph text as summary
      i++; // skip trigger node
      
      // Collect nodes until next heading or next trigger or end of doc
      while (i < oldContent.length && oldContent[i].type !== 'heading') {
        const nextNodeText = (oldContent[i].content?.map(c => c.text).join('') || '').trim();
        if (triggers.some(t => nextNodeText.startsWith(t) || nextNodeText.startsWith(t.replace(':', '')))) {
          break;
        }
        revealNodes.push(oldContent[i]);
        i++;
      }

      if (revealNodes.length > 0) {
        newContent.push({
          type: 'reveal',
          attrs: { summary: summary },
          content: revealNodes
        });
      }
    } else {
      newContent.push(node);
      i++;
    }
  }

  return { ...ast, content: newContent };
}

// Read from stdin (piped from wrangler d1)
let inputData = '';
process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(inputData);
    const results = Array.isArray(data) ? data[0].results : data.results;
    
    if (!results || results.length === 0) {
      console.error("No results found for slug:", slug);
      process.exit(1);
    }

    const originalContent = results[0].content;
    const ast = convertMarkdownToAST(originalContent);
    const migratedAst = migrateAST(ast, triggers);

    if (migratedAst) {
      const sqlUpdate = `UPDATE docs SET content = '${JSON.stringify(migratedAst).replace(/'/g, "''")}' WHERE slug = '${slug}';`;
      if (outputFile) {
        fs.writeFileSync(outputFile, sqlUpdate, 'utf8');
        console.log(`Migration SQL written to ${outputFile}`);
      } else {
        process.stdout.write(sqlUpdate);
      }
    }
  } catch (e) {
    console.error("Error processing input:", e);
    process.exit(1);
  }
});
