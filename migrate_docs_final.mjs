import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import fs from 'fs';

const slug = process.argv[2];
const triggers = (process.argv[3] || 'Solution:').split(',');
const outputFile = process.argv[4];

if (!slug) {
  console.error("Usage: node migrate_docs_final.mjs <slug> [triggerText1,triggerText2,...] [outputFile]");
  process.exit(1);
}

function convertMarkdownToAST(markdown) {
  const html = marked.parse(markdown);
  return generateJSON(html, [StarterKit, Image, Link]);
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
    const nodeText = (node.content?.map(c => c.text).join('') || '').trim();
    
    // Fuzzy match: check if starts with any trigger
    const trigger = triggers.find(t => nodeText.startsWith(t) || nodeText.startsWith(t.replace(':', '')));

    if (trigger && node.type === 'paragraph') {
      const revealNodes = [];
      const summary = nodeText;
      i++;
      
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
      } else {
        // If nothing to reveal, just push the original paragraph
        newContent.push(node);
      }
    } else {
      newContent.push(node);
      i++;
    }
  }

  return { ...ast, content: newContent };
}

// Read from stdin (Wrangler JSON output)
let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
    try {
        const data = JSON.parse(input);
        const results = Array.isArray(data) ? data[0].results : data.results;
        const originalContent = results[0].content;
        
        // Handle potential replace() or weirdness in seed content if reading from file, 
        // but here we are reading from DB, so content should be raw markdown or AST.
        
        let ast;
        if (originalContent.trim().startsWith('{')) {
            ast = JSON.parse(originalContent);
        } else {
            ast = convertMarkdownToAST(originalContent);
        }

        const migratedAst = migrateAST(ast, triggers);

        if (migratedAst) {
            const sqlUpdate = `UPDATE docs SET content = '${JSON.stringify(migratedAst).replace(/'/g, "''")}' WHERE slug = '${slug}';`;
            if (outputFile) {
                fs.writeFileSync(outputFile, sqlUpdate, 'utf8');
                console.log(`Migration SQL written to ${outputFile}`);
            } else {
                console.log(sqlUpdate);
            }
        }
    } catch (e) {
        console.error("Error processing:", e);
    }
});
