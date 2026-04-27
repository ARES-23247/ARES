/**
 * Shared Tiptap editor hook used by DocsEditor, BlogEditor, and EventEditor.
 * Centralises all extension configuration to eliminate per-editor duplication.
 */
import { useMemo } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import { common, createLowlight } from 'lowlight';
import { getEditorExtensions } from "./core/extensions";
import 'katex/dist/katex.min.css';

export interface UseRichEditorOptions {
  /** Placeholder HTML shown when the editor is empty. */
  placeholder?: string;
}

/**
 * Returns a fully-configured Tiptap editor with every ARES extension.
 */
export function useRichEditor(options?: UseRichEditorOptions): Editor | null {
  const placeholder = options?.placeholder ?? "<p>Start writing here...</p>";
  const lowlight = useMemo(() => createLowlight(common), []);
  const extensions = useMemo(() => getEditorExtensions(lowlight), [lowlight]);

  const editor = useEditor({
    extensions,
    content: placeholder,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[400px] text-[#e6edf3] font-mono",
      },
    },
  });

  return editor;
}
