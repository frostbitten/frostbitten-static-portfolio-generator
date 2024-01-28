<script lang="ts">
	import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate, tick } from 'svelte';
    import { browser } from '$app/environment';
    import { v4 as uuidv4 } from 'uuid';

    import { inview } from 'svelte-inview';
    import type { ObserverEventDetails } from 'svelte-inview';

    export let loaded:any = false;
    export let mediaItem:any;
    export let autoplay:bool = true;
    export let loop:bool = true;
    export let muted:bool = true;
    export let preload:bool = true;
    export let controls:bool = false;
    export let letterboxColor:string = 'rgba(0,0,0,0)';


    $: videoDomain = $page.data.siteConfig.cloudflareStremDomain;
    $: src = `https://${videoDomain}/${mediaItem.uid}/iframe?autoplay=${String(autoplay)}&loop=${String(loop)}&muted=${String(muted)}&preload=${String(preload)}&controls=${String(controls)}&letterboxColor=${encodeURIComponent(letterboxColor)}`

    let isInView: boolean;
    let videoRef: HTMLElement;

    let player:any;
    let ready:bool = false;

    let cssClass:string = ""

    let aspectRatio = mediaItem.aspectRatio;
    let containerPadding = 1/mediaItem.aspectRatio;

    const play = () => {
        if(player) player.play();
    }
    const pause = () => {
        if(player) player.pause();
    }

    const initStream = (id)=>{
        if(!window.cfplayers)
            window.cfplayers = {}
        
        player = window.Stream(videoRef);
        window.cfplayers[id] = player
        player.addEventListener('play', () => {
            // console.log('playing!');
            ready=true;
            loaded=true;
        });
        player.play().catch(() => {
            console.log('playback failed, muting to try again');
            player.muted = true;
            player.play();
        });
    }

    onMount(async()=>{
        console.log('$page',$page)
        console.log('videoDomain',videoDomain)
        if(!videoDomain) {
            throw 'Cloudflare Stream has not been configured. Set the "cloudflareStremDomain" property in site config.'
        }
        let uniqueId = uuidv4();
        videoRef.setAttribute('id', uniqueId)

        const awaitStream = setInterval(()=>{
            if('Stream' in window){
                clearInterval(awaitStream);
                initStream(uniqueId);
            }
        },10)
    })

</script>
<style lang="scss">
    iframe {
        border: none;
        position: absolute;
        top: 0;
        height: 100%;
        width: 100%;
    }
    .stream-container{
        padding-top: calc(100% / var(--aspect-ratio));
        background-size:contain;
        background-position: center;
        isolation: isolate;
        --smDim: min(90svh,90svw);
        &[data-ready="false"] {
            background-color: #00000020;
        }
        .interacter {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }
    }
    

</style>
<!-- svelte-ignore a11y-missing-attribute -->
<div 
    use:inview
    on:inview_enter={() => play()}
    on:inview_leave={() => pause()}
class="stream-container {cssClass}" data-ready={ready} style="position: relative; --aspect-ratio: {aspectRatio}; {mediaItem?.poster?`background-image:url(${`/projects/${mediaItem.project.year}/${mediaItem.project.slug}/media/thumb512/${mediaItem.poster.hash}.webp`});`:''}"><div class="interacter"></div><iframe
bind:this={videoRef}
  src={src}
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen={true}
  class="stream-player"
></iframe></div>