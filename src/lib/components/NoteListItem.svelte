<script lang="ts">
  import { Collapsible } from '@skeletonlabs/skeleton-svelte';
  import type * as Nostr from 'nostr-typedef';
  import { inlineImage } from '$lib/actions/inlineImage';
  import { linkify, linkifyOpts } from '$lib/actions/linkify';
  import { hasInlineImageUrl, isNoteContentDefinitelyLong, transformNoteContent } from '$lib/note';
  import { resolveDisplayName, resolveIdentifiedProfile, resolveNip05Display } from '$lib/profile';
  import Nip05Badge from './Nip05Badge.svelte';
  import NoteListItemMenu from './NoteListItemMenu.svelte';
  import ProfileAvatar from './ProfileAvatar.svelte';

  interface Props {
    note: Nostr.Event;
    profile: Nostr.Event | undefined;
  }

  let { note, profile }: Props = $props();

  // Roughly the height of 8 lines of body text (the old line-clamp-8 behavior).
  const COLLAPSED_HEIGHT = 192;
  let identified = $derived(resolveIdentifiedProfile(note.pubkey, profile?.content));
  let nameOrPubkey = $derived(resolveDisplayName(identified));

  let noteContent = $derived(transformNoteContent(note.content));
  let isDefinitelyLong = $derived(isNoteContentDefinitelyLong(note.content));
  // Image height is unknown up front, so short-caption image posts begin open
  // and collapse only after their rendered height is measured.
  let hasImage = $derived(hasInlineImageUrl(note.content));
  let isLongContent = $derived(isDefinitelyLong || hasImage);

  let contentEl: HTMLElement | undefined = $state();
  // Seeded once from the initial content, not the reactive `isDefinitelyLong`
  // derived above: `note` never changes identity for a mounted list item, so
  // there's nothing to resync.
  // svelte-ignore state_referenced_locally
  const isDefinitelyLongInitial = isNoteContentDefinitelyLong(note.content);
  let isOpen = $state(!isDefinitelyLongInitial);
  let isCollapsing = $state(isDefinitelyLongInitial);
  let hasAutoCollapsed = false;

  $effect(() => {
    // Definitely-long posts are already collapsed; only image-only posts need
    // their real height measured to decide whether to collapse at all.
    if (!isLongContent || isDefinitelyLong) {
      return;
    }

    const el = contentEl;
    if (!el) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (hasAutoCollapsed || el.scrollHeight <= COLLAPSED_HEIGHT) {
        return;
      }

      hasAutoCollapsed = true;
      isCollapsing = true;
      isOpen = false;
    });
    observer.observe(el);

    return () => observer.disconnect();
  });
</script>

{#snippet noteContentParagraph(className: string)}
  <p
    bind:this={contentEl}
    use:inlineImage={{
      className: 'my-4 w-full max-w-lg',
      attributes: { alt: 'Embed image', decoding: 'async', loading: 'lazy' },
    }}
    use:linkify={linkifyOpts}
    class="break-words {className}"
  >
    {noteContent}
  </p>
{/snippet}

<div class="card preset-tonal-surface">
  <div class="p-4">
    <div class="flex justify-between items-center">
      <div class="mr-2 flex-none">
        <ProfileAvatar picture={identified.profile.picture} name={nameOrPubkey} />
      </div>

      <p class="flex-auto min-w-0 flex items-center gap-1">
        <span class="font-bold truncate min-w-0">{nameOrPubkey}</span>
        {#if identified.profile.nip05}
          <span class="min-w-0 flex-1 truncate flex items-center gap-1">
            <code class="truncate overflow-x-hidden!">{resolveNip05Display(identified)}</code>
            <Nip05Badge pubkey={note.pubkey} nip05={resolveNip05Display(identified)} />
          </span>
        {/if}
      </p>

      <NoteListItemMenu {note} />
    </div>

    {#if isLongContent}
      <Collapsible
        open={isOpen}
        collapsedHeight={isCollapsing ? COLLAPSED_HEIGHT : undefined}
        onOpenChange={(e) => (isOpen = e.open)}
        class="mt-4"
      >
        <Collapsible.Content class="w-full min-w-0 overflow-hidden">
          {@render noteContentParagraph('')}
        </Collapsible.Content>
        {#if isCollapsing}
          <Collapsible.Trigger class="btn btn-sm preset-tonal-surface mt-2">
            {isOpen ? 'Show less' : 'Show more'}
          </Collapsible.Trigger>
        {/if}
      </Collapsible>
    {:else}
      {@render noteContentParagraph('mt-4')}
    {/if}
  </div>

  <hr />

  <footer class="card-footer flex items-center justify-end p-4">
    <p>
      {Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'medium' }).format(
        note.created_at * 1000
      )}
    </p>
  </footer>
</div>
