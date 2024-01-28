<script lang="ts">
	import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate } from 'svelte';
    import { browser } from '$app/environment';

    import { inview } from 'svelte-inview';
    import type { ObserverEventDetails } from 'svelte-inview';

	  export let src;
	  export let loaded;
    let cssClass:string = ""

    onMount(()=>{
      loaded=true;
      console.log('videoRef',videoRef)
      videoRef.addEventListener('loadeddata', function(e) {
          // console.log('loadeddata',e.target.duration);
          if(videoRef.duration>0)
            loaded=true;
      });
    })

    let isInView: boolean;
    let videoRef: HTMLVideoElement;
    
</script>
<div
  use:inview
  on:inview_enter={() => videoRef.play()}
  on:inview_leave={() => videoRef.pause()}
  class="fast-video"
>
<video class="{cssClass}" muted autoplay loop src={src} bind:this={videoRef} ></video>
</div>