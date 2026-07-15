<script lang="ts">
  import { Collapsible } from '@skeletonlabs/skeleton-svelte';
  import type * as Nostr from 'nostr-typedef';
  import { zostr } from 'zod-nostr';
  import { inlineImage } from '$lib/actions/inlineImage';
  import { linkify, linkifyOpts } from '$lib/actions/linkify';
  import { NostrProfileContentSchema, type NostrProfileMetadata } from '$lib/profile';
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
  // Posts past this length are confidently long, so they can be collapsed
  // immediately from the raw content length without measuring rendered height.
  const LONG_CONTENT_THRESHOLD = 500;
  // Text length alone misses image-only (or short-caption, tall-image) posts,
  // since the embedded image that inflates the rendered height isn't reflected
  // in the character count. Same extensions inlineImage looks for. Unlike text
  // length, an image's rendered height isn't known up front, so these posts
  // start fully open and only collapse once measured to actually exceed
  // COLLAPSED_HEIGHT — otherwise a short image would be padded out to a taller
  // box with a "Show more" trigger that reveals nothing new.
  const IMAGE_URL_PATTERN = /https?:\/\/\S+\.(?:jpe?g|png|gif|webp)\b/i;

  const shorten = (id: string) => `${id.substring(0, 9)}:${id.substring(id.length - 8, id.length)}`;
  const parseProfileMetadata = (content: string): NostrProfileMetadata | undefined => {
    const parsed = NostrProfileContentSchema.safeParse(content);
    return parsed.success ? parsed.data : undefined;
  };

  let profileMetadata = $derived(profile ? parseProfileMetadata(profile.content) : undefined);
  let nameOrPubkey = $derived(
    profileMetadata?.name || profileMetadata?.display_name || shorten(note.pubkey)
  );

  const transformContent = (content: string | undefined) =>
    content
      ?.replaceAll(/nostr:npub1([a-z0-9]{58})/g, '@npub1$1')
      ?.replaceAll(/nostr:nprofile1([a-z0-9]{61,})/g, '@nprofile1$1')
      ?.replaceAll(/nostr:note1([a-z0-9]{58})/g, '@note1$1')
      ?.replaceAll(/nostr:nevent1([a-z0-9]{70,})/g, '@nevent1$1');
  const isContentDefinitelyLong = (content: string | undefined) =>
    (transformContent(content)?.length ?? 0) > LONG_CONTENT_THRESHOLD;

  let noteContent = $derived(transformContent(note.content));
  let isDefinitelyLong = $derived(isContentDefinitelyLong(note.content));
  let hasImage = $derived(IMAGE_URL_PATTERN.test(note.content ?? ''));
  let isLongContent = $derived(isDefinitelyLong || hasImage);

  let contentEl: HTMLElement | undefined = $state();
  // Seeded once from the initial content, not the reactive `isDefinitelyLong`
  // derived above: `note` never changes identity for a mounted list item, so
  // there's nothing to resync.
  // svelte-ignore state_referenced_locally
  const isDefinitelyLongInitial = isContentDefinitelyLong(note.content);
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
        <ProfileAvatar picture={profileMetadata?.picture ?? ''} name={nameOrPubkey} />
      </div>

      <p class="flex-auto min-w-0 flex items-center gap-1">
        <span class="font-bold truncate shrink-0">{nameOrPubkey}</span>
        {#if profileMetadata?.nip05}
          <span class="min-w-0 flex-1 truncate flex items-center gap-1">
            <code class="code truncate">{zostr.nip05.formatIdentifier(profileMetadata.nip05)}</code>
            <Nip05Badge pubkey={note.pubkey} nip05={profileMetadata.nip05} />
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
