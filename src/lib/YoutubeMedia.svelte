<script lang="ts">
	import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate, tick } from 'svelte';
    import { browser } from '$app/environment';
    import { v4 as uuidv4 } from 'uuid';

    import { inview } from 'svelte-inview';
    import type { ObserverEventDetails } from 'svelte-inview';

    export let loaded:any = false;
    export let i = 0;
    export let mediaItem:any;
    export let autoplay:bool = true;
    export let loop:bool = true;
    export let muted:bool = true;
    export let preload:bool = true;
    export let controls:bool = false;
    export let letterboxColor:string = 'rgba(0,0,0,0)';


    // $: videoDomain = $page.data.siteConfig.cloudflareStreamDomain;
    // $: src = `https://${videoDomain}/${mediaItem.uid}/iframe?autoplay=${String(autoplay)}&loop=${String(loop)}&muted=${String(muted)}&preload=${String(preload)}&controls=${String(controls)}&letterboxColor=${encodeURIComponent(letterboxColor)}`

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
        // if(!window.cfplayers)
        //     window.cfplayers = {}
        
        // player = window.Stream(videoRef);
        // window.cfplayers[id] = player
        // player.addEventListener('playing', () => {
        //     if(!ready) {
        //         const reallyLoaded = setInterval(()=>{
        //             if(player.currentTime>0){
        //                 clearInterval(reallyLoaded);
        //                 ready=true;
        //                 loaded=true;
        //             }
        //         },40)
        //     }
        // });
        // player.play().catch(() => {
        //     console.log('playback failed, muting to try again');
        //     player.muted = true;
        //     player.play();
        // });
    }

    onMount(async()=>{
        console.log('$page',$page)
        let uniqueId = uuidv4();
        videoRef.setAttribute('id', uniqueId)

        // const awaitStream = setInterval(()=>{
        //     if('Stream' in window){
        //         clearInterval(awaitStream);
        //         initStream(uniqueId);
        //     }
        // },10)
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
    .youtube-container{
        --i: 0;
        padding-top: calc(100% / var(--aspect-ratio));
        background-size:contain;
        background-position: center;
        isolation: isolate;
        &[data-ready="false"] {
            background-color: #00000020;
            // &:after {
            //     content: '';
            //     position: absolute;
            //     top: 50%;
            //     left: 50%;
            //     width: 64px;
            //     height: 64px;
            //     background-image: var(--loading-graphic);
            //     transform: translate(-50%, -50%);
            //     background-size: contain;
            //     background-repeat: no-repeat;
            //     animation: rotate 6s infinite linear;
            //     animation-delay: calc(-1s * var(--i));
            //     mix-blend-mode: color-dodge;
            // }
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
    @keyframes rotate {
        0% {
            transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
            transform: translate(-50%, -50%) rotate(360deg);
        }
    }    

</style>
<!-- <pre>{JSON.stringify(mediaItem)}</pre> -->
<!-- svelte-ignore a11y-missing-attribute -->
<div 
    use:inview
    on:inview_enter={() => play()}
    on:inview_leave={() => pause()}
class="youtube-container {cssClass} --i: {i}" data-ready={ready} style="position: relative; --aspect-ratio: {aspectRatio}; {mediaItem?.poster?`background-image:url(${`/projects/${mediaItem.project.year}/${mediaItem.project.slug}/media/thumb512/${mediaItem.poster.hash}.webp`});`:''}"
><!-- <div class="interacter"></div
> --><iframe 
    src="https://www.youtube.com/embed/{mediaItem.v}" 
    title={mediaItem?.title || mediaItem.project.title} 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen
    bind:this={videoRef}
></iframe></div>