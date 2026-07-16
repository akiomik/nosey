<script lang="ts">
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { Pagination } from '@skeletonlabs/skeleton-svelte';
  import { untrack } from 'svelte';

  import { goto } from '$app/navigation';
  import { autocomplete } from '$lib/actions/autocomplete.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import JsonLd from '$lib/components/JsonLd.svelte';
  import NoteList from '$lib/components/NoteList.svelte';
  import { createSearchPageSeo } from '$lib/seo';
  import type { PageData } from '$lib/types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // Only the initial value matters here; the `$effect` below keeps this in
  // sync with `data.q` afterwards, so `data` doesn't need to be tracked.
  let query = untrack(() => data.q ?? '');

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
  let seo = $derived(createSearchPageSeo(q, data.page));
  $effect(() => {
    // Resync the input's local edit buffer whenever the URL's `q` changes from
    // somewhere other than this form (a link, pagination, browser back/forward).
    // Without this, submitting the form again reuses whatever was last typed
    // or submitted through it, not the query actually shown on screen.
    query = data.q ?? '';
  });
</script>

<svelte:head>
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <meta name="keywords" content={seo.keywords} />
  <meta property="og:url" content={seo.url} />
  <meta property="og:title" content={seo.ogTitle} />
  <meta property="og:description" content={seo.description} />
  <meta property="og:type" content={seo.ogType} />
  <meta property="og:site_name" content={seo.ogSiteName} />
  <meta property="og:image" content={seo.ogImage} />
  <meta name="twitter:card" content={seo.twitterCard} />
  <meta name="twitter:image" content={seo.twitterImage} />
  <link rel="canonical" href={seo.url} />
  <JsonLd jsonLd={seo.jsonLd} />
</svelte:head>

<form
  onsubmit={handleSearch}
  class="flex flex-col gap-6 justify-center items-center"
  class:flex-1={seo.isInitial}
>
  {#if seo.isInitial}
    <h1 class="h1">nosey</h1>
    <p>A nostr searcher</p>
  {/if}

  <div class="relative w-full">
    <div class="input-group grid-cols-[1fr_auto]">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="search"
        class="ig-input"
        value={q}
        aria-label="search"
        oninput={handleQuery}
        use:autocomplete={{ prefix: 'from:' }}
        autofocus
      />
      <button type="submit" class="ig-btn preset-filled-primary-500">
        <FontAwesomeIcon icon={faSearch} title="Search" class="w-4 inline" />
      </button>
    </div>
  </div>

  {#if seo.isInitial}
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
  {#if data.result.pagination.total_records > 0}
    <Pagination
      count={data.result.pagination.total_records}
      pageSize={data.result.pagination.limit}
      page={data.page + 1}
      onPageChange={(e) => handlePage(e.page - 1)}
      class="mx-auto w-fit max-w-full flex flex-wrap justify-center gap-1"
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
{/if}
