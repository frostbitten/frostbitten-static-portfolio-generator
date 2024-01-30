<script lang="ts">
	import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate, tick } from 'svelte';
    import { browser } from '$app/environment';
    import { v4 as uuidv4 } from 'uuid';

    import { inview } from 'svelte-inview';
    import type { ObserverEventDetails } from 'svelte-inview';

    export let cssClass = "";
    export let aspectRatio:any;
</script>
<style lang="scss">
    .media-placeholder {
        padding-top: calc(100% / var(--aspect-ratio));
        background-color: #00000020;
    }
</style>
<!-- svelte-ignore a11y-missing-attribute -->
<div class="{cssClass} media-placeholder" style="position: relative; --aspect-ratio: {aspectRatio};"></div>