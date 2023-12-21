<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faBars } from '@fortawesome/free-solid-svg-icons';
  import { popup } from '@skeletonlabs/skeleton';
  import type { PopupSettings } from '@skeletonlabs/skeleton';
  import HeaderMenu from './HeaderMenu.svelte';

  const popupTargetId = 'header-menu';
  const menuPopup: PopupSettings = {
    event: 'click',
    target: popupTargetId,
    placement: 'bottom',
  };
</script>

<AppBar slotTrail="place-content-end">
  <a href="/">nosey</a>
  <svelte:fragment slot="trail">
    <button class="btn-icon" use:popup={menuPopup}>
      <FontAwesomeIcon icon={faBars} title="Open menu" class="w-4" />
    </button>
  </svelte:fragment>
</AppBar>

<HeaderMenu popupId={popupTargetId} />
