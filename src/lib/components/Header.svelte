<script lang="ts">
  import { faBars } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { AppBar, Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import HeaderMenu from './HeaderMenu.svelte';

  let isMenuOpen = $state(false);
</script>

<AppBar class="bg-surface-50-950 shadow-sm">
  <AppBar.Toolbar class="flex items-center justify-between p-4">
    <AppBar.Lead>
      <a href="/">nosey</a>
    </AppBar.Lead>
    <AppBar.Trail class="flex items-center justify-end">
      <Popover
        positioning={{ placement: 'bottom' }}
        open={isMenuOpen}
        onOpenChange={(d) => (isMenuOpen = d.open)}
      >
        <Popover.Trigger class="btn-icon">
          <FontAwesomeIcon icon={faBars} title="Open menu" class="w-4" />
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content class="z-20">
              <HeaderMenu onAdvancedSearchOpen={() => (isMenuOpen = false)} />
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover>
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>
