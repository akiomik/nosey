import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Alert from './Alert.svelte';

describe('Alert', () => {
  it('applies the warning preset class for variant="warning"', () => {
    const { container } = render(Alert, { props: { variant: 'warning' } });
    expect(container.querySelector('aside')).toHaveClass('preset-tonal-warning');
  });

  it('applies the surface preset class by default', () => {
    const { container } = render(Alert, { props: {} });
    expect(container.querySelector('aside')).toHaveClass('preset-tonal-surface');
  });

  // Regression test: `variant` used to be read once into a plain `$state` at
  // mount, so the class silently never updated when `variant` changed later.
  it('reacts when the variant prop changes after mount', async () => {
    const { container, rerender } = render(Alert, { props: { variant: '' } });
    expect(container.querySelector('aside')).toHaveClass('preset-tonal-surface');

    await rerender({ variant: 'error' });

    expect(container.querySelector('aside')).toHaveClass('preset-tonal-error');
    expect(container.querySelector('aside')).not.toHaveClass('preset-tonal-surface');
  });
});
