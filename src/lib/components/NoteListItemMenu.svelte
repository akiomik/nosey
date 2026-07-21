<script lang="ts">
  import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { nip19 } from 'nostr-tools';
  import type * as Nostr from 'nostr-typedef';
  import { copyToClipboardWithToast } from '$lib/helpers/copyToClipboardWithToast';

  interface Props {
    note: Nostr.Event;
  }

  let { note }: Props = $props();

  let isMenuOpen = $state(false);
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

  const itemClass = 'block w-full text-left rounded-base px-3 py-1.5 hover:preset-tonal';
</script>

<Menu
  positioning={{ placement: 'bottom' }}
  open={isMenuOpen}
  onOpenChange={(d) => (isMenuOpen = d.open)}
  navigate={(d) => {
    window.open(d.href, '_blank', 'noreferrer');
    isMenuOpen = false;
  }}
>
  <Menu.Trigger class="btn-icon flex-none">
    <FontAwesomeIcon icon={faEllipsisVertical} title="Menu" class="w-4 h-4" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class="card preset-tonal-surface p-2 w-64 z-20 shadow space-y-1">
        <Menu.Item
          value="copy-npub"
          onclick={() => copyToClipboardWithToast(npub, 'npub1')}
          class={itemClass}
        >
          Copy <code class="ml-1">npub1</code>
        </Menu.Item>
        <Menu.Item
          value="copy-note-id"
          onclick={() => copyToClipboardWithToast(noteId, 'note1 id')}
          class={itemClass}
        >
          Copy <code class="mx-1">note1</code> id
        </Menu.Item>
        <Menu.Item
          value="copy-nevent-id"
          onclick={() => copyToClipboardWithToast(nevent, 'nevent1 id')}
          class={itemClass}
        >
          Copy <code class="mx-1">nevent1</code> id
        </Menu.Item>
        <Menu.Item
          value="copy-text"
          onclick={() => copyToClipboardWithToast(note.content, 'text')}
          class={itemClass}
        >
          Copy text
        </Menu.Item>
        <Menu.Item value="njump-author">
          {#snippet element(attrs)}
            <a
              {...attrs as Record<string, unknown>}
              href="https://njump.me/{npub}"
              rel="external noreferrer"
              target="_blank"
              class={itemClass}
            >
              Open author with njump.me
            </a>
          {/snippet}
        </Menu.Item>
        <Menu.Item value="njump-note">
          {#snippet element(attrs)}
            <a
              {...attrs as Record<string, unknown>}
              href="https://njump.me/{nevent}"
              rel="external noreferrer"
              target="_blank"
              class={itemClass}
            >
              Open note with njump.me
            </a>
          {/snippet}
        </Menu.Item>
        <Menu.Item value="nosaray">
          {#snippet element(attrs)}
            <a
              {...attrs as Record<string, unknown>}
              href="https://nosaray.vercel.app/?since={nosaraySince.toISOString()}&dur={nosarayDuration}m"
              rel="external noreferrer"
              target="_blank"
              class={itemClass}
            >
              See posts around this on Nosaray
            </a>
          {/snippet}
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
