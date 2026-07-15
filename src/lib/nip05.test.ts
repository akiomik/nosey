import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { verifyNip05 } from './nip05';

const server = setupServer();

const pubkey = 'a'.repeat(64);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('verifyNip05', () => {
  it('resolves true when the domain vouches for the pubkey', async () => {
    server.use(
      http.get('https://valid.example/.well-known/nostr.json', ({ request }) => {
        expect(new URL(request.url).searchParams.get('name')).toBe('alice');
        return HttpResponse.json({ names: { alice: pubkey } });
      })
    );

    await expect(verifyNip05(pubkey, 'alice@valid.example')).resolves.toBe(true);
  });

  it('resolves false when the domain maps the name to a different pubkey', async () => {
    server.use(
      http.get('https://mismatch.example/.well-known/nostr.json', () =>
        HttpResponse.json({ names: { alice: 'b'.repeat(64) } })
      )
    );

    await expect(verifyNip05(pubkey, 'alice@mismatch.example')).resolves.toBe(false);
  });

  it('resolves false when the name is absent from the document', async () => {
    server.use(
      http.get('https://absent.example/.well-known/nostr.json', () =>
        HttpResponse.json({ names: {} })
      )
    );

    await expect(verifyNip05(pubkey, 'alice@absent.example')).resolves.toBe(false);
  });

  it('resolves false on a non-2xx response', async () => {
    server.use(
      http.get(
        'https://not-found.example/.well-known/nostr.json',
        () => new HttpResponse(null, { status: 404 })
      )
    );

    await expect(verifyNip05(pubkey, 'alice@not-found.example')).resolves.toBe(false);
  });

  it('resolves false on a malformed document', async () => {
    server.use(
      http.get('https://malformed.example/.well-known/nostr.json', () =>
        HttpResponse.json({ oops: true })
      )
    );

    await expect(verifyNip05(pubkey, 'alice@malformed.example')).resolves.toBe(false);
  });

  it('resolves false on a network error', async () => {
    server.use(
      http.get('https://unreachable.example/.well-known/nostr.json', () => HttpResponse.error())
    );

    await expect(verifyNip05(pubkey, 'alice@unreachable.example')).resolves.toBe(false);
  });

  it('queries the "_" local part for a domain-only identifier', async () => {
    server.use(
      http.get('https://domain-only.example/.well-known/nostr.json', ({ request }) => {
        expect(new URL(request.url).searchParams.get('name')).toBe('_');
        return HttpResponse.json({ names: { _: pubkey } });
      })
    );

    await expect(verifyNip05(pubkey, 'domain-only.example')).resolves.toBe(true);
  });

  it('queries the "_" local part for an unformatted domain-root identifier', async () => {
    server.use(
      http.get('https://domain-root.example/.well-known/nostr.json', ({ request }) => {
        expect(new URL(request.url).searchParams.get('name')).toBe('_');
        return HttpResponse.json({ names: { _: pubkey } });
      })
    );

    await expect(verifyNip05(pubkey, '_@domain-root.example')).resolves.toBe(true);
  });

  it('caches successful verifications so a repeat call does not refetch', async () => {
    let requestCount = 0;
    server.use(
      http.get('https://cache.example/.well-known/nostr.json', () => {
        requestCount += 1;
        return HttpResponse.json({ names: { alice: pubkey } });
      })
    );

    await verifyNip05(pubkey, 'alice@cache.example');
    await verifyNip05(pubkey, 'alice@cache.example');

    expect(requestCount).toBe(1);
  });
});
