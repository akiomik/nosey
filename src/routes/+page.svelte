<script lang="ts">
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import { Paginator } from '@skeletonlabs/skeleton';

  import { goto } from '$app/navigation';
  import type { PageData } from '$lib/types';
  import NoteList from '$lib/components/NoteList.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import { autocomplete } from '$lib/actions/autocomplete';

  export let data: PageData;

  let inputContainer: HTMLDivElement;
  let query = data.q ?? '';

  const mattnQuery = 'from:npub1937vv2nf06360qn9y8el6d8sevnndy7tuh5nzre4gj05xc32tnwqauhaj6';

  const handleQuery = (e: Event) => {
    query = e.target.value;
  };

  const handleSearch = (e: SubmitEvent) => {
    e.preventDefault();
    goto(`/?${new URLSearchParams({ q: query })}`);
  };

  const handlePage = (e: CustomEvent) => {
    goto(`/?${new URLSearchParams({ q: query, page: e.detail })}`);
  };

  $: q = data.q ?? '';
  $: isInitial = q == '';
  $: {
    console.debug('data', data);
  }
</script>

<svelte:head>
  {#if isInitial}
    <title>nosey | A Nostr searcher</title>
  {:else}
    <title>{q} - nosey | A Nostr searcher</title>
  {/if}
  <meta name="description" content="nosey - A Nostr searcher" />
  <meta name="keywords" content="nostr,search,notes,damus,snort" />
  <meta property="og:url" content="https://nosey.vercel.app" />
  <meta property="og:title" content="nosey | A Nostr searcher" />
  <meta property="og:description" content="nosey - A Nostr searcher" />
  <meta property="og:description" content="nosey - A Nostr searcher" />
  <link rel="canonical" href="https://nosey.vercel.app" />
</svelte:head>

<form
  on:submit={handleSearch}
  class="flex flex-col gap-6 justify-center items-center"
  class:h-full={isInitial}
>
  {#if isInitial}
    <h1 class="h1">nosey</h1>
    <p>A nostr searcher</p>
  {/if}

  <div bind:this={inputContainer} class="relative w-full">
    {#if inputContainer}
      <div class="input-group input-group-divider grid-cols-[1fr_auto]">
        <!-- svelte-ignore a11y-autofocus -->
        <input
          type="search"
          value={q}
          on:input={handleQuery}
          use:autocomplete={{
            containerElement: inputContainer,
            relays: ['wss://search.nos.today', 'wss://relay.nostr.band'],
            prefix: 'from:',
          }}
          autofocus
        />
        <button type="submit" class="variant-filled-primary">
          <FontAwesomeIcon icon={faSearch} title="Search" class="w-4 inline" />
        </button>
      </div>
    {/if}
  </div>

  {#if isInitial}
    <Alert>
      <div class="flex gap-1">
        <p><b>Tips:</b></p>
        <div>
          <p>
            By using <code class="code">from:npub...</code> directive you can filter notes by author.
          </p>
          <p>
            And you can auto-complete npub by typing <code class="code">from:@</code>
            (e.g.
            <a href={`/?q=${encodeURI(mattnQuery)}`}><code class="code">from:@mattn</code></a>)
          </p>
        </div>
      </div>
    </Alert>
  {/if}
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
