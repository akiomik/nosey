import { find } from 'linkifyjs';
// import type { Action } from 'svelte/types/runtime/action';

export type Opts = {
  extPattern: RegExp;
  validate: (value: string, extensions: RegExp) => boolean;
  attributes: object;
  tagName: string;
  className: string;
  render: (tagName: string, attributes: object) => string;
};

const defaultOpts: Opts = {
  extPattern: /(jpe?g|png|gif|webp)$/,
  validate: (value: string, extPattern: RegExp) => {
    try {
      return new URL(value.toLowerCase()).pathname.match(extPattern) !== null;
    } catch {
      return false;
    }
  },
  attributes: {},
  tagName: 'img',
  className: '',
  render: (tagName: string, attributes: object) => {
    const encodedAttrs = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    return `<${tagName} ${encodedAttrs}>`;
  },
};

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// TODO: Add `Action` type
export const inlineImage = (node: HTMLElement, opts: Partial<Opts>) => {
  const mergedOpts = { ...defaultOpts, ...opts };

  const matches = find(node.innerHTML, 'url');

  // TODO: traverse innerText of children
  let text = node.innerHTML;
  uniq(matches.map((m) => m.value)).forEach((match) => {
    const urlString = match;
    if (!mergedOpts.validate(urlString, mergedOpts.extPattern)) {
      return;
    }

    const attributes = {
      ...mergedOpts.attributes,
      src: urlString,
      class: mergedOpts.className,
    };
    const tag = mergedOpts.render(mergedOpts.tagName, attributes);
    // Newlines directly surrounding the URL are later turned into visible
    // `<br>`s by the `linkify` action's `nl2br` option. Authors commonly pad
    // an image URL with several blank lines, which would otherwise leave a
    // large empty gap above/below the now-inlined image on top of its own
    // margin.
    const pattern = new RegExp(`\\n*${escapeRegExp(urlString)}\\n*`, 'g');
    text = text.replace(pattern, tag);
  });

  node.innerHTML = text;
};
