import { nip19 } from 'nostr-tools';
import { createRxNostr, createRxOneshotReq, filterBy, verify, latestEach } from 'rx-nostr';
import { map, toArray } from 'rxjs';
import { encode } from 'html-entities';
import { browser } from '$app/environment';

export type Opts = {
  containerElement: HTMLElement;
  relays: string[];
  prefix: string;
};

export type Item = {
  pubkey: string;
  content: string;
  name: string;
  picture: string;
  nip05: string;
};

export const autocomplete = (node: HTMLElement, opts: Partial<Opts>) => {
  if (!browser || !node || !opts.containerElement || !opts.relays) {
    return;
  }

  const asyncDisposer = import('tributejs').then(({ default: Tribute }) => {
    const rxNostr = createRxNostr();
    rxNostr.switchRelays(opts.relays ?? []);

    const tribute = new Tribute({
      trigger: `${opts.prefix}@`,
      menuContainer: opts.containerElement,
      requireLeadingSpace: false,
      containerClass: 'list-nav card p-4 z-[300] mt-2',
      itemClass: 'flex justify-start items-center gap-2',
      selectTemplate: (item: { original: Item }) =>
        `${opts.prefix}${nip19.npubEncode(item.original.pubkey)}`,
      menuItemTemplate: (item: { original: Item }) => {
        const picture = item.original.picture
          ? `<img src="${item.original.picture}" class="rounded-full inline-block w-6" decoding="async" loading="lazy" />`
          : `<div class="inline-block w-6"></div>`;
        const name = `<span class="truncate">${item.original.name}</span>`;
        const nip05 = item.original.nip05
          ? `<span class="truncate"><code class="code">${item.original.nip05}</code></span>`
          : '';
        return `${picture}${name}${nip05}`;
      },
      lookup: 'content',
      fillAttr: 'name',
      searchOpts: {
        pre: '<span>',
        post: '</span>',
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

    tribute.attach(node);

    return () => {
      tribute.detach(node);
      rxNostr.dispose();
    };
  });

  return {
    destroy() {
      asyncDisposer.then((disposer) => disposer());
    },
  };
};
