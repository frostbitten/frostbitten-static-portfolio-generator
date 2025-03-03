<script lang="ts">

    import FastImage from './FastImage.svelte';
    export let mediaItem;
    $: hash = mediaItem.hash;
    $: slug = mediaItem.project.slug;
    $: year = mediaItem.project.year;
    $: previewSize = mediaItem.thumbs.thumb144.size > (1024*300) && mediaItem.thumbs.thumb144.size > mediaItem.thumbs.thumb512_still.size ? 'thumb512_still' : 'thumb144';
    $: thumbSize = mediaItem.thumbs.thumb512_sm.size > (1024*300) && mediaItem.thumbs.thumb512_sm.size > mediaItem.thumbs.thumb288.size ? 'thumb288' : 'thumb512_sm';
    $: aspectRatio = mediaItem.aspectRatio;

</script>
<!-- <pre>{JSON.stringify(mediaItem,null,2)}</pre> -->
<FastImage preload={false} lazy={true} aspectRatio={aspectRatio}
    preview="/projects/{year}/{slug}/media/{previewSize}/{hash}.webp" 
    src="/projects/{year}/{slug}/media/{thumbSize}/{hash}.webp" 
alt="" />
<!-- (/projects/{year}/{slug}/media/{thumbSize}/{hash}.webp) -->