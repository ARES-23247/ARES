import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';

export const suggestionRenderer = (component: any) => {
  return {
    onStart: (props: any) => {
      props.renderer = new ReactRenderer(component, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      props.popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: props.renderer.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      });
    },

    onUpdate(props: any) {
      props.renderer.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      props.popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === 'Escape') {
        props.popup[0].hide();
        return true;
      }

      return props.renderer.ref?.onKeyDown(props);
    },

    onExit(props: any) {
      props.popup[0].destroy();
      props.renderer.destroy();
    },
  };
};
