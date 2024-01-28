<script lang="ts">
	import { page } from '$app/stores';
    import { onMount, beforeUpdate, afterUpdate } from 'svelte';
    import { browser } from '$app/environment';
    import FastVideo from '$lib/FastVideo.svelte'
    import CloudflareStream from '$lib/CloudflareStream.svelte'

    // console.log('page load')
	$: siteData = $page.data.siteData;
	// $: projects = $page.data.siteData.projects.sort((a,b)=>b.year-a.year);
	$: projects = $page.data.projects
    let ready = false;
    let filter = "";
    if(browser && window.location.hash.startsWith("#search:")) {
        filter = decodeURIComponent(window.location.hash.split("#search:")[1])
    }
    let filterWords:any = []
    let preFabFilters = ['Commercial', 'Personal', 'Blender', '3D', 'Animation', ]
    let updateHashTimeout = setTimeout(()=>{})
    $: allowAutoFilterUpdate = true;
    $: updateFilter = (newFilter:any=null)=>{
        allowAutoFilterUpdate = false;
        // console.log('called updateFilter')
        if(newFilter!==null && typeof newFilter === "string") filter = newFilter;
        filterWords = filter.toLowerCase().trim().split(/\s+/)
        clearTimeout(updateHashTimeout);
        updateHashTimeout = setTimeout(()=>{
            const hash = (filterWords.length===0||filterWords[0]==="") ? "" : "search:"+filterWords.join(' ')
            window.location.hash=hash;
            allowAutoFilterUpdate = true;
        },300)
    }
    $: doFilterWords = (project) => {
        if(filterWords.length===0||filterWords[0]==="") return true
        for( let testWord of filterWords ){
            if(project?.title && project.title.toLowerCase().includes(testWord)) continue;
            if(project?.description && project.description.toLowerCase().includes(testWord)) continue;
            if(project?.year && project.year.toLowerCase().includes(testWord)) continue;
            if(project?.slug && project.slug.toLowerCase().includes(testWord)) continue;
            if(project?.type && project.type.toLowerCase().includes(testWord)) continue;
            if(project?.keywords && project.keywords.findIndex(k=>k.toLowerCase().includes(testWord)) > -1) continue
            return false;
        }
        
        return true;
    }

    let lastLoc = ''
    beforeUpdate(()=>{
        const newLoc = window.location.href
        if(lastLoc !== newLoc){
            // console.log('location change');
            lastLoc = newLoc;
            if(allowAutoFilterUpdate) checkHashUpdate()
        }
    })

    const checkHashUpdate = (event:any=null) => {
        allowAutoFilterUpdate = false;
        // console.log('hashchange', event, window.location.hash)
        if(window.location.hash.startsWith("#search:")) {
            const newFilter = decodeURIComponent(window.location.hash.split("#search:")[1])
            if(newFilter !== filter)
                updateFilter(newFilter)
        }else if(window.location.hash.length<2 && filter.length>0){
            // console.log('clear filter')
            updateFilter('')
        }
    }
    onMount(() => {
        // console.log('siteData',siteData);
        // console.log('projects',projects);
        updateFilter()
        ready=true;
        // window.addEventListener("hashchange", (event) => {
        window.addEventListener("popstate", checkHashUpdate);

        // let checkForEmptyHash = setInterval(()=>{
        //     console.log('check for empty hash',filter,window.location.hash.length)
        //     if(allowAutoFilterUpdate && filter && window.location.hash.length<2){
        //         console.log('clear filter')
        //         updateFilter('')
        //     }
        // },150)

        // return ()=>{ clearInterval(checkForEmptyHash) };
    });



</script>
<style lang="scss">
    .filter {
        margin: 1em 0 0;
    }
    .filter-inputs {
        align-items: self-end;
        .write-filter {
            > span {
                display: block;
                font-size: 0.8em;
                font-variant: small-caps;
            }
            input {
                font-size: 0.9em;
                width: 15em;
                padding: 0 1px;
            }
        }
        .review-filter {
            display: flex;
            align-items: self-end;
            padding-left: 1em;
            input {
                font-size: 3em;
                color:#00000045;
                background: transparent;
                height: 1.5em;
                line-height: 1.5em;
                margin-bottom: -0.3em;
            }
        }
    }
</style>
<div class="ready" data-status={ready}></div>
<h1>Projects</h1>
<div class="filter">
    <div class="flex filter-inputs">
        <div class="write-filter">
            <span>Filter</span>
            <input type="text" bind:value={filter} name="filter" on:change={updateFilter} on:keyup={updateFilter} placeholder="(year, software, technique, title)">
        </div>
        <div class="review-filter"><input type="text" bind:value={filter} name="filter-big" on:change={updateFilter} on:keyup={updateFilter}></div>
    </div>
    <div class="keywords">
        # <a href="/projects/#" class="keyword">All Projects</a>
        {#each preFabFilters as preFabFilter}
            <a href={'#search:'+preFabFilter.toLowerCase()} class="keyword" >{preFabFilter}</a>
            <!-- on:click={updateFilter(preFabFilter.toLowerCase()} -->
        {/each}
    </div>
    <!-- <pre>{JSON.stringify(filterWords)}</pre> -->
</div>
<section class="projects flex flex-wrap">
    {#if ready}
        {#each projects.filter(doFilterWords) as project}
            <article class="w-full md:w-6/12 project">
                <header>
                    <a class="project-link-header" href="/projects/{project.year}/{project.slug}">
                        <span class="title">{project.title}</span>
                        <span class="year">{project.year}</span>
                    </a>
                </header>
                <div class="cover">
                    {#if project.cover}
                        {#if project.cover.mediaType === "cloudflare-stream"}
                            <CloudflareStream mediaItem={project.cover} />
                        {:else if project.cover.mediaType === "video"}
                            <!-- svelte-ignore a11y-media-has-caption -->
                            <!-- <video class="cover" muted autoplay loop src="/projects/{project.year}/{project.slug}/media/{project.cover.fileName}"></video> -->
                            <FastVideo src={`/projects/${project.year}/${project.slug}/media/${project.cover.fileName}`} />
                        {:else}
                            <img src="/projects/{project.year}/{project.slug}/media/thumb512/{project.cover.hash}.webp" alt="">
                        {/if}
                    {:else}
                    {/if}
                </div>
                <!-- svelte-ignore a11y-missing-content -->
                <a class="project-link" href="/projects/{project.year}/{project.slug}"></a>
            </article>
        {/each}
    {/if}
</section>