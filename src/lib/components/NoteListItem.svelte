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

  $: profileContent = profile ? JSON.parse(profile.content) : undefined;
  $: displayName =
    profileContent && profileContent.display_name ? profileContent.display_name : undefined;
  $: name = profileContent && profileContent.name ? profileContent.name : undefined;
  $: nameOrPubkey = displayName ?? name ?? shorten(note.pubkey);

  $: noteContent = note.content
    ?.replaceAll(/nostr:npub1([a-z0-9]{58})/g, '@npub1$1')
    ?.replaceAll(/nostr:nprofile1([a-z0-9]{61,})/g, '@nprofile1$1')
    ?.replaceAll(/nostr:note1([a-z0-9]{58})/g, '@note1$1')
    ?.replaceAll(/nostr:nevent1([a-z0-9]{70,})/g, '@nevent1$1');
</script>

<div class="card">
  <div class="p-4">
    <div class="flex justify-between items-center">
      <div class="mr-2 flex-none">
        <Avatar
          src={profileContent?.picture}
          initials="NO"
          alt="Profile picture of {nameOrPubkey}"
        />
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
      {noteContent}
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
