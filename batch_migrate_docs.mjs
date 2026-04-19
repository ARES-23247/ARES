import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import fs from 'fs';
import { execSync } from 'child_process';

const triggers = ['Solution:', 'Solutions:', '✅ Good:', 'Good:', 'Result:', 'Answer:', 'Check answer:', 'Show answer:'];

function convertMarkdownToAST(markdown) {
  // Replace potential emoji placeholders if any
  const html = marked.parse(markdown);
  return generateJSON(html, [StarterKit, Image, Link]);
}

function migrateAST(ast) {
  if (!ast || ast.type !== 'doc' || !Array.isArray(ast.content)) {
    return null;
  }

  const newContent = [];
  let i = 0;
  const oldContent = ast.content;

  while (i < oldContent.length) {
    const node = oldContent[i];
    const nodeText = (node.content?.map(c => c.text).join('') || '').trim();
    
    const trigger = triggers.find(t => nodeText.startsWith(t) || nodeText.startsWith(t.replace(':', '')));

    if (trigger && node.type === 'paragraph') {
      const revealNodes = [];
      const summary = nodeText;
      i++;
      
      while (i < oldContent.length && oldContent[i].type !== 'heading') {
        const nextNode = oldContent[i];
        const nextNodeText = (nextNode.content?.map(c => c.text).join('') || '').trim();
        
        // Don't stop at just any trigger, stop at a NEW trigger that should start its own reveal
        if (triggers.some(t => nextNodeText.startsWith(t) || nextNodeText.startsWith(t.replace(':', '')))) {
            break;
        }
        revealNodes.push(nextNode);
        i++;
      }

      if (revealNodes.length > 30) { 
        // Heuristic: if it's too long, maybe it shouldn't be a reveal? 
        // Actually for docs it's fine.
      }

      if (revealNodes.length > 0) {
        newContent.push({
          type: 'reveal',
          attrs: { summary: summary },
          content: revealNodes
        });
      } else {
        newContent.push(node);
      }
    } else {
      newContent.push(node);
      i++;
    }
  }

  return { ...ast, content: newContent };
}

function processDoc(slug) {
    console.log(`Processing ${slug}...`);
    try {
        const jsonOutput = execSync(`npx wrangler d1 execute ares-db --local --command "SELECT content FROM docs WHERE slug = '${slug}'" --json`, { encoding: 'utf8' });
        const data = JSON.parse(jsonOutput);
        const results = Array.isArray(data) ? data[0].results : data.results;
        if (!results || results.length === 0) return;
        
        const originalContent = results[0].content;
        let ast;
        if (originalContent.trim().startsWith('{')) {
            ast = JSON.parse(originalContent);
        } else {
            ast = convertMarkdownToAST(originalContent);
        }

        const migratedAst = migrateAST(ast);
        const sqlUpdate = `UPDATE docs SET content = '${JSON.stringify(migratedAst).replace(/'/g, "''")}' WHERE slug = '${slug}';`;
        
        // Write SQL to a temp file and execute it to avoid shell escaping issues
        fs.writeFileSync('temp_update.sql', sqlUpdate, 'utf8');
        execSync(`npx wrangler d1 execute ares-db --local --file temp_update.sql`, { stdio: 'inherit' });
        console.log(`Successfully migrated ${slug}`);
    } catch (e) {
        console.error(`Failed to migrate ${slug}:`, e.message);
    }
}

const targetSlugs = [
    'guides-troubleshooting',
    'guides-performance-benchmarks',
    'interactive-java-basics-quiz',
    'troubleshooting-hardware-bus',
    'troubleshooting-network-issues',
    'tutorials-zero-allocation',
    'tutorials-swerve-kinematics',
    'tutorials-sysid-tuning'
];

targetSlugs.forEach(processDoc);
console.log("All tasks complete.");
fs.unlinkSync('temp_update.sql');
