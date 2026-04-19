
const triggers = ['Solution:', '✅ Good:', 'Good:', 'Result:'];

function migrateAST(content) {
  const newContent = [];
  let i = 0;
  const oldContent = content;

  while (i < oldContent.length) {
    const node = oldContent[i];
    const nodeText = (node.content?.map(c => c.text).join('') || '').trim();
    
    const trigger = triggers.find(t => nodeText.startsWith(t) || nodeText.startsWith(t.replace(':', '')));

    if (trigger && node.type === 'paragraph') {
      console.log('Match found:', nodeText);
      const revealNodes = [];
      const summary = nodeText;
      i++;
      
      while (i < oldContent.length && oldContent[i].type !== 'heading') {
        const nextNode = oldContent[i];
        const nextNodeText = (nextNode.content?.map(c => c.text).join('') || '').trim();
        
        if (triggers.some(t => nextNodeText.startsWith(t) || nextNodeText.startsWith(t.replace(':', '')))) {
            console.log('Stopping at next trigger:', nextNodeText);
            break;
        }
        console.log('Collecting node:', nextNode.type);
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
        console.log('No nodes collected for reveal');
        newContent.push(node);
      }
    } else {
      newContent.push(node);
      i++;
    }
  }

  return newContent;
}

const testData = [
  { type: 'paragraph', content: [{ text: 'Solutions:' }] },
  { type: 'codeBlock', attrs: { language: 'java' }, content: [{ text: 'test' }] },
  { type: 'heading', attrs: { level: 2 }, content: [{ text: 'Next' }] }
];

console.log(JSON.stringify(migrateAST(testData), null, 2));
