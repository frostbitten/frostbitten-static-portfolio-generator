<script lang="ts">
	import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import FastVideo from '$lib/FastVideo.svelte'
    import FastImage from '$lib/FastImage.svelte'
    import GalleryMedia from '$lib/GalleryMedia.svelte'
    import CloudflareStream from '$lib/CloudflareStream.svelte'
    import MediaPlaceholder from '$lib/MediaPlaceholder.svelte'
    import YoutubeMedia from '$lib/YoutubeMedia.svelte'
    import IframeMedia from '$lib/IframeMedia.svelte'

	import md  from '$lib/markdownRenderer';

	// let ready = false;
	// let pageData;
	// console.log('pageData',pageData)

	let mediaLoaded:any[]=[];

	$: year = $page.params.year;
	$: slug = $page.params.projectSlug;
	$: project = $page.data.project
	$: medias = (()=>{
			const sortName = (a,b)=>{
				return a.baseName.localeCompare(b.baseName)
			};
			const sortSort = (a,b)=>{
				return a.sort - b.sort
			};
			const goodMedia = project.medias.filter((mediaItem)=>{
				return !mediaItem?.hidden
			})
			// console.log('goodMedia',goodMedia)
			const sortFirst = goodMedia.filter((mediaItem)=>{
				return mediaItem?.sort < 0
			}).sort(sortSort)
			// console.log('sortFirst',sortFirst)
			const sortLast = goodMedia.filter((mediaItem)=>{
				return mediaItem?.sort > 0
			}).sort(sortSort)
			// console.log('sortLast',sortLast)
			const sortableMedia = goodMedia.filter((mediaItem)=>{
				return mediaItem?.sort === undefined
			}).sort(sortName)
			// console.log('sortableMedia',sortableMedia)

			return sortFirst.concat(sortableMedia).concat(sortLast);
	})()
	$: about =  md.render(project?.about||project?.description||'')
    onMount(() => {
        // console.log('page',$page);
        // console.log('slug',slug);
        // console.log('siteData',siteData);
        // console.log('projects',projects);
        // console.log('project',project);
        // console.log('about',about);
		// ready=true
    });
</script>
<style lang="scss">

header {
    overflow: hidden;
	h1 {
		color: #fff;
		background: #000;
		display: inline-block;
		padding-right: 0.5em;
		padding-left:1px;
		box-shadow: -1em 0.2em #4bed94, 0.2em -0.2em #bb0f71;
		transition: all ease 0.2s;
		transition-delay: 1s;
	}
}
.ready[data-ready="true"]  ~ header {
	h1 {
		background: #00000000;
	}
}

.media {
	cursor: pointer;
}

:global(article.media:not([data-ready="true"]) .player) {
	position: relative;

	:global(.media-placeholder) {
		position: absolute!important;
    	top: 0;
	}
}
:global(article.media[data-ready="true"] .player .media-placeholder) {
	display:none;
}

:global(article.media .player .fast-image:not(.ready) + .media-placeholder) {
	display:block;
}


</style>
<!-- <div class="ready" data-ready={ready}></div> -->
<header>
	<h1>{project.title}</h1>
	<div>{year}</div>
	<div>{@html about}</div>
</header>
<div class="keywords">
	# 
	{#each project.keywords as keyword}
		<a class="keyword" href="/projects/#search:{keyword}">{keyword}</a>
	{/each}
</div>
<div data-media-cnt={project.medias.length} data-media-cnt-mod2={project.medias.length%2} data-media-cnt-mod3={project.medias.length%3} data-media-cnt-mod5={project.medias.length%5}>
	<!-- <pre>{JSON.stringify(mediaLoaded)}</pre> -->
	<GalleryMedia length={project.medias.length} {mediaLoaded}>
	{#each medias as media, i}
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<article class="media w-full md:w-1/2 2xl:w-1/3" tabindex="0">
			<div class="player" style="--aspect-ratio: {media.aspectRatio}" data-media-type={media.mediaType}><!-- {#if i===0 || mediaLoaded[i-1]} -->
				{#if media.mediaType === "cloudflare-stream"}
					<CloudflareStream mediaItem={media} bind:loaded={mediaLoaded[i]} preload={false}/>
				{:else if media.mediaType === "youtube"}
					<YoutubeMedia mediaItem={media} bind:loaded={mediaLoaded[i]} preload={false}/>
				{:else if media.mediaType === "iframe"}
					<IframeMedia mediaItem={media} bind:loaded={mediaLoaded[i]} preload={false}/>
				{:else if media.mediaType === "video"}
					<FastVideo cssClass="cover" src="/projects/{year}/{slug}/media/{media.fileName}" bind:loaded={mediaLoaded[i]}   />
				{:else if media.mediaType === "image"}
					<!-- <img src="/projects/{year}/{slug}/media/thumb512/{media.hash}.webp" alt="" data-full="/projects/{year}/{slug}/media/full/{media.hash}.{media.fullExt}"> -->
					<FastImage aspectRatio={media.aspectRatio} src="/projects/{year}/{slug}/media/thumb512/{media.hash}.webp" alt="" bind:loaded={mediaLoaded[i]} srcFull={`/projects/${year}/${slug}/media/full/${media.hash}.${media.fullExt}`} />
				{/if}
				<!-- <pre>{JSON.stringify(media,null,2)}</pre> -->
			<!-- {:else}
			{/if} -->
				<!-- <MediaPlaceholder aspectRatio={media.aspectRatio} cssClass="cover" /> -->
			</div>
			{#if media.title}
				<div class="description">{media.title}</div>
			{/if}
			{#if media.description}
				<div class="description">{media.description}</div>
			{/if}
		</article>
	{/each}
	</GalleryMedia>
</div>