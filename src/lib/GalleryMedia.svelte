<script lang="ts">
    import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate } from 'svelte';
    import { browser } from '$app/environment';
    // import { clearInterval } from 'timers';
    // import uniqueId from '$lib/uniqueId'
    export let cssClass = "";
    export let length;
    export let mediaLoaded;
    export let loaded;
    // if(!browser) return;
    let parentContainer: HTMLElement;
    let popupContainer: HTMLElement;
    let popupParentContainer: HTMLElement;
    let mediaOrigin: HTMLElement | null;
    let currentMedia: HTMLElement | null;
    let popupBg: HTMLElement;
    let closeButton: HTMLElement;
    let mediaOpenI = -1;
    let destroyFns:Function[] = [];
    let popupOpen = false;
    // const placeHolder = document.createElement('div')
    let placeHolder: HTMLElement;
    const fullSizeMediaCache:any = {}
    let mediaEls:any;
    let cfPlayer:any;

    let closePopup = (e)=>{
        if(currentMedia && mediaOrigin){
            if(popupContainer.getAttribute('media-type') === 'video'){
                popupContainer.querySelectorAll('video').forEach((videoEl)=>{
                    videoEl.controls = false;
                    videoEl.muted = true;
                })
                mediaOrigin.appendChild(currentMedia);
                placeHolder.remove();
            }else if(popupContainer.getAttribute('media-type') === 'cloudflare-stream'){
                currentMedia.classList.remove('pop-out');
                cfPlayer.muted = true;
                cfPlayer.controls = false;
                placeHolder.remove();
                cfPlayer=null;
            }else if(popupContainer.getAttribute('media-type') === 'youtube-stream'){
                currentMedia.classList.remove('pop-out');
                placeHolder.remove();
            }else{
                popupContainer.querySelector('.cover')?.remove();
            }
        }
        mediaOpenI = -1;
        popupOpen = false;
        currentMedia = null;
        e.stopPropagation()
    }
    

    const mediaOpen = (el,i)=>{
        return (e)=>{
            console.log('open media',el,i)
            if(mediaOpenI===i) return;
            currentMedia = el.querySelectorAll('video,img,.stream-container,.youtube-container')[0]
            if(!currentMedia) return;
            mediaOpenI=i;
            console.log('open media',currentMedia)
            mediaOrigin = currentMedia.parentElement;
            const mediaSize = currentMedia.getBoundingClientRect();
            if(currentMedia instanceof HTMLVideoElement){
                placeHolder.setAttribute('style',`width:${mediaSize.width}px;height:${mediaSize.height}px`);
                mediaOrigin?.appendChild(placeHolder);
                popupContainer.appendChild(currentMedia);
                popupContainer.setAttribute('media-type','video')
                setTimeout(()=>{ //prevent click from pausing video by skipping a tick
                    popupContainer.querySelectorAll('video').forEach((videoEl)=>{
                        videoEl.controls = true;
                        videoEl.muted = false;
                    })
                })
            }else
            if(currentMedia instanceof HTMLImageElement){
                const fullSrc = currentMedia.getAttribute('data-full');
                const aspectRatio = currentMedia.getAttribute('data-aspect-ratio');
                if(!fullSrc) return;
                if(!fullSizeMediaCache?.[fullSrc]){
                    fullSizeMediaCache[fullSrc] = document.createElement('img');
                    fullSizeMediaCache[fullSrc].classList.add('cover');
                    fullSizeMediaCache[fullSrc].classList.add(aspectRatio>1?'hz':'vt');
                    fullSizeMediaCache[fullSrc].src = fullSrc;
                    fullSizeMediaCache[fullSrc].style.setProperty('--aspect-ratio',aspectRatio);
                }
                popupContainer.setAttribute('media-type','image')
                popupContainer.appendChild(fullSizeMediaCache?.[fullSrc]);
            }else if(currentMedia.classList.contains('stream-container')){
                placeHolder.setAttribute('style',`width:${mediaSize.width}px;height:${mediaSize.height}px`);
                mediaOrigin?.appendChild(placeHolder);
                currentMedia.classList.add('pop-out');
                // currentMedia.appendChild(closeButton)
                popupContainer.setAttribute('media-type','cloudflare-stream')
                setTimeout(()=>{ //prevent click from pausing video by skipping a tick
                    const playerEl = currentMedia?.querySelector('iframe');
                    cfPlayer = window.cfplayers[playerEl?.getAttribute('id')];
                    cfPlayer.controls = true;
                    cfPlayer.muted = false;
                    // console.log('open player',playerEl,cfPlayer)
                })
            } if(currentMedia.classList.contains('youtube-container')){
                console.log('open youtube',currentMedia)
                placeHolder.setAttribute('style',`width:${mediaSize.width}px;height:${mediaSize.height}px`);
                mediaOrigin?.appendChild(placeHolder);
                currentMedia.classList.add('pop-out');
                popupContainer.setAttribute('media-type','youtube-stream')
            }
            popupOpen=true;
        }
    }
    onMount(()=>{
        // onload();
        loaded=true
        // mediaLoaded[1]=true
        // console.log('parentContainer',parentContainer)
        mediaEls = parentContainer.querySelectorAll('.media');
        placeHolder = document.createElement('div');
        window.placeHolder = placeHolder;
        placeHolder.classList.add('media-popout-placeholder')
        console.log('got mediaEls',mediaLoaded,mediaEls)
        function processMedia(){
            // mediaEls.forEach((el,i)=>{
            let i=0;
            for(let el of mediaEls){
                if(!el.getAttribute('data-ready')){
                    const openMediaFn = mediaOpen(el,i);
                    const openMediaKeyFn = (e)=>{
                        console.log('key',e.key)
                        if (e.key === 'Enter') {
                            closePopup(e);
                            return openMediaFn(e);
                        }
                    }
                    el.addEventListener('click',openMediaFn)
                    el.addEventListener('keydown',openMediaKeyFn)
                    destroyFns.push(()=>{
                        el.removeEventListener('click',openMediaFn)
                        el.removeEventListener('keydown',openMediaKeyFn)
                    })
                    el.setAttribute('data-ready',true);
                }
                i++;
            }
            return i;
        }
        const handleMedia = window.setInterval(()=>{
            const handledMediaCnt = processMedia();
            if(handledMediaCnt===length){
                clearInterval(handleMedia)
            }
        },100)
        return ()=>{destroyFns.forEach(fn=>{fn()})}
    })



    function modSafe(a,b){
        return (b+(a%b))%b;
    }
    function handleKeyDown(event) {
        // console.log('handle key down',event)
      if (event.key === "Escape") {
        // Handle escape key press
        closePopup(event)
      } else if (event.key === "ArrowLeft") {
        if(popupOpen){
            const openI = modSafe(mediaOpenI-1,mediaEls.length);
            const openMe = mediaEls[openI];
            closePopup(event)
            mediaOpen(openMe,openI)(event)
        }
      } else if (event.key === "ArrowRight") {
        if(popupOpen){
            const openI = modSafe(mediaOpenI+1,mediaEls.length);
            const openMe = mediaEls[openI];
            closePopup(event)
            mediaOpen(openMe,openI)(event)
        }
      }
    }
</script>
<svelte:window on:keydown={handleKeyDown} />
<style lang="scss">
    // :global(article) {
    //     background-color: #000;
    // }
    :global(.medias:not([data-media-open-i="-1"])) .cover {
        display:none;
    }
    :global(.media-popout-placeholder){
        background-color: rgb(187 15 113);
    }
    
    :global(.stream-container ~ .close-popup-button),
    :global(.youtube-container ~ .close-popup-button)
    {
        display:none
    }
    :global(.stream-container.pop-out ~ .close-popup-button),
    :global(.youtube-container.pop-out ~ .close-popup-button){
        display:block;
        position: fixed !important;
    }
    
    :global(.stream-container.pop-out),
    :global(.youtube-container.pop-out){
        position: fixed !important;
        padding-top: 0!important;
        z-index: 2;
        --width: min(var(--smDim), var(--smDim)* var(--aspect-ratio));
        width: var(--width);
        height: calc(var(--width) / var(--aspect-ratio));
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        :global(.interacter) {
            display: none;
        }
    }

    button.close-popup-button {
        position: fixed;
        right: 5svh;
        top: 2.5svh;
        z-index: 4;
        color: #fff;
        text-shadow: 0 0 0.25em #000;
    }
    .popup {
        
        .bg {
            position: fixed;
            right: 0;
            top: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            background: rgb(0 0 0 / 49%);
        }
        
        .popup-media {
            
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%);
            z-index: 2;

            // --width: min(var(--smDim), var(--smDim)* var(--aspect-ratio));
            // width: var(--width);
            // height: calc(var(--width) / var(--aspect-ratio));

            :global(> .cover.vt) {
                min-height: min(1080px,80svh,80svw);
            }
            :global(> .cover.hz) {
                min-width: min(1080px,80svw,80svh);
            }
            :global(> .cover) {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%,-50%);
                max-height: 95svh;
                max-width: 95svw;
                z-index: 2;
            }
            

            :global(.stream-container) {
                padding:0!important;
                width:100%;
                height:100%;
            }
        }
        
        &[data-open="false"] {
            display: none;
        }
    }
</style>
<div class={cssClass+ " medias"} bind:this={parentContainer} data-media-open-i={mediaOpenI}><slot></slot></div>
<div class="popup" data-open={popupOpen} bind:this={popupParentContainer}><button type="button" class="close-popup-button" bind:this={closeButton} on:click={closePopup}>&#10006;</button><div class="popup-media" bind:this={popupContainer}></div><div class="bg" bind:this={popupBg} on:click={closePopup}></div></div>