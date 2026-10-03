import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { configDefaults, defineConfig } from 'vitest/config';

// Keep the Svelte browser export condition away from MSW Node dependencies.
const networkTests = [
  'src/lib/nip05.test.ts',
  'src/lib/search/api.test.ts',
  'src/lib/stores/profileStore.test.ts',
];

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    projects: [
      {
        extends: true,
        plugins: [svelteTesting()],
        test: {
          name: 'dom',
          environment: 'jsdom',
          setupFiles: ['./vitest-setup.ts'],
          exclude: [...configDefaults.exclude, ...networkTests],
        },
      },
      {
        extends: true,
        test: {
          name: 'network',
          environment: 'jsdom',
          include: networkTests,
        },
      },
    ],
  },
});
