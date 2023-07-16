<script lang="ts">
  import { onMount } from 'svelte';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import { Paginator } from '@skeletonlabs/skeleton';
  import { createRxNostr, createRxOneshotReq, filterBy, verify, latestEach } from 'rx-nostr';
  import { map, toArray } from 'rxjs';
  import { nip19 } from 'nostr-tools';
  import { encode } from 'html-entities';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import type { PageData } from '$lib/types';
  import NoteList from '$lib/components/NoteList.svelte';
  import Alert from '$lib/components/Alert.svelte';

  export let data: PageData;

  let input: HTMLInputElement;
  let inputContainer: HTMLDivElement;
  let query = data.q;

  const rxNostr = createRxNostr();
  const mattnQuery = 'from:npub1937vv2nf06360qn9y8el6d8sevnndy7tuh5nzre4gj05xc32tnwqauhaj6';

  const handleSearch = (e: SubmitEvent) => {
    e.preventDefault();
    goto(`/?${new URLSearchParams({ q: query })}`);
  };

  const handlePage = (e: CustomEvent) => {
    goto(`/?${new URLSearchParams({ q: query, page: e.detail })}`);
  };

  $: isInitial = data.q == null;
  $: {
    console.debug('data', data);
  }

  onMount(async () => {
    if (browser) {
      rxNostr.switchRelays(['wss://search.nos.today', 'wss://relay.nostr.band']);
    }

    if (browser && input) {
      const { default: Tribute } = await import('tributejs');

      const tribute = new Tribute({
        trigger: 'from:@',
        menuContainer: inputContainer,
        requireLeadingSpace: false,
        containerClass: 'list-nav card p-4 z-10 mt-8',
        itemClass: 'flex justify-start items-center gap-2',
        selectTemplate: (item) => `from:${nip19.npubEncode(item.original.pubkey)}`,
        menuItemTemplate: (item) => {
          const picture = item.original.picture
            ? `<img src="${item.original.picture}" class="rounded-full inline-block w-6" decoding="async" loading="lazy" />`
            : `<div class="inline-block w-6"></div>`;
          const name = `<span>${item.original.name}</span>`;
          const nip05 = item.original.nip05
            ? `<span><code class="code">${item.original.nip05}</code></span>`
            : '';
          return `${picture}${name}${nip05}`;
        },
        lookup: 'content',
        fillAttr: 'name',
        searchOpts: {
          skip: true,
        },
        menuItemLimit: 10,
        values: (text, callback) => {
          if (text === '') {
            return callback([]);
          }

          const req = createRxOneshotReq({ filters: [{ kinds: [0], search: text, limit: 10 }] });

          rxNostr
            .use(req)
            .pipe(
              filterBy({ kinds: [0], search: text }),
              verify(),
              latestEach(({ event }) => event.pubkey),
              map(({ event }) => event),
              toArray()
            )
            .subscribe((events) => {
              // NOTE: Tribute has an XSS issue (https://github.com/zurb/tribute/issues/833)
              // TODO: filter value if validName is blank
              const values = events.map(({ pubkey, content }) => {
                const { name, display_name: displayName, picture, nip05 } = JSON.parse(content);
                const validName = encode(name ?? displayName ?? pubkey);

                return { pubkey, content, name: validName, picture, nip05 };
              });
              callback(values);
            });
        },
      });
      tribute.attach(input);
    }
  });
</script>

<form
  on:submit={handleSearch}
  class="flex flex-col gap-6 justify-center items-center"
  class:h-full={isInitial}
>
  {#if isInitial}
    <h1 class="h1">nosquawks</h1>
    <p>A nostr searcher</p>
  {/if}

  <div bind:this={inputContainer} class="relative w-full">
    <div class="input-group input-group-divider grid-cols-[1fr_auto]">
      <input type="search" bind:this={input} bind:value={query} />
      <button type="submit" class="variant-filled-primary">
        <FontAwesomeIcon icon={faSearch} title="Search" class="w-4 inline" />
      </button>
    </div>
  </div>

  {#if isInitial}
    <Alert>
      <div class="flex gap-1">
        <p><b>Tips:</b></p>
        <p>By using <code class="code">from:</code> directive you can filter notes by author.</p>
        <p>
          (e.g. <a href={`/?q=${encodeURI(mattnQuery)}`}><code class="code">from:@mattn</code></a>)
        </p>
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
