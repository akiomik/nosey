<script lang="ts">
  import { Paginator } from '@skeletonlabs/skeleton';

  import { goto } from '$app/navigation';
  import type { PageData } from '$lib/types';
  import NoteList from '$lib/components/NoteList.svelte';

  export let data: PageData;

  let query = data.q;

  const handleSearch = (e: SubmitEvent) => {
    e.preventDefault();
    goto(`/?${new URLSearchParams({ q: query })}`);
  };

  const handlePage = (e: CustomEvent) => {
    goto(`/?${new URLSearchParams({ q: query, page: e.detail })}`);
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
  <NoteList notes={data.result.data} />
  <Paginator
    settings={{
      offset: data.page,
      size: data.result.pagination.total_records,
      limit: data.result.pagination.limit,
      amounts: [data.result.pagination.limit],
    }}
    on:page={handlePage}
  />
{/if}
