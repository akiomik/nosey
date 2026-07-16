import { nip19 } from 'nostr-tools';
import { mount, unmount } from 'svelte';
import { browser } from '$app/environment';
import MentionMenu from '$lib/components/MentionMenu.svelte';
import type { MentionItem } from '$lib/mention';
import { profileSuggestions } from '$lib/stores/profileSuggestions';

// This intentionally hand-rolls keyboard navigation instead of using
// @skeletonlabs/skeleton-svelte's `Menu` or `Combobox` (both wrap @zag-js
// machines):
// - `Menu`'s keyboard handling lives on its own trigger/content DOM nodes;
//   selecting an item highlighted via ArrowDown/Up calls `itemEl.click()` on
//   that node, not on this action's `<input>`, so focus would have to leave
//   the input to drive it.
// - `Combobox` owns `inputValue`/`value` for the whole input and replaces it
//   wholesale on selection, but here the input holds a full note being
//   composed and only the `prefix@query` substring after the trigger should
//   ever be replaced -- the rest of the buffer must survive untouched.
export type Opts = {
  prefix: string;
};

const TRIGGER_SUFFIX = '@';

const findTrigger = (textBeforeCaret: string, prefix: string) => {
  const trigger = `${prefix}${TRIGGER_SUFFIX}`;
  const triggerStart = textBeforeCaret.lastIndexOf(trigger);
  if (triggerStart === -1) {
    return null;
  }

  const query = textBeforeCaret.slice(triggerStart + trigger.length);
  if (/\s/.test(query)) {
    return null;
  }

  return { triggerStart, query };
};

export const autocomplete = (node: HTMLInputElement, opts: Partial<Opts>) => {
  if (!browser) {
    return;
  }

  const prefix = opts.prefix ?? '';

  let triggerStart: number | null = null;
  let measureCanvas: HTMLCanvasElement | null = null;
  const suggestions = profileSuggestions();

  const menuProps = $state<{
    open: boolean;
    anchorElement: HTMLElement;
    getAnchorRect: () => { x: number; y: number; width: number; height: number };
    loading: boolean;
    items: MentionItem[];
    error: 'timeout' | 'unavailable' | null;
    activeIndex: number;
    onOpenChange: (open: boolean) => void;
    onSelect: (item: MentionItem) => void;
  }>({
    open: false,
    anchorElement: node,
    getAnchorRect: () => computeAnchorRect(),
    loading: false,
    items: [],
    error: null,
    activeIndex: 0,
    onOpenChange: (open) => {
      if (!open) {
        closeMenu();
      }
    },
    onSelect: (item) => selectItem(item),
  });

  const measureTextWidth = (input: HTMLInputElement, text: string): number | null => {
    if (!measureCanvas) {
      measureCanvas = document.createElement('canvas');
    }
    const ctx = measureCanvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    const style = getComputedStyle(input);
    ctx.font = style.font || `${style.fontSize} ${style.fontFamily}`;
    return ctx.measureText(text).width;
  };

  const getAnchorPosition = (input: HTMLInputElement, caretIndex: number) => {
    const rect = input.getBoundingClientRect();
    const textWidth = measureTextWidth(input, input.value.slice(0, caretIndex));
    if (textWidth === null) {
      return { x: rect.left, y: rect.bottom };
    }

    const style = getComputedStyle(input);
    const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const x = rect.left + borderLeft + paddingLeft + textWidth - input.scrollLeft;
    return { x, y: rect.bottom };
  };

  const computeAnchorRect = () => {
    const caretIndex = node.selectionStart ?? node.value.length;
    const { x, y } = getAnchorPosition(node, caretIndex);
    return { x, y, width: 0, height: 0 };
  };

  const closeMenu = () => {
    suggestions.cancel();
    menuProps.open = false;
    menuProps.items = [];
    menuProps.activeIndex = 0;
    menuProps.loading = false;
    menuProps.error = null;
    triggerStart = null;
  };

  const unsubscribeSuggestions = suggestions.subscribe(({ loading, items, error }) => {
    menuProps.loading = loading;
    menuProps.items = items;
    menuProps.error = error;
  });

  const selectItem = (item: MentionItem) => {
    if (triggerStart === null) {
      return;
    }

    const caretIndex = node.selectionStart ?? node.value.length;
    const before = node.value.slice(0, triggerStart);
    const after = node.value.slice(caretIndex);
    const inserted = `${prefix}${nip19.npubEncode(item.pubkey)}`;
    node.value = `${before}${inserted}${after}`;

    const cursor = before.length + inserted.length;
    node.setSelectionRange(cursor, cursor);
    node.dispatchEvent(new Event('input', { bubbles: true }));

    closeMenu();
    node.focus();
  };

  const handleInput = () => {
    const caretIndex = node.selectionStart ?? node.value.length;
    const match = findTrigger(node.value.slice(0, caretIndex), prefix);

    if (!match) {
      closeMenu();
      return;
    }

    triggerStart = match.triggerStart;
    menuProps.open = true;
    menuProps.activeIndex = 0;

    suggestions.search(match.query);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!menuProps.open) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (menuProps.items.length > 0) {
          menuProps.activeIndex = (menuProps.activeIndex + 1) % menuProps.items.length;
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (menuProps.items.length > 0) {
          menuProps.activeIndex =
            (menuProps.activeIndex - 1 + menuProps.items.length) % menuProps.items.length;
        }
        break;
      case 'Enter': {
        const item = menuProps.items[menuProps.activeIndex];
        if (item) {
          event.preventDefault();
          selectItem(item);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        break;
      default:
        break;
    }
  };

  // Clicks on menu items call `preventDefault()` on `mousedown` so they never
  // blur the input, so any blur here means focus genuinely left the input
  // (tabbing away or clicking elsewhere) and the menu should close.
  const handleBlur = () => {
    closeMenu();
  };

  const menu = mount(MentionMenu, { target: document.body, props: menuProps });

  node.addEventListener('input', handleInput);
  node.addEventListener('keydown', handleKeydown);
  node.addEventListener('blur', handleBlur);

  return {
    destroy() {
      node.removeEventListener('input', handleInput);
      node.removeEventListener('keydown', handleKeydown);
      node.removeEventListener('blur', handleBlur);
      unsubscribeSuggestions();
      suggestions.destroy();
      unmount(menu);
    },
  };
};
