<script lang="ts">
  import { nip19 } from 'nostr-tools';
  import type * as Nostr from 'nostr-typedef';
  import { copyToClipboard } from '$lib/helpers/copyToClipboard';
  import ExternalLink from './ExternalLink.svelte';

  interface Props {
    note: Nostr.Event;
  }

  let { note }: Props = $props();

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

<div class="card p-2 w-64 z-20 shadow">
  <ul class="list-nav">
    <li>
      <button type="button" class="w-full" onclick={() => copyToClipboard(npub)}>
        Copy <code class="code ml-1">npub1</code>
      </button>
    </li>
    <li>
      <button type="button" class="w-full" onclick={() => copyToClipboard(noteId)}>
        Copy <code class="code mx-1">note1</code> id
      </button>
    </li>
    <li>
      <button type="button" class="w-full" onclick={() => copyToClipboard(nevent)}>
        Copy <code class="code mx-1">nevent1</code> id
      </button>
    </li>
    <li>
      <button type="button" class="w-full" onclick={() => copyToClipboard(note.content)}>
        Copy text
      </button>
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
