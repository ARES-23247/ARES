import fs from 'fs';
import { execSync } from 'child_process';

function fixAST(ast, slug) {
    if (!ast || !ast.content) return ast;

    const keywords = ['title:', 'description:', 'sidebar:', 'order:'];
    
    // Aggressive filter: remove any node that contains 2 or more frontmatter keywords
    let newContent = ast.content.filter(node => {
        const nodeStr = JSON.stringify(node);
        const matchCount = keywords.filter(k => nodeStr.includes(k)).length;
        if (matchCount >= 2) {
            console.log(`Removing node containing frontmatter from ${slug}`);
            return false;
        }
        return true;
    });

    // Recursively clean text nodes just in case some fragments remain
    function walkAndFix(node) {
        if (node.text) {
            // Fix remains of mangled emojis if any
            node.text = node.text.replace(/\?\?\?/g, '→');
            node.text = node.text.replace(/\?\?/g, '→');
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
    console.log(`Fixing ${slug}...`);
    try {
        const jsonOutput = execSync(`npx wrangler d1 execute ares-db --local --command "SELECT content FROM docs WHERE slug = '${slug}'" --json`, { encoding: 'utf8' });
        const data = JSON.parse(jsonOutput);
        const results = Array.isArray(data) ? data[0].results : data.results;
        if (!results || results.length === 0) return;
        
        let content = results[0].content;
        if (!content.trim().startsWith('{')) {
            console.log(`Skipping ${slug}, not JSON.`);
            return;
        }

        const ast = JSON.parse(content);
        const fixedAst = fixAST(ast, slug);
        
        const astJson = JSON.stringify(fixedAst).replace(/[\u007F-\uFFFF]/g, chr => "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).slice(-4));
        const sqlUpdate = `UPDATE docs SET content = '${astJson.replace(/'/g, "''")}' WHERE slug = '${slug}';`;
        
        fs.writeFileSync('temp_update.sql', sqlUpdate, 'utf8');
        execSync(`npx wrangler d1 execute ares-db --local --file temp_update.sql`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to fix ${slug}:`, e);
    }
}

const targetSlugs = [
    'guides-performance-benchmarks',
    'interactive-java-basics-quiz',
    'tutorials-zero-allocation'
];

targetSlugs.forEach(processDoc);
console.log("Fixes deployed.");
