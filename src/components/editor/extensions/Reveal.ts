import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    reveal: {
      /**
       * Set a reveal block
       */
      setReveal: (attributes?: { summary: string }) => ReturnType,
      /**
       * Toggle a reveal block
       */
      toggleReveal: (attributes?: { summary: string }) => ReturnType,
    }
  }
}

export const Reveal = Node.create({
  name: 'reveal',
  group: 'block',
  content: 'block+',
  draggable: true,

  addAttributes() {
    return {
      summary: {
        default: 'Show Answer',
        parseHTML: element => element.querySelector('summary')?.innerText || 'Show Answer',
        renderHTML: attributes => ({
          'data-summary': attributes.summary,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="reveal"]',
      },
      {
        tag: 'details.reveal-block',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, { class: 'reveal-block' }),
      ['summary', {}, HTMLAttributes['data-summary'] || 'Show Answer'],
      ['div', { class: 'reveal-content' }, 0],
    ];
  },

  addCommands() {
    return {
      setReveal:
        attributes =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleReveal:
        attributes =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
    };
  },
});
