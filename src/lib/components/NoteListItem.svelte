<script lang="ts">
  import type * as Nostr from 'nostr-typedef';
  import NoteListItemProfile from '$lib/components/NoteListItemProfile.svelte';
  import { inlineImage } from '$lib/actions/inlineImage';
  import { linkify, linkifyOpts } from '$lib/actions/linkify';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
  import { popup } from '@skeletonlabs/skeleton';
  import type { PopupSettings } from '@skeletonlabs/skeleton';
  import NoteListItemMenu from './NoteListItemMenu.svelte';

  export let note: Nostr.Event;

  const popupTargetId = `menu-${note.id}`;
  const menuPopup: PopupSettings = {
    event: 'click',
    target: popupTargetId,
    placement: 'bottom',
  };
</script>

<div class="card">
  <div class="p-4">
    <div class="flex-auto flex justify-between items-center">
      <NoteListItemProfile pubkey={note.pubkey} />

      <button class="btn-icon" use:popup={menuPopup}>
        <FontAwesomeIcon icon={faEllipsisVertical} title="Menu" class="w-4 h-4" />
      </button>
    </div>

    <NoteListItemMenu {note} popupId={popupTargetId} />

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
  </footer>
</div>
