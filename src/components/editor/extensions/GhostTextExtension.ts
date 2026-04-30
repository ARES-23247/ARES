import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const GhostTextPluginKey = new PluginKey("ghostText");

export interface GhostTextOptions {
  //
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ghostText: {
      setGhostText: (text: string) => ReturnType;
      clearGhostText: () => ReturnType;
    };
  }
}

export const GhostTextExtension = Extension.create<GhostTextOptions>({
  name: "ghostText",

  addOptions() {
    return {};
  },

  addCommands() {
    return {
      setGhostText:
        (text: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(GhostTextPluginKey, { text });
          }
          return true;
        },
      clearGhostText:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(GhostTextPluginKey, { text: null });
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: GhostTextPluginKey,
        state: {
          init() {
            return { text: null };
          },
          apply(tr, value) {
            const meta = tr.getMeta(GhostTextPluginKey);
            if (meta) {
              return meta;
            }
            // Clear if selection changes
            if (tr.selectionSet) {
               return { text: null };
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            const { text } = this.getState(state);
            if (!text) return DecorationSet.empty;

            const { to } = state.selection;
            
            const widget = document.createElement("span");
            widget.className = "text-zinc-500 opacity-50 pointer-events-none select-none";
            widget.textContent = text;

            const decoration = Decoration.widget(to, widget, {
              side: 1,
            });

            return DecorationSet.create(state.doc, [decoration]);
          },
          handleKeyDown(view, event) {
            const { text } = this.getState(view.state);
            if (text && event.key === "Tab") {
              event.preventDefault();
              // Accept suggestion
              const tr = view.state.tr;
              tr.insertText(text, view.state.selection.to);
              tr.setMeta(GhostTextPluginKey, { text: null });
              view.dispatch(tr);
              return true;
            }
            return false;
          }
        },
      }),
    ];
  },
});
