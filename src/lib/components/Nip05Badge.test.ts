import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyNip05 } from '$lib/nip05';
import Nip05Badge from './Nip05Badge.svelte';

vi.mock('$lib/nip05', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/nip05')>()),
  verifyNip05: vi.fn(),
}));

const mockedVerifyNip05 = vi.mocked(verifyNip05);

describe('Nip05Badge', () => {
  beforeEach(() => {
    mockedVerifyNip05.mockReset();
  });

  it('shows nothing while verification is pending', () => {
    mockedVerifyNip05.mockReturnValue(new Promise(() => {}));

    const { container } = render(Nip05Badge, {
      props: { pubkey: 'pk', nip05: 'alice@example.com' },
    });

    expect(container.querySelector('svg')).toBeNull();
  });

  it('shows a check icon with a domain-confirming tooltip once verification succeeds', async () => {
    mockedVerifyNip05.mockResolvedValue(true);

    const { container } = render(Nip05Badge, {
      props: { pubkey: 'pk', nip05: 'alice@example.com' },
    });

    await vi.waitFor(() => {
      expect(container.querySelector('svg[data-icon="circle-check"]')).not.toBeNull();
    });
    expect(container.querySelector('[title]')).toHaveAttribute(
      'title',
      'Verified: this account owns example.com'
    );
    expect(mockedVerifyNip05).toHaveBeenCalledExactlyOnceWith('pk', 'alice@example.com');
  });

  it('shows a failure icon with a domain-referencing tooltip once verification fails', async () => {
    mockedVerifyNip05.mockResolvedValue(false);

    const { container } = render(Nip05Badge, {
      props: { pubkey: 'pk', nip05: 'alice@example.com' },
    });

    await vi.waitFor(() => {
      expect(container.querySelector('svg[data-icon="circle-xmark"]')).not.toBeNull();
    });
    expect(container.querySelector('[title]')).toHaveAttribute(
      'title',
      'Could not verify this account owns example.com'
    );
  });

  it('does not verify when nip05 is empty', () => {
    render(Nip05Badge, { props: { pubkey: 'pk', nip05: '' } });

    expect(mockedVerifyNip05).not.toHaveBeenCalled();
  });
});
