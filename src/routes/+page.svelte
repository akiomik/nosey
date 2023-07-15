<script lang="ts">
  import { onMount } from 'svelte';
  import { Paginator } from '@skeletonlabs/skeleton';
  import { createRxNostr, createRxOneshotReq } from 'rx-nostr';
  import { map, toArray } from 'rxjs';
  import { nip19 } from 'nostr-tools';
  import { encode } from 'html-entities';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import type { PageData } from '$lib/types';
  import NoteList from '$lib/components/NoteList.svelte';

  export let data: PageData;

  let input: HTMLInputElement;
  let form: HTMLFormElement;
  let query = data.q;

  const rxNostr = createRxNostr();

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

  onMount(async () => {
    if (browser) {
      rxNostr.switchRelays(['wss://search.nos.today', 'wss://relay.nostr.band']);
    }

    if (browser && input) {
      const { default: Tribute } = await import('tributejs');

      const tribute = new Tribute({
        menuContainer: form,
        requireLeadingSpace: false,
        containerClass: 'list-nav card p-4 z-10',
        itemClass: 'flex items-center gap-2',
        selectTemplate: (item) => nip19.npubEncode(item.original.pubkey),
        menuItemTemplate: (item) => {
          const picture = item.original.picture
            ? `<img src="${item.original.picture}" class="rounded-full inline-block w-6" />`
            : `<div class="inline-block w-6"></div>`;
          const name = `<span class="flex-auto">${item.string}</span>`;
          return `${picture}${name}`;
        },
        lookup: 'label',
        fillAttr: 'name',
        values: (text, callback) => {
          if (text === '') {
            return callback([]);
          }

          const req = createRxOneshotReq({ filters: [{ kinds: [0], search: text, limit: 25 }] });

          rxNostr
            .use(req)
            .pipe(
              map(({ event }) => event),
              toArray()
            )
            .subscribe((events) => {
              // NOTE: Tribute has an XSS issue (https://github.com/zurb/tribute/issues/833)
              // TODO: filter value if validName is blank
              const values = events.map(({ pubkey, content }) => {
                const { name, display_name: displayName, picture } = JSON.parse(content);
                const validName = encode(name ?? displayName);

                let label = validName;
                if (name && displayName) {
                  label = encode(`${displayName} (@${name})`);
                }

                return { pubkey, name: validName, label, picture };
              });
              callback(values);
            });
        },
      });
      tribute.attach(input);
    }
  });
</script>

<form on:submit={handleSearch} class="relative" bind:this={form}>
  <div class="input-group input-group-divider grid-cols-[1fr_auto]">
    <input type="search" bind:this={input} bind:value={query} />
    <button type="submit" class="variant-filled-primary">Search</button>
  </div>
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
