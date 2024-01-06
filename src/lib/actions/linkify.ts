import linkifyHtml from 'linkify-html';
// import type { Action } from 'svelte/runtime/action/public';
import type { Opts } from 'linkifyjs';

export const linkifyOpts = {
  className: 'underline',
  target: '_blank',
  rel: 'external noreferrer',
  format: (value: string, type: string) => {
    if (type === 'mention') {
      return `${value.substring(0, 9)}:${value.substring(value.length - 8, value.length)}`;
    }

    return value;
  },
  formatHref: (href: string, type: string) => {
    console.log(href);
    if (type === 'hashtag') {
      return `https://snort.social/t/${href.substring(1)}`;
    } else if (type === 'mention' && (href.startsWith('/npub1') || href.startsWith('/nprofile1'))) {
      return `https://njump.me/${href.substring(1)}`;
    } else if (type === 'mention' && (href.startsWith('/note1') || href.startsWith('/nevent1'))) {
      return `https://njump.me/${href.substring(1)}`;
    } else {
      return href;
    }
  },
  truncate: 54,
  validate: (value: string, type: string) => {
    if (type === 'url' && !value.startsWith('http')) {
      return false;
    }

    return true;
  },
  nl2br: true,
};

// TODO: Add `Action` type
export const linkify = (element: HTMLElement, opts: Opts) => {
  element.innerHTML = linkifyHtml(element.innerHTML, opts);
};
