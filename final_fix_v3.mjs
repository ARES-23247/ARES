import fs from 'fs';
import { execSync } from 'child_process';

function fixAST(ast, slug) {
    if (!ast || !ast.content) return ast;

    let newContent = [...ast.content];

    // 1. Strip Frontmatter from Quiz
    if (slug === 'interactive-java-basics-quiz') {
        const frontmatterKeywords = ['title:', 'description:', 'sidebar:', 'order:'];
        newContent = newContent.filter(node => {
            if (node.type === 'paragraph' && node.content?.[0]?.text) {
                const text = node.content[0].text;
                // If the paragraph contains more than 2 frontmatter keywords, it's likely frontmatter
                const matchCount = frontmatterKeywords.filter(k => text.includes(k)).length;
                if (matchCount >= 2) return false;
            }
            return true;
        });
    }

    // 2. Fix Emojis in all nodes recursively
    function walkAndFix(node) {
        if (node.text) {
            node.text = node.text.replace(/\?\?\? Good:/g, '✅ Good:');
            node.text = node.text.replace(/\?\? Good:/g, '✅ Good:');
            node.text = node.text.replace(/\?\?\? Solution:/g, '💡 Solution:');
            node.text = node.text.replace(/\?\? Solution:/g, '💡 Solution:');
            node.text = node.text.replace(/\?\?\? /g, '→ '); // General arrow fix
            node.text = node.text.replace(/\?\?15-20/g, '±15-20');
            node.text = node.text.replace(/Iteration time: 2 hours \?\?\? 15/g, 'Iteration time: 2 hours → 15');
            node.text = node.text.replace(/Iteration time: 2 hours \?\? 15/g, 'Iteration time: 2 hours → 15');
        }
        if (node.content) {
            node.content.forEach(walkAndFix);
        }
    }

    newContent.forEach(walkAndFix);
    ast.content = newContent;
    return ast;
}

function processDoc(slug) {
    console.log(`Final fix for ${slug}...`);
    try {
        const jsonOutput = execSync(`npx wrangler d1 execute ares-db --local --command "SELECT content FROM docs WHERE slug = '${slug}'" --json`, { encoding: 'utf8' });
        const data = JSON.parse(jsonOutput);
        const results = Array.isArray(data) ? data[0].results : data.results;
        if (!results || results.length === 0) return;
        
        let content = results[0].content;
        let ast;
        if (content.trim().startsWith('{')) {
            ast = JSON.parse(content);
        } else {
            console.log(`Skipping ${slug}, not JSON.`);
            return;
        }

        const fixedAst = fixAST(ast, slug);
        
        // Final Unicode Safe Encode
        const astJson = JSON.stringify(fixedAst).replace(/[\u007F-\uFFFF]/g, chr => "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).slice(-4));
        const sqlUpdate = `UPDATE docs SET content = '${astJson.replace(/'/g, "''")}' WHERE slug = '${slug}';`;
        
        fs.writeFileSync('temp_update.sql', sqlUpdate, 'utf8');
        execSync(`npx wrangler d1 execute ares-db --local --file temp_update.sql`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to fix ${slug}:`, e);
    }
}

const targetSlugs = [
    'guides-troubleshooting',
    'guides-performance-benchmarks',
    'interactive-java-basics-quiz',
    'tutorials-zero-allocation'
];

targetSlugs.forEach(processDoc);
console.log("All fixes applied successfully.");
