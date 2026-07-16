<script lang="ts">
  import { usePopover } from '@skeletonlabs/skeleton-svelte';
  import type { MentionItem } from '$lib/mention';
  import Nip05Badge from './Nip05Badge.svelte';
  import ProfileAvatar from './ProfileAvatar.svelte';

  type AnchorRect = { x?: number; y?: number; width?: number; height?: number };

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getAnchorRect: () => AnchorRect | null;
    anchorElement: HTMLElement;
    loading: boolean;
    items: MentionItem[];
    error?: 'timeout' | 'unavailable' | null;
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
    error = null,
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
      placement: 'bottom-start',
      flip: false,
      // `fixed` (viewport-relative) instead of the default `absolute` so the
      // menu never contributes to the page's scrollable height when it
      // extends past the bottom of a short viewport -- with `absolute`, an
      // overflowing menu grows the whole document instead of just floating
      // over it.
      strategy: 'fixed',
      // Caps the menu to whatever room is actually left in the viewport
      // (exposed as the --available-height/--available-width CSS vars below)
      // instead of letting it grow indefinitely with long names or many
      // results.
      fitViewport: true,
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

<div {...popover().getPositionerProps()}>
  <div
    {...popover().getContentProps()}
    class="card preset-tonal-surface p-4 z-[300] mt-2 shadow max-w-[min(20rem,var(--available-width,20rem))] max-h-[var(--available-height,50vh)] overflow-y-auto"
  >
    {#if loading}
      <p class="px-3 py-1.5 opacity-60">Searching...</p>
    {:else if error === 'timeout'}
      <p class="px-3 py-1.5 opacity-60">Search timed out. Please try again.</p>
    {:else if error === 'unavailable'}
      <p class="px-3 py-1.5 opacity-60">Could not load suggestions. Please try again.</p>
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
              <ProfileAvatar picture={item.picture} name={item.name} class="w-6 h-6 shrink-0" />
              <span class="min-w-0 truncate">{item.name}</span>
              {#if item.nip05}
                <span class="min-w-0 shrink-[999] truncate flex items-center gap-1">
                  <code class="code truncate">{item.nip05}</code>
                  <Nip05Badge pubkey={item.pubkey} nip05={item.nip05} />
                </span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
