<script lang="ts">
  import { nip19 } from 'nostr-tools';
  import type * as Nostr from 'nostr-typedef';
  import { copyToClipboard } from '$lib/helpers/copyToClipboard';
  import ExternalLink from './ExternalLink.svelte';

  interface Props {
    note: Nostr.Event;
    onAction: () => void;
  }

  let { note, onAction }: Props = $props();

  let npub = $derived(nip19.npubEncode(note.pubkey));
  let noteId = $derived(nip19.noteEncode(note.id));
  let nevent = $derived(
    nip19.neventEncode({
      id: note.id,
      author: note.pubkey,
      kind: note.kind,
    })
  );
  const nosarayDuration = 10; // mins
  let nosaraySince = $derived(new Date((note.created_at - (nosarayDuration / 2) * 60) * 1000));

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    onAction();
  };

  const itemClass = 'block w-full text-left rounded-base px-3 py-1.5 hover:preset-tonal';
</script>

<div class="card preset-tonal-surface p-2 w-64 z-20 shadow">
  <ul class="space-y-1">
    <li>
      <button type="button" class={itemClass} onclick={() => handleCopy(npub)}>
        Copy <code class="code ml-1">npub1</code>
      </button>
    </li>
    <li>
      <button type="button" class={itemClass} onclick={() => handleCopy(noteId)}>
        Copy <code class="code mx-1">note1</code> id
      </button>
    </li>
    <li>
      <button type="button" class={itemClass} onclick={() => handleCopy(nevent)}>
        Copy <code class="code mx-1">nevent1</code> id
      </button>
    </li>
    <li>
      <button type="button" class={itemClass} onclick={() => handleCopy(note.content)}>
        Copy text
      </button>
    </li>
    <li>
      <ExternalLink class={itemClass} href="https://njump.me/{npub}" onclick={onAction}>
        Open author with njump.me
      </ExternalLink>
    </li>
    <li>
      <ExternalLink class={itemClass} href="https://njump.me/{nevent}" onclick={onAction}>
        Open note with njump.me
      </ExternalLink>
    </li>
    <li>
      <ExternalLink
        class={itemClass}
        href="https://nosaray.vercel.app/?since={nosaraySince.toISOString()}&dur={nosarayDuration}m"
        onclick={onAction}
      >
        See posts around this on Nosaray
      </ExternalLink>
    </li>
  </ul>
</div>
