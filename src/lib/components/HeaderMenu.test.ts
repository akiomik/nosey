import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import WS from 'vitest-websocket-mock';
import HeaderMenu from './HeaderMenu.svelte';

const getElement = (selector: string) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Expected element matching ${selector}`);
  return element as HTMLElement;
};

// AdvancedSearchModal mounts its autocomplete input even while the Dialog is
// closed, so rendering this self-contained component opens these connections.
afterEach(() => {
  WS.clean();
});

describe('HeaderMenu', () => {
  it('opens its own Menu, then opens the Advanced Search Dialog and closes the Menu', async () => {
    new WS('wss://search.nos.today');
    new WS('wss://relay.nostr.band');

    const { container } = render(HeaderMenu);
    const menuTrigger = container.querySelector(
      '[data-scope="menu"][data-part="trigger"]'
    ) as HTMLElement;
    const menuContent = getElement('[data-scope="menu"][data-part="content"]');
    const dialogContent = getElement('[data-scope="dialog"][data-part="content"]');

    expect(menuContent).toHaveAttribute('hidden');
    expect(dialogContent).toHaveAttribute('hidden');

    await fireEvent.click(menuTrigger);
    expect(menuContent).not.toHaveAttribute('hidden');

    await fireEvent.click(
      getElement('[data-scope="menu"][data-part="item"][data-value="advanced-search"]')
    );

    expect(dialogContent).not.toHaveAttribute('hidden');
    expect(menuContent).toHaveAttribute('hidden');
  });
});
