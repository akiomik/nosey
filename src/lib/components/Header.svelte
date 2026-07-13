<script lang="ts">
  import { faBars } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { AppBar, Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import HeaderMenu from './HeaderMenu.svelte';
</script>

<AppBar>
  <AppBar.Toolbar>
    <AppBar.Lead>
      <a href="/">nosey</a>
    </AppBar.Lead>
    <AppBar.Trail class="place-content-end">
      <Popover positioning={{ placement: 'bottom' }}>
        <Popover.Trigger class="btn-icon">
          <FontAwesomeIcon icon={faBars} title="Open menu" class="w-4" />
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner class="z-20">
            <Popover.Content>
              <HeaderMenu />
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover>
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>
