import { describe, expect, it } from 'vitest';
import { jsonLdTag } from './jsonLdTag';

describe('jsonLdTag', () => {
  it('wraps the JSON-serialized object in a ld+json script tag', () => {
    expect(jsonLdTag({ '@type': 'WebSite', name: 'nosey' })).toBe(
      '<script type="application/ld+json">{"@type":"WebSite","name":"nosey"}</script>'
    );
  });
});
