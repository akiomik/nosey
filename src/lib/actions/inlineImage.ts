import urlRegexSafe from 'url-regex-safe';
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

// TODO: Add `Action` type
export const inlineImage = (node: HTMLElement, opts: Partial<Opts>) => {
  const mergedOpts = { ...defaultOpts, ...opts };

  const matches = node.innerHTML.matchAll(urlRegexSafe());
  if (matches === null) {
    return;
  }

  // TODO: traverse innerText of children
  let text = node.innerHTML;
  uniq([...matches].map((m) => m[0])).forEach((match) => {
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
    text = text.replaceAll(urlString, tag);
  });

  node.innerHTML = text;
};
