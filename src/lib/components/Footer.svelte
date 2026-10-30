<script lang="ts">
  import { faGithub } from '@fortawesome/free-brands-svg-icons';
  import { faBolt } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import ExternalLink from '#lib/components/ExternalLink.svelte';
  import FooterItem from '#lib/components/FooterItem.svelte';
</script>

<div class="flex justify-center p-8">
  <ul class="list-none">
    <FooterItem>&copy; 2023 nosey</FooterItem>
    <FooterItem>
      <ExternalLink href="https://github.com/akiomik/nosey" class="unstyled">
        <FontAwesomeIcon icon={faGithub} title="Open our Github repository" class="inline w-4" />
      </ExternalLink>
    </FooterItem>
    <FooterItem last={true}>
      <ExternalLink href="lightning:akiomik@stacker.news" class="unstyled">
        <FontAwesomeIcon icon={faBolt} title="Open our Lightning Address" class="inline w-4" />
      </ExternalLink>
    </FooterItem>
  </ul>
</div>
