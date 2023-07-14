<script lang="ts">
  import type * as Nostr from 'nostr-typedef';
  import NoteListItemProfile from '$lib/components/NoteListItemProfile.svelte';
  import ProfileLink from '$lib/components/ProfileLink.svelte';
  import { inlineImage } from '$lib/actions/inlineImage';
  import { linkify, linkifyOpts } from '$lib/actions/linkify';

  export let note: Nostr.Event;
</script>

<div class="card">
  <div class="p-4">
    <ProfileLink pubkey={note.pubkey} class="unstyled">
      <NoteListItemProfile pubkey={note.pubkey} />
    </ProfileLink>

    <p
      use:inlineImage={{
        className: 'my-4 w-full max-w-lg',
        attributes: { alt: 'Embed image', decoding: 'async', loading: 'lazy' },
      }}
      use:linkify={linkifyOpts}
      class="text-ellipsis overflow-hidden line-clamp-8 mt-4"
    >
      {note.content}
    </p>
  </div>

  <hr />

  <footer class="card-footer flex items-center justify-end p-4">
    <p>
      {Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'medium' }).format(
        note.created_at * 1000
      )}
    </p>
    <slot name="footer" />
  </footer>
</div>
