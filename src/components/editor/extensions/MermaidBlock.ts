import { CodeBlockLowlightMermaid } from 'tiptap-extension-mermaid';

export const MermaidBlock = CodeBlockLowlightMermaid.extend({
  name: 'mermaidBlock',
  
  addNodeView() {
    return this.parent?.() || null;
  }
});
