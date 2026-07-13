<script lang="ts">
  import type * as Nostr from 'nostr-typedef';
  import Alert from '$lib/components/Alert.svelte';
  import NoteListItem from '$lib/components/NoteListItem.svelte';
  import { profileStore } from '$lib/stores/profileStore';

  interface Props {
    notes: Nostr.Event[];
  }

  let { notes }: Props = $props();

  let pubkeys = $derived(Array.from(
    notes.reduce((acc: Set<string>, a: Nostr.Event) => {
      if (acc.has(a.pubkey)) {
        return acc;
      }

      acc.add(a.pubkey);
      return acc;
    }, new Set())
  ));
  let profileMap = $derived(profileStore(pubkeys));
</script>

<div class="flex flex-col space-y-8">
  {#each notes as note, i (`${note.id}-${i}`)}
    <NoteListItem {note} profile={$profileMap[note.pubkey]} />
  {:else}
    <Alert variant="warning">
      <p>No data found &#128064;</p>
    </Alert>
  {/each}
</div>
