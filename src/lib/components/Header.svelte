<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
  import HeaderMenu from './HeaderMenu.svelte';
</script>

<AppBar class="bg-surface-50-950 shadow-sm">
  <AppBar.Toolbar class="flex items-center justify-between p-4">
    <AppBar.Lead>
      <a href="/">nosey</a>
    </AppBar.Lead>
    <AppBar.Trail class="flex items-center justify-end">
      <HeaderMenu />
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>
