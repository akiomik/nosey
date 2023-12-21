<script lang="ts">
  import type * as Nostr from 'nostr-typedef';
  import { inlineImage } from '$lib/actions/inlineImage';
  import { linkify, linkifyOpts } from '$lib/actions/linkify';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
  import { popup } from '@skeletonlabs/skeleton';
  import type { PopupSettings } from '@skeletonlabs/skeleton';
  import NoteListItemMenu from './NoteListItemMenu.svelte';
  import { Avatar } from '@skeletonlabs/skeleton';

  export let note: Nostr.Event;
  export let profile: Nostr.Event;

  const popupTargetId = `menu-${note.id}`;
  const menuPopup: PopupSettings = {
    event: 'click',
    target: popupTargetId,
    placement: 'bottom',
  };
  const shorten = (id: string) => `${id.substring(0, 9)}:${id.substring(id.length - 8, id.length)}`;

  $: content = profile ? JSON.parse(profile.content) : undefined;
  $: displayName = content && content.display_name ? content.display_name : undefined;
  $: name = content && content.name ? content.name : undefined;
  $: nameOrPubkey = displayName ?? name ?? shorten(note.pubkey);
</script>

<div class="card">
  <div class="p-4">
    <div class="flex justify-between items-center">
      <div class="mr-2 flex-none">
        <Avatar src={content?.picture} initials="NO" alt="Profile picture of {nameOrPubkey}" />
      </div>

      <p class="flex-auto font-bold min-w-0 text-ellipsis overflow-hidden">
        {nameOrPubkey}
      </p>

      <button class="btn-icon flex-none" use:popup={menuPopup}>
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
