<script lang="ts">
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { Pagination } from '@skeletonlabs/skeleton-svelte';

  import { goto } from '$app/navigation';
  import { autocomplete } from '$lib/actions/autocomplete';
  import Alert from '$lib/components/Alert.svelte';
  import JsonLd from '$lib/components/JsonLd.svelte';
  import NoteList from '$lib/components/NoteList.svelte';
  import type { PageData } from '$lib/types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let inputContainer: HTMLDivElement | undefined = $state();
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

  const handlePage = (newPage: number) => {
    goto(`/?${new URLSearchParams({ q, page: newPage.toString() })}`);
  };

  let q = $derived(data.q ?? '');
  let page = $derived(data.page === 0 ? undefined : data.page);
  let params = $derived(page ? new URLSearchParams({ q, page: page.toString() }) : new URLSearchParams({ q }));
  let isInitial = $derived(q === '');
  let url = $derived(`https://nosey.vercel.app${isInitial ? '' : `/${params}`}`);
  $effect(() => {
    console.debug('data', data);
  });
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
  <meta property="og:image" content="https://nosey.vercel.app/ogp.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:image" content="https://nosey.vercel.app/favicon.png" />
  <link rel="canonical" href={url} />
  <JsonLd {url} isRoot={isInitial} />
</svelte:head>

<form
  onsubmit={handleSearch}
  class="flex flex-col gap-6 justify-center items-center"
  class:h-full={isInitial}
>
  {#if isInitial}
    <h1 class="h1">nosey</h1>
    <p>A nostr searcher</p>
  {/if}

  <div bind:this={inputContainer} class="relative w-full">
    {#if inputContainer}
      <div class="input-group grid-cols-[1fr_auto]">
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="search"
          class="ig-input"
          value={q}
          aria-label="search"
          oninput={handleQuery}
          use:autocomplete={{
            containerElement: inputContainer,
            relays: ['wss://search.nos.today', 'wss://relay.nostr.band'],
            prefix: 'from:',
          }}
          autofocus
        />
        <button type="submit" class="ig-btn preset-filled-primary-500">
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
  <Pagination
    count={data.result.pagination.total_records}
    pageSize={data.result.pagination.limit}
    page={data.page + 1}
    onPageChange={(e) => handlePage(e.page - 1)}
    class="flex justify-center gap-1"
  >
    <Pagination.PrevTrigger class="btn-icon">&larr;</Pagination.PrevTrigger>
    <Pagination.Context>
      {#snippet children(pagination)}
        {#each pagination().pages as p, i}
          {#if p.type === 'page'}
            <Pagination.Item {...p} class="btn-icon">{p.value}</Pagination.Item>
          {:else}
            <Pagination.Ellipsis index={i} class="btn-icon">&hellip;</Pagination.Ellipsis>
          {/if}
        {/each}
      {/snippet}
    </Pagination.Context>
    <Pagination.NextTrigger class="btn-icon">&rarr;</Pagination.NextTrigger>
  </Pagination>
{/if}
