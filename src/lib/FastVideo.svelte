<script lang="ts">
	import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate, tick, onDestroy } from 'svelte';
    import { browser } from '$app/environment';

    import { inview } from 'svelte-inview';
    import type { ObserverEventDetails } from 'svelte-inview';

	  export let src;
	  export let loaded;
    export let cssClass:string = ""

    let isInView: boolean;
    let videoRef: HTMLVideoElement;
    let show: boolean = false;

    const checkVideoLoaded = (e) => {
        // console.log('loadeddata',{duration:videoRef.duration,readyState:videoRef.readyState});
        if(videoRef && videoRef.duration>0 && videoRef.readyState>2){
          loaded=true;
          removeListeners();
        }
    }
    const removeListeners = ()=>{
      if(videoRef){
          videoRef.removeEventListener('loadeddata', checkVideoLoaded);
          videoRef.removeEventListener('play', checkVideoLoaded);
          videoRef.removeEventListener('volumechange', checkVideoLoaded);
          videoRef.removeEventListener('progress', checkVideoLoaded);
      }
    }

    onDestroy(()=>{
        removeListeners();
    })

    const readyVideo = async ()=>{
      if(!show){
          show=true;
          await tick();
          if(videoRef.duration>0 && videoRef.readyState>2){
                loaded=true;
          }else{
            videoRef.addEventListener('loadeddata', checkVideoLoaded);
            videoRef.addEventListener('play', checkVideoLoaded);
            videoRef.addEventListener('volumechange', checkVideoLoaded);
            videoRef.addEventListener('progress', checkVideoLoaded);
          }
      }
      videoRef.play()
    }

    onMount(()=>{
    })
    
</script>
<style lang="scss">
  .fast-video {
    position: relative;
    .fast-video-placeholder {
      padding-top: calc(100% / var(--aspect-ratio));
      position: relative;
      background-color: #00000020;
    }
    video { display: none }

    &.ready {
      position: static;
      .fast-video-placeholder {
        display:none;
      }
      video { display: block }
    }
  }
</style>
<div
  use:inview
  on:inview_enter={() => {readyVideo()}}
  on:inview_leave={() => videoRef?.pause()}
  class="fast-video {loaded?'ready':''} {show?'show':''}"
>
{#if show}<video class="{cssClass}" muted autoplay loop src={src} bind:this={videoRef} ></video>{/if}
<div class="fast-video-placeholder"style=""></div>
</div>