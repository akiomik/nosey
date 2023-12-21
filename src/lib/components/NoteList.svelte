<script lang="ts">
  import { nip19 } from 'nostr-tools';
  import type * as Nostr from 'nostr-typedef';

  import ExternalLink from '$lib/components/ExternalLink.svelte';
  import NoteListItem from '$lib/components/NoteListItem.svelte';
  import Alert from '$lib/components/Alert.svelte';

  export let notes: Nostr.Event[];
</script>

<div class="flex flex-col space-y-8">
  {#each notes as note, i (`${note.id}-${i}`)}
    <NoteListItem {note} />
  {:else}
    <Alert variant="warning">
      <p>No data found &#128064;</p>
    </Alert>
  {/each}
</div>
