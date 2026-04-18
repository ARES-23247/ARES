import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance } from 'tippy.js';
import { SuggestionProps } from '@tiptap/suggestion';

export const suggestionRenderer = (component: any) => {
  return {
    onStart: (props: SuggestionProps & { renderer: ReactRenderer, popup: Instance[] }) => {
      props.renderer = new ReactRenderer(component, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      props.popup = tippy('body', {
        getReferenceClientRect: props.clientRect as any,
        appendTo: () => document.body,
        content: props.renderer.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      }) as Instance[];
    },

    onUpdate(props: SuggestionProps & { renderer: ReactRenderer, popup: Instance[] }) {
      props.renderer.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      props.popup[0].setProps({
        getReferenceClientRect: props.clientRect as any,
      });
    },

    onKeyDown(props: SuggestionProps & { renderer: ReactRenderer, popup: Instance[] }) {
      if (props.event.key === 'Escape') {
        props.popup[0].hide();
        return true;
      }

      return (props.renderer.ref as any)?.onKeyDown(props);
    },

    onExit(props: SuggestionProps & { renderer: ReactRenderer, popup: Instance[] }) {
      props.popup[0].destroy();
      props.renderer.destroy();
    },
  };
};
