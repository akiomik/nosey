<script lang="ts">
  import type * as Nostr from 'nostr-typedef';
  import { nip19 } from 'nostr-tools';
  import { clipboard } from '@skeletonlabs/skeleton';
  import ExternalLink from './ExternalLink.svelte';

  export let note: Nostr.Event;
  export let popupId: string;

  const npub = nip19.npubEncode(note.pubkey);
  const noteId = nip19.noteEncode(note.id);
  const nevent = nip19.neventEncode({
    id: note.id,
    author: note.pubkey,
    kind: note.kind,
  });
  const nosarayDuration = 10; // mins
  const nosaraySince = new Date((note.created_at - (nosarayDuration / 2) * 60) * 1000);
</script>

<div class="card p-2 w-64 z-10 shadow" data-popup={popupId}>
  <ul class="list-nav">
    <li>
      <button class="w-full" use:clipboard={npub}>
        Copy <code class="code ml-1">npub1</code>
      </button>
    </li>
    <li>
      <button class="w-full" use:clipboard={noteId}>
        Copy <code class="code mx-1">note1</code> id
      </button>
    </li>
    <li>
      <button class="w-full" use:clipboard={nevent}>
        Copy <code class="code mx-1">nevent1</code> id
      </button>
    </li>
    <li>
      <button class="w-full" use:clipboard={note.content}>Copy text</button>
    </li>
    <li>
      <ExternalLink href="https://njump.me/{npub}">Open author with njump.me</ExternalLink>
    </li>
    <li>
      <ExternalLink href="https://njump.me/{nevent}">Open note with njump.me</ExternalLink>
    </li>
    <li>
      <ExternalLink
        href="https://nosaray.vercel.app/?since={nosaraySince.toISOString()}&dur={nosarayDuration}m"
      >
        See posts around this on Nosaray
      </ExternalLink>
    </li>
  </ul>
</div>
