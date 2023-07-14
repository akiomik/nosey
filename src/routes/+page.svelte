<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from '$lib/types';
  import SearchResultNoteList from '$lib/components/SearchResultNoteList.svelte';

  export let data: PageData;

  let query = data.q;

  const handleSearch = (e: SubmitEvent) => {
    e.preventDefault();
    goto(`/?${new URLSearchParams({ q: query })}`);
  };

  $: {
    console.debug('data', data);
  }
</script>

<form on:submit={handleSearch}>
  <input bind:value={query} />
  <button type="submit" class="btn variant-filled-primary">Search</button>
</form>

{#if data.result}
  <SearchResultNoteList result={data.result} />
{/if}
