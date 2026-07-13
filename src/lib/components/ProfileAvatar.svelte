<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    picture?: string;
    name: string;
    class?: string;
  }

  let { picture, name, class: className }: Props = $props();
</script>

<Avatar class={className}>
  <Avatar.Image src={picture} alt="Profile picture of {name}" />
  <Avatar.Fallback>NO</Avatar.Fallback>
</Avatar>
