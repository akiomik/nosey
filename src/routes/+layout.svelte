<script lang="ts">
  import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
  import '@skeletonlabs/skeleton/styles/skeleton.css';
  import '../app.postcss';

  import { AppShell } from '@skeletonlabs/skeleton';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<AppShell>
  <svelte:fragment slot="header">
    <Header />
  </svelte:fragment>

  <div class="container mx-auto max-w-4xl p-4 space-y-8 mt-4">
    <slot />
  </div>

  <svelte:fragment slot="footer">
    <hr />

    <Footer />
  </svelte:fragment>
</AppShell>
