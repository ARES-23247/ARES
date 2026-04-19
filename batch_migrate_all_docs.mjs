import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import fs from 'fs';
import { execSync } from 'child_process';

const triggers = ['Solution:', 'Solutions:', '✅ Good:', 'Good:', 'Result:', 'Answer:', 'Check answer:', 'Show answer:'];

function stripFrontmatter(markdown) {
    let clean = markdown.trim();
    if (clean.startsWith('---')) {
        const end = clean.indexOf('---', 3);
        if (end !== -1) {
            clean = clean.substring(end + 3).trim();
        }
    }
    const altRegex = /^(title:\s*".*?"|description:\s*".*?"|sidebar:\s*|order:\s*\d+\s*|\s*)+/s;
    clean = clean.replace(altRegex, '').trim();
    return clean;
}

function convertMarkdownToAST(markdown) {
  const cleanMarkdown = stripFrontmatter(markdown);
  const html = marked.parse(cleanMarkdown);
  return generateJSON(html, [StarterKit, Image, Link]);
}

function aggressivePurgeASTFrontmatter(ast) {
    if (!ast || !ast.content) return ast;
    const keywords = ['title:', 'description:', 'sidebar:', 'order:'];
    ast.content = ast.content.filter(node => {
        const nodeStr = JSON.stringify(node);
        const matchCount = keywords.filter(k => nodeStr.includes(k)).length;
        if (matchCount >= 2) {
            return false;
        }
        return true;
    });
    return ast;
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
    
    // Process text nodes for emoji/symbol repairs globally
    function walkAndFix(subNode) {
        if (subNode.text) {
            subNode.text = subNode.text.replace(/\?\?\? Good:/g, '✅ Good:');
            subNode.text = subNode.text.replace(/\?\? Good:/g, '✅ Good:');
            subNode.text = subNode.text.replace(/\?\?\? Solution:/g, '💡 Solution:');
            subNode.text = subNode.text.replace(/\?\? Solution:/g, '💡 Solution:');
            // Try to avoid blanket replacing all ??? if it's intentional, but here we assume it's arrow corruption
            subNode.text = subNode.text.replace(/Iteration time: 2 hours \?\?\? 15/g, 'Iteration time: 2 hours → 15');
            subNode.text = subNode.text.replace(/Iteration time: 2 hours \?\? 15/g, 'Iteration time: 2 hours → 15');
            subNode.text = subNode.text.replace(/\?\?15-20/g, '±15-20');
        }
        if (subNode.content) subNode.content.forEach(walkAndFix);
    }
    walkAndFix(node);

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
        walkAndFix(nextNode); // Ensure inside nodes are also fixed
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
                revealLines.push(line);
            } else if (inReveal) {
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
        const jsonOutput = execSync(`npx wrangler d1 execute ares-db --local --command "SELECT content FROM docs WHERE slug = '${slug}'" --json`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const data = JSON.parse(jsonOutput);
        const results = Array.isArray(data) ? data[0].results : data.results;
        if (!results || results.length === 0) return;
        
        let originalContent = results[0].content;
        if (!originalContent) return;

        let ast;
        if (originalContent.trim().startsWith('{')) {
            ast = JSON.parse(originalContent);
            ast = aggressivePurgeASTFrontmatter(ast); // Purge before formatting
        } else {
            ast = convertMarkdownToAST(originalContent);
        }

        const migratedAst = migrateAST(ast);
        
        // Use Unicode escaping for the JSON to ensure D1 handles it correctly regardless of shell encoding
        const astJson = JSON.stringify(migratedAst).replace(/[\u007F-\uFFFF]/g, chr => "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).slice(-4));
        const sqlUpdate = `UPDATE docs SET content = '${astJson.replace(/'/g, "''")}' WHERE slug = '${slug}';`;
        
        fs.writeFileSync('temp_update.sql', sqlUpdate, 'utf8');
        execSync(`npx wrangler d1 execute ares-db --local --file temp_update.sql`, { stdio: 'pipe' });
        console.log(`Successfully completed: ${slug}`);
    } catch (e) {
        console.error(`Failed to migrate ${slug}`);
        // console.error(e.message);
    }
}

function getSlugs() {
    try {
        const jsonOutput = execSync(`npx wrangler d1 execute ares-db --local --command "SELECT slug FROM docs;" --json`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const data = JSON.parse(jsonOutput);
        const results = Array.isArray(data) ? data[0].results : data.results;
        return results.map(r => r.slug);
    } catch (e) {
        console.error("Failed to fetch slugs", e);
        return [];
    }
}

const allSlugs = getSlugs();
console.log(`Found ${allSlugs.length} documents to process.`);

allSlugs.forEach(slug => {
    processDoc(slug);
});
console.log("Global Batch Migration Complete.");
