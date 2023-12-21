<script lang="ts">
  import type * as Nostr from 'nostr-typedef';
  import { nip19 } from 'nostr-tools';
  import { clipboard } from '@skeletonlabs/skeleton';
  import ExternalLink from './ExternalLink.svelte';

  export let note: Nostr.Event;
  export let popupId: string;

  const npub = nip19.npubEncode(note.pubkey);
  const nevent = nip19.neventEncode({
    id: note.id,
    author: note.pubkey,
    kind: note.kind,
  });
</script>

<div class="card p-2 w-64 z-10 shadow" data-popup={popupId}>
  <ul class="list-nav">
    <li>
      <button class="w-full" use:clipboard={npub}>
        Copy <code class="code ml-1">npub</code>
      </button>
    </li>
    <li>
      <button class="w-full" use:clipboard={nevent}>
        Copy <code class="code ml-1">nevent</code>
      </button>
    </li>
    <li>
      <ExternalLink href="https://njump.me/{npub}">Open author with njump.me</ExternalLink>
    </li>
    <li>
      <ExternalLink href="https://njump.me/{nevent}">Open note with njump.me</ExternalLink>
    </li>
  </ul>
</div>
