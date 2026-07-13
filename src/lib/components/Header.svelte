<script lang="ts">
  import { faBars } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { AppBar, Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import HeaderMenu from './HeaderMenu.svelte';

  let isMenuOpen = $state(false);
</script>

<AppBar class="bg-surface-50-950 shadow-sm">
  <AppBar.Toolbar class="flex items-center justify-between p-4">
    <AppBar.Lead>
      <a href="/">nosey</a>
    </AppBar.Lead>
    <AppBar.Trail class="flex items-center justify-end">
      <Menu
        positioning={{ placement: 'bottom' }}
        open={isMenuOpen}
        onOpenChange={(d) => (isMenuOpen = d.open)}
      >
        <Menu.Trigger class="btn-icon">
          <FontAwesomeIcon icon={faBars} title="Open menu" class="w-4" />
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content class="card preset-tonal-surface p-2 w-52 z-20 shadow space-y-1">
              <HeaderMenu />
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu>
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>
