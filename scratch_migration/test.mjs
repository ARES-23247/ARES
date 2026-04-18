import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { CodeBlockLowlightMermaid } from 'tiptap-extension-mermaid';
import { createLowlight, common } from 'lowlight';

const lowlight = createLowlight(common);

const editor = new Editor({
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    CodeBlockLowlightMermaid.configure({ lowlight })
  ],
  content: `<pre><code class="language-javascript">const x = "hello";</code></pre>`
});

console.log("HTML Output:");
console.log(editor.getHTML());
