import { nip19 } from 'nostr-tools';
import type * as Nostr from 'nostr-typedef';
import {
  catchError,
  debounceTime,
  EMPTY,
  map,
  merge,
  Observable,
  retry,
  Subject,
  switchMap,
  throwError,
  timer,
} from 'rxjs';
import { mount, unmount } from 'svelte';
import { browser } from '$app/environment';
import MentionMenu from '$lib/components/MentionMenu.svelte';
import { HttpTooManyRequestsError } from '$lib/errors';
import { search as searchProfiles } from '$lib/helpers/search';
import type { MentionItem, SearchResult } from '$lib/types';

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
const MENU_ITEM_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 250;
const RATE_LIMIT_MAX_RETRIES = 3;
const RATE_LIMIT_BASE_DELAY_MS = 300;

// Backs off only on 429s; any other error is rethrown immediately so `retry`
// stops and lets `catchError` surface it as a failed search right away.
const retryOnRateLimit = (error: unknown, retryCount: number): Observable<number> => {
  if (error instanceof HttpTooManyRequestsError && retryCount <= RATE_LIMIT_MAX_RETRIES) {
    return timer(RATE_LIMIT_BASE_DELAY_MS * 2 ** (retryCount - 1));
  }

  return throwError(() => error);
};

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

  const menuProps = $state<{
    open: boolean;
    anchorElement: HTMLElement;
    getAnchorRect: () => { x: number; y: number; width: number; height: number };
    loading: boolean;
    items: MentionItem[];
    activeIndex: number;
    onOpenChange: (open: boolean) => void;
    onSelect: (item: MentionItem) => void;
  }>({
    open: false,
    anchorElement: node,
    getAnchorRect: () => computeAnchorRect(),
    loading: false,
    items: [],
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
    cancel$.next();
    menuProps.open = false;
    menuProps.items = [];
    menuProps.activeIndex = 0;
    menuProps.loading = false;
    triggerStart = null;
  };

  const parseMentionItem = (pubkey: string, content: string): MentionItem => {
    try {
      const { name, display_name: displayName, picture, nip05 } = JSON.parse(content);
      return { pubkey, content, name: name ?? displayName ?? pubkey, picture, nip05 };
    } catch {
      // Malformed profile content (e.g. a kind:0 event with invalid JSON) shouldn't
      // crash the search and leave the menu stuck on "Searching...".
      return { pubkey, content, name: pubkey, picture: '', nip05: '' };
    }
  };

  const fetchProfiles = (query: string): Observable<SearchResult> =>
    new Observable<SearchResult>((subscriber) => {
      const controller = new AbortController();

      searchProfiles({ query, kind: 0, limit: MENU_ITEM_LIMIT }, controller.signal)
        .then((result) => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch((error) => subscriber.error(error));

      // Ties fetch cancellation to unsubscription, so `switchMap` aborts the
      // previous request in flight as soon as a newer query supersedes it.
      return () => controller.abort();
    });

  // `query$` drives both the synchronous "Searching..." feedback (below,
  // undebounced) and the debounced network fetch below it. `cancel$` bypasses
  // the debounce to abort an in-flight or pending fetch immediately when the
  // menu closes, instead of waiting out `SEARCH_DEBOUNCE_MS`.
  const query$ = new Subject<string>();
  const cancel$ = new Subject<void>();

  const uiSub = query$.subscribe((query) => {
    if (query === '') {
      menuProps.items = [];
      menuProps.loading = false;
    } else {
      menuProps.loading = true;
    }
  });

  const searchSub = merge(
    query$.pipe(debounceTime(SEARCH_DEBOUNCE_MS)),
    cancel$.pipe(map(() => ''))
  )
    .pipe(
      // Switching to a new inner observable unsubscribes the previous one,
      // which aborts its fetch and discards its (now stale) response --
      // replacing the hand-rolled AbortController/search-token bookkeeping.
      switchMap((query) => {
        if (query === '') {
          return EMPTY;
        }

        return fetchProfiles(query).pipe(
          retry({ delay: retryOnRateLimit }),
          catchError(() => {
            // Network/HTTP failure (or retries exhausted) shouldn't leave the
            // menu stuck on "Searching...".
            menuProps.items = [];
            menuProps.loading = false;
            return EMPTY;
          })
        );
      })
    )
    .subscribe((result) => {
      menuProps.items = result.data
        .map(({ pubkey, content }: Nostr.Event) => parseMentionItem(pubkey, content))
        .slice(0, MENU_ITEM_LIMIT);
      menuProps.loading = false;
    });

  const search = (query: string) => {
    query$.next(query);
  };

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

    search(match.query);
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
      uiSub.unsubscribe();
      searchSub.unsubscribe();
      unmount(menu);
    },
  };
};
