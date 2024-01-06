<script lang="ts">
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import { Paginator } from '@skeletonlabs/skeleton';

  import { goto } from '$app/navigation';
  import type { PageData } from '$lib/types';
  import NoteList from '$lib/components/NoteList.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import JsonLd from '$lib/components/JsonLd.svelte';
  import { autocomplete } from '$lib/actions/autocomplete';

  export let data: PageData;

  let inputContainer: HTMLDivElement;
  let query = data.q ?? '';

  const mattnQuery = 'from:npub1937vv2nf06360qn9y8el6d8sevnndy7tuh5nzre4gj05xc32tnwqauhaj6';

  const handleQuery = (e: Event) => {
    if (!(e.target instanceof HTMLInputElement)) {
      return;
    }

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
  $: page = data.page === 0 ? undefined : data.page;
  $: params = page ? new URLSearchParams({ q, page: page.toString() }) : new URLSearchParams({ q });
  $: isInitial = q == '';
  $: url = `https://nosey.vercel.app${isInitial ? '' : `/${params}`}`;
  $: {
    console.debug('data', data);
  }
</script>

<svelte:head>
  {#if isInitial}
    <title>nosey | A Nostr searcher</title>
  {:else}
    <title>{q} - nosey</title>
  {/if}
  <meta name="description" content="A Nostr searcher" />
  <meta name="keywords" content="nostr,search,notes,damus,snort" />
  <meta property="og:url" content={url} />
  <meta property="og:title" content={isInitial ? 'nosey' : `{q} - nosey`} />
  <meta property="og:description" content="A Nostr searcher" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="nosey" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:image" content="https://nosey.vercel.app/favicon.png" />
  <link rel="canonical" href={url} />
  <JsonLd {url} isRoot={isInitial} />
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
          aria-label="search"
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
      page: data.page,
      size: data.result.pagination.total_records,
      limit: data.result.pagination.limit,
      amounts: [data.result.pagination.limit],
    }}
    on:page={handlePage}
  />
{/if}
