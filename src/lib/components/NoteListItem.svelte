<script lang="ts">
  import type * as Nostr from 'nostr-typedef';
  import { inlineImage } from '$lib/actions/inlineImage';
  import { linkify, linkifyOpts } from '$lib/actions/linkify';
  import NoteListItemMenu from './NoteListItemMenu.svelte';
  import ProfileAvatar from './ProfileAvatar.svelte';

  interface Props {
    note: Nostr.Event;
    profile: Nostr.Event | undefined;
  }

  let { note, profile }: Props = $props();

  const shorten = (id: string) => `${id.substring(0, 9)}:${id.substring(id.length - 8, id.length)}`;

  let profileContent = $derived(profile ? JSON.parse(profile.content) : undefined);
  let displayName =
    $derived(profileContent?.display_name ? profileContent.display_name : undefined);
  let profileName = $derived(profileContent?.name ? profileContent.name : undefined);
  let nameOrPubkey = $derived(displayName ?? profileName ?? shorten(note.pubkey));

  let noteContent = $derived(note.content
    ?.replaceAll(/nostr:npub1([a-z0-9]{58})/g, '@npub1$1')
    ?.replaceAll(/nostr:nprofile1([a-z0-9]{61,})/g, '@nprofile1$1')
    ?.replaceAll(/nostr:note1([a-z0-9]{58})/g, '@note1$1')
    ?.replaceAll(/nostr:nevent1([a-z0-9]{70,})/g, '@nevent1$1'));
</script>

<div class="card preset-tonal-surface">
  <div class="p-4">
    <div class="flex justify-between items-center">
      <div class="mr-2 flex-none">
        <ProfileAvatar picture={profileContent?.picture} name={nameOrPubkey} />
      </div>

      <p class="flex-auto font-bold min-w-0 text-ellipsis overflow-hidden">
        {nameOrPubkey}
      </p>

      <NoteListItemMenu {note} />
    </div>

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
