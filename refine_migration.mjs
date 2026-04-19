import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import fs from 'fs';
import { execSync } from 'child_process';

const triggers = ['Solution:', 'Solutions:', '✅ Good:', 'Good:', 'Result:', 'Answer:', 'Check answer:', 'Show answer:'];

function stripFrontmatter(markdown) {
    if (markdown.startsWith('---')) {
        const end = markdown.indexOf('---', 3);
        if (end !== -1) {
            return markdown.substring(end + 3).trim();
        }
    }
    // Handle the case where it might be in a header (like the bug I saw)
    return markdown.replace(/title: ".*" description: ".*" sidebar: order: \d+/, '').trim();
}

function convertMarkdownToAST(markdown) {
  const cleanMarkdown = stripFrontmatter(markdown);
  const html = marked.parse(cleanMarkdown);
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
    
    // Normal paragraph trigger
    const nodeText = (node.content?.map(c => c.text).join('') || '').trim();
    const trigger = triggers.find(t => nodeText.startsWith(t) || nodeText.startsWith(t.replace(':', '')));

    if (trigger && node.type === 'paragraph') {
      const revealNodes = [];
      const summary = nodeText;
      i++;
      
      while (i < oldContent.length && oldContent[i].type !== 'heading') {
        const nextNode = oldContent[i];
        const nextNodeText = (nextNode.content?.map(c => c.text).join('') || '').trim();
        if (triggers.some(t => nextNodeText.startsWith(t) || nextNodeText.startsWith(t.replace(':', '')))) {
            break;
        }
        revealNodes.push(nextNode);
        i++;
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
    } 
    // Handle code block splitting for Benchmarks
    else if (node.type === 'codeBlock') {
        const lines = (node.content?.[0]?.text || '').split('\n');
        let currentBlock = [];
        let inReveal = false;
        let currentTrigger = '';
        let revealLines = [];

        for (const line of lines) {
            const lineTrigger = triggers.find(t => line.trim().startsWith(t) || line.trim().startsWith(t.replace(':', '')));
            if (lineTrigger) {
                if (currentBlock.length > 0) {
                    newContent.push({ type: 'codeBlock', attrs: node.attrs, content: [{ type: 'text', text: currentBlock.join('\n') }] });
                    currentBlock = [];
                }
                inReveal = true;
                currentTrigger = line.trim();
                revealLines = [];
            } else if (inReveal && (line.trim().startsWith('//') || line.trim() === '')) {
                // Heuristic: if it's a comment or empty line after a trigger, keep it in reveal
                revealLines.push(line);
            } else if (inReveal) {
                // If it's actual code, it might end the reveal or should it be included?
                // For benchmarks, the code IS the solution.
                revealLines.push(line);
            } else {
                currentBlock.push(line);
            }
        }

        if (inReveal) {
            newContent.push({
                type: 'reveal',
              attrs: { summary: currentTrigger },
              content: [{ type: 'codeBlock', attrs: node.attrs, content: [{ type: 'text', text: revealLines.join('\n') }] }]
            });
        } else if (currentBlock.length > 0) {
            newContent.push({ type: 'codeBlock', attrs: node.attrs, content: [{ type: 'text', text: currentBlock.join('\n') }] });
        }
        i++;
    }
    else {
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
        
        let originalContent = results[0].content;
        
        // Final fix for the bench ??? 
        if (slug === 'guides-performance-benchmarks') {
            originalContent = originalContent.replace(/Iteration time: 2 hours \?\?\? 15 minutes/g, 'Iteration time: 2 hours → 15 minutes');
            originalContent = originalContent.replace(/Path error: ±15-20 cm/g, 'Path error: ±15-20 cm');
        }

        let ast;
        if (originalContent.trim().startsWith('{')) {
            ast = JSON.parse(originalContent);
        } else {
            ast = convertMarkdownToAST(originalContent);
        }

        const migratedAst = migrateAST(ast);
        const sqlUpdate = `UPDATE docs SET content = '${JSON.stringify(migratedAst).replace(/'/g, "''")}' WHERE slug = '${slug}';`;
        
        fs.writeFileSync('temp_update.sql', sqlUpdate, 'utf8');
        execSync(`npx wrangler d1 execute ares-db --local --file temp_update.sql`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to migrate ${slug}:`, e);
    }
}

const targetSlugs = [
    'guides-troubleshooting',
    'guides-performance-benchmarks',
    'interactive-java-basics-quiz',
    'troubleshooting-hardware-bus',
    'troubleshooting-network-issues',
    'tutorials-zero-allocation'
];

targetSlugs.forEach(processDoc);
console.log("All tasks complete.");
