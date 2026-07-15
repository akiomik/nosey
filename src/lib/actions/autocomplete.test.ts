import { fireEvent, render } from '@testing-library/svelte';
import { nip19 } from 'nostr-tools';
import { writable } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfileSuggestions, ProfileSuggestionsState } from '$lib/stores/profileSuggestions';
import type { MentionItem } from '$lib/types';

const { profileSuggestionsMock } = vi.hoisted(() => ({ profileSuggestionsMock: vi.fn() }));

vi.mock('$lib/stores/profileSuggestions', () => ({
  profileSuggestions: profileSuggestionsMock,
}));

import AutocompleteTestHost from './AutocompleteTestHost.svelte';

const makeItem = (pubkey: string, name: string): MentionItem => ({
  pubkey,
  content: JSON.stringify({ name }),
  name,
  picture: '',
  nip05: '',
});

const createSuggestions = () => {
  const state = writable<ProfileSuggestionsState>({ loading: false, items: [], error: null });
  const suggestions: ProfileSuggestions = {
    subscribe: state.subscribe,
    search: vi.fn(),
    cancel: vi.fn(() => state.set({ loading: false, items: [], error: null })),
    destroy: vi.fn(),
  };

  return { state, suggestions };
};

let state: ReturnType<typeof writable<ProfileSuggestionsState>>;
let suggestions: ProfileSuggestions;

beforeEach(() => {
  ({ state, suggestions } = createSuggestions());
  profileSuggestionsMock.mockReturnValue(suggestions);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('autocomplete', () => {
  it('passes the trigger query to the suggestions store and Enter replaces only the trigger text', async () => {
    const item = makeItem('a'.repeat(64), 'Alice');
    const { getByRole } = render(AutocompleteTestHost, { props: { prefix: 'from:' } });
    const input = getByRole('textbox') as HTMLInputElement;

    input.value = 'hello from:@alice world';
    const caret = 'hello from:@alice'.length;
    input.setSelectionRange(caret, caret);
    await fireEvent.input(input);

    expect(suggestions.search).toHaveBeenCalledWith('alice');

    state.set({ loading: false, items: [item], error: null });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe(`hello from:${nip19.npubEncode(item.pubkey)} world`);
    expect(suggestions.cancel).toHaveBeenCalled();
  });

  it('uses the highlighted suggestion for ArrowDown then Enter', async () => {
    const first = makeItem('a'.repeat(64), 'Alice');
    const second = makeItem('b'.repeat(64), 'Bob');
    const { getByRole } = render(AutocompleteTestHost, { props: { prefix: 'from:' } });
    const input = getByRole('textbox') as HTMLInputElement;

    input.value = 'from:@bo';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);
    state.set({ loading: false, items: [first, second], error: null });

    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe(`from:${nip19.npubEncode(second.pubkey)}`);
    expect(suggestions.cancel).toHaveBeenCalled();
  });

  it('cancels suggestions when Escape closes the menu', async () => {
    const { getByRole, unmount } = render(AutocompleteTestHost, { props: { prefix: 'from:' } });
    const input = getByRole('textbox') as HTMLInputElement;

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);
    await fireEvent.keyDown(input, { key: 'Escape' });

    expect(suggestions.cancel).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('from:@bob');

    unmount();
    expect(suggestions.destroy).toHaveBeenCalledTimes(1);
  });

  it('does not read a derived after the action and menu are unmounted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(AutocompleteTestHost, { props: { prefix: 'from:' } });

    unmount();
    await Promise.resolve();

    expect(warn.mock.calls.flat().join('\n')).not.toContain('derived_inert');
  });
});
