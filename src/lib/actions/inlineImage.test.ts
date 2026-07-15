import { describe, expect, it } from 'vitest';
import { inlineImage } from './inlineImage';

const opts = {
  className: 'my-4 w-full max-w-lg',
  attributes: { alt: 'Embed image', decoding: 'async', loading: 'lazy' },
};

const run = (content: string) => {
  const node = document.createElement('p');
  node.innerHTML = content;
  inlineImage(node, opts);
  return node.innerHTML;
};

describe('inlineImage', () => {
  it('replaces an image URL with an img tag', () => {
    const html = run('https://example.com/photo.jpg');

    expect(html).toContain('<img');
    expect(html).toContain('src="https://example.com/photo.jpg"');
  });

  it('strips blank lines directly surrounding an image URL so no extra gap is rendered', () => {
    // Mirrors how some clients pad an attached image with several blank
    // lines, which `linkify`'s `nl2br` later turns into visible `<br>`s.
    const html = run('\n\n\n\nhttps://example.com/photo.jpg');

    expect(html).not.toContain('\n');
    expect(html.trim().startsWith('<img')).toBe(true);
  });

  it('strips blank lines after an image URL as well as before it', () => {
    const html = run('https://example.com/a.jpg\n\n\n\nhttps://example.com/b.jpg');

    expect(html).not.toContain('\n');
  });

  it('strips blank lines between preceding text and the image', () => {
    const html = run('GM PV\n\n\n\nhttps://example.com/photo.jpg');

    expect(html).toBe(
      'GM PV<img alt="Embed image" decoding="async" loading="lazy" src="https://example.com/photo.jpg" class="my-4 w-full max-w-lg">'
    );
  });

  it('does not swallow non-newline whitespace separating text from the image', () => {
    const html = run('GM PV\n\n \n\n\n\nhttps://example.com/photo.jpg');

    expect(html).toContain('GM PV\n\n ');
    expect(html).not.toMatch(/\n<img/);
  });

  it('leaves non-image URLs untouched', () => {
    const html = run('\n\nhttps://example.com/page\n\n');

    expect(html).not.toContain('<img');
    expect(html).toBe('\n\nhttps://example.com/page\n\n');
  });
});
