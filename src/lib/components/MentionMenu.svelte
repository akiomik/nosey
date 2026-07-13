<script lang="ts">
  import { Portal, usePopover } from '@skeletonlabs/skeleton-svelte';
  import type { MentionItem } from '$lib/types';

  type AnchorRect = { x?: number; y?: number; width?: number; height?: number };

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getAnchorRect: () => AnchorRect | null;
    anchorElement: HTMLElement;
    loading: boolean;
    items: MentionItem[];
    activeIndex: number;
    onSelect: (item: MentionItem) => void;
  }

  let {
    open,
    onOpenChange,
    getAnchorRect,
    anchorElement,
    loading,
    items,
    activeIndex,
    onSelect,
  }: Props = $props();

  const id = $props.id();

  const popover = usePopover(() => ({
    id,
    open,
    onOpenChange: (d) => onOpenChange(d.open),
    positioning: {
      // Always open below the caret instead of flipping above when the list
      // grows too tall to fit -- flipping mid-search felt inconsistent.
      // TODO: with many results and little space below the caret, the menu
      // can still overflow past the bottom of the viewport; not handled yet.
      placement: 'bottom-start',
      flip: false,
      // The input has no real DOM node at the caret to anchor to, so anchor to
      // a virtual rect computed from the caret's on-screen position instead.
      // `animationFrame` keeps it in sync while typing or scrolling, since
      // neither fires the resize/scroll events `autoUpdate` listens for by
      // default for a virtual anchor.
      getAnchorElement: () => anchorElement,
      getAnchorRect,
      listeners: { animationFrame: true },
    },
    autoFocus: false,
    modal: false,
    closeOnEscape: false,
    closeOnInteractOutside: true,
    persistentElements: [() => anchorElement],
  }));

  const itemClass = 'w-full flex justify-start items-center gap-2 text-left rounded-base px-3 py-1.5';
</script>

<Portal>
  <div {...popover().getPositionerProps()}>
    <div {...popover().getContentProps()} class="card preset-tonal-surface p-4 z-[300] mt-2 shadow">
      {#if loading}
        <p class="px-3 py-1.5 opacity-60">Searching...</p>
      {:else if items.length === 0}
        <p class="px-3 py-1.5 opacity-60">No matches found</p>
      {:else}
        <ul class="space-y-1">
          {#each items as item, i (item.pubkey)}
            <li>
              <button
                type="button"
                class="{itemClass} {i === activeIndex ? 'preset-tonal' : 'hover:preset-tonal'}"
                onmousedown={(e) => e.preventDefault()}
                onclick={() => onSelect(item)}
              >
                {#if item.picture}
                  <img
                    src={item.picture}
                    class="rounded-full inline-block w-6"
                    alt=""
                    decoding="async"
                    loading="lazy"
                  />
                {:else}
                  <div class="inline-block w-6"></div>
                {/if}
                <span class="truncate">{item.name}</span>
                {#if item.nip05}
                  <span class="truncate"><code class="code">{item.nip05}</code></span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</Portal>
