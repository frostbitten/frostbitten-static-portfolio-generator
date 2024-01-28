<script lang="ts">
	import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate } from 'svelte';
    import { browser } from '$app/environment';

    import { inview } from 'svelte-inview';
    import type { ObserverEventDetails } from 'svelte-inview';

	//   export let onload;
	//   export let mediaLoaded;
	//   export let mediaI;
	  export let srcFull;
	  export let src;
	  export let alt = "";
	  export let loaded;
    let cssClass:string = ""

      let imgSrc='';

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
<div
  use:inview
  on:inview_enter={() => imgSrc=src}
>
<img class="{cssClass}" src={imgSrc} bind:this={imgRef} alt={alt} data-full={srcFull} on:load={imgLoaded}>
</div>