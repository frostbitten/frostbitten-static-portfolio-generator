<script lang="ts">
	/***********************************************************************************************
	 *  FastImage.svelte
	 *  Goal: To provide a drop-in replacement for <img> tags that can handle:
	 		- lazy loading
			- preloading
			- aspect ratio
			- placeholder
	 		- full size image
	 *  Lazy loading:
	 	* the browser has the ability to automatically lazy load.
	 ***********************************************************************************************/


    import { onMount, beforeUpdate, afterUpdate } from 'svelte';

    import { inview } from 'svelte-inview';

	//   export let mediaI;
    let ready = false
	export let srcFull:any=null;
	export let src:string;
	export let preview:any = false;
    let previewSrc = 'none';
	export let alt = "";
	export let loaded: boolean = false;
	let loadingPartial: boolean = false;
	let loadedPartial: boolean = false;
	export let preload = false;
    export let lazy = true;
    export let aspectRatio:any = null;
    let cssClass:string = ""
    let show: boolean = false;
    let imgSrc = (preload || lazy) ? src : '';
	let naturalWidth = 0;
	let naturalHeight = 0;
    let isInView: boolean;
    let imgRef: HTMLImageElement;

	let progressCheck = setInterval(()=>{
		if(imgRef && imgRef.naturalWidth > 0 && imgRef.naturalHeight > 0) {
			if(loadingPartial){
				if(imgRef.getBoundingClientRect().height>0){
					loadedPartial=true;//at least one frame of the image has been loaded
					clearInterval(progressCheck);
				}
			}else{
				console.log('img loaded one frame',imgRef.naturalWidth,imgRef.naturalHeight)
				loadingPartial=true;
			}
		}
	},40)
	
    const imgLoaded = ()=>{
      loaded=true;
	  naturalWidth = imgRef.naturalWidth;
	  naturalHeight = imgRef.naturalHeight;
    }


	const enterView = (e:ObserverEventDetails)=>{
		console.log('inview_enter',imgRef)
		if(imgSrc!==src){imgSrc=src;}
		show=true;
		ready=true;
  	}

    onMount(()=>{
		if(preview) previewSrc = `url(${preview})`;
		if(imgRef?.complete) {
			imgLoaded()
		}
		else {

			imgRef?.addEventListener('load',imgLoaded)
		}
		return ()=>{
			imgRef?.removeEventListener('load',imgLoaded)
			clearInterval(progressCheck);
		}
    })
</script>
<style lang="scss">
.fast-image {
	&.loaded.show,
	&.loadedPartial.show {
		.fast-image-placeholder {
			display:none;
		}
	}
	&:not(.show) {
		img.primary {
			display:none;
		}
	}
	.preview {
		position: absolute;
	}
	&.loading-partial:not(.loaded-partial) {
		img.primary {
			display: block;
			position: absolute;
			opacity: 0;
		}
	}
	.fast-image-placeholder {
		padding-top: calc(100% / var(--aspect-ratio));
		background-color: #00000020;
    	position: relative;
	}
	background-image: var(--preview-src);
	background-size:cover;
	background-position: center;
	&.show img { display: block }
}
</style>
<div
  use:inview
  on:inview_enter={enterView}
  class="fast-image {cssClass}" class:loaded={loaded} class:loaded-partial={loadedPartial} class:loading-partial={loadingPartial} class:show={show} style="--preview-src: {previewSrc};"
>
<img class="primary" src={imgSrc} loading="{lazy?'lazy':'eager'}" bind:this={imgRef} data-aspect-ratio="{aspectRatio}" style="{aspectRatio?`--aspect-ratio:${aspectRatio};`:''}" alt={alt} data-full={srcFull} decoding="async">
{#if preview && !loaded}<img class="preview" src={preview} alt={alt}>{/if}
{#if !loadedPartial}<div class="fast-image-placeholder"style=""></div>{/if}
</div>