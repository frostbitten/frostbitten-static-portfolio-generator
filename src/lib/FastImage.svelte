<script lang="ts">
	import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate } from 'svelte';
    import { browser } from '$app/environment';

    import { inview } from 'svelte-inview';
    import type { ObserverEventDetails } from 'svelte-inview';

	//   export let mediaI;
    let ready = false
	  export let srcFull;
	  export let src;
	  export let alt = "";
	  export let loaded;
	  export let preload = false;
    export let lazy = false;
    // export let aspectRatio:any;
    let cssClass:string = ""

    let imgSrc = preload || lazy ? src : '';

    onMount(()=>{
        // mediaLoaded[mediaI] = true;
        // onload();
    })

    const imgLoaded = ()=>{
      loaded=true;
    }

    let isInView: boolean;
    let imgRef: HTMLElement;
//   on:inview_leave={() => videoRef.pause()}
</script>
<style lang="scss">
  .fast-image {
    &.lazy {
      &:not(.ready) img {
        display:none;
      }
    }
    &.ready {
      .fast-image-placeholder {
        display:none;
      }
    }
    .fast-image-placeholder {
      padding-top: calc(100% / var(--aspect-ratio));
    }
  }
</style>
<div
  use:inview
  on:inview_enter={() => {if(imgSrc!==src){imgSrc=src;}ready=true}}
  class="fast-image {lazy?'lazy':''} {ready?'ready':''}"
>
<img class="{cssClass}" src={imgSrc} loading="lazy" bind:this={imgRef} alt={alt} data-full={srcFull} on:load={imgLoaded}>
<div class="fast-image-placeholder"style=""></div>
</div>