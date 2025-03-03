<script>
    import '../styles/global.scss';
	import { page } from '$app/stores';
    // import { load } from './+page.server';
    import { onMount, afterUpdate, beforeUpdate } from 'svelte';
	// $: siteData = $page.data.siteData;
	$: customPages = $page.data.siteConfig?.customPages || [];
	$: pages = $page.data.pages;
	$: siteConfig = $page.data.siteConfig;
	$: loadingGraphic = $page.data.siteConfig?.['loading-graphic'];
    $: loadingGraphicStyle = loadingGraphic ? `--loading-graphic: url('/${loadingGraphic}')` : '';
    // let scrollbarWidthStyle = '';

    let scrollbarOn = false;

    const checkForScrollbar = () => {
        scrollbarOn = document.documentElement.scrollHeight > document.documentElement.clientHeight;
        // document.body.classList.toggle('scrollbar-on', scrollbarOn);
        // console.log('checkForScrollbar', scrollbarOn)
    }

    const getScrollbarWidth = () => {
        // Creating a temporary div element
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll'; // forcing scrollbar to appear
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
        document.body.appendChild(outer);

        // Creating a child div element and get its width
        const inner = document.createElement('div');
        outer.appendChild(inner);
        const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

        // Removing the temporary div elements
        outer.parentNode.removeChild(outer);

        return scrollbarWidth;
    }
    
    let lastLoc = ''
    beforeUpdate(()=>{
        const newLoc = window.location.href
        if(lastLoc !== newLoc){
            // console.log('location change');
            lastLoc = newLoc;
            //emit custom 'location-change' event on widnow
            window.dispatchEvent(new Event('location-change'));
        }
    })

    onMount(()=>{
        const scrollbarWidth = getScrollbarWidth();        // scrollbarWidthStyle = `--scrollbar-width: ${scrollbarWidth}px;`
        document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    })
    
</script>
<svelte:head>
    <script src="https://embed.cloudflarestream.com/embed/sdk.latest.js" id="cloudflare-stream-sdk" rel="preload" ></script>
</svelte:head>
<style lang="scss">
    // $primary-color: rgb(0 185 83);
    $primary-color: #d6007a;

    nav {
        a {
            color: $primary-color;
            display: inline-block;
            margin: 0 0.5em 0 0;
        }
    }
    #site-wrap {
        --font-size: min(7.5rem,max(2.5rem,min(20svh, max(0px,calc(0.8 * ( var(--max-size) - 1024px))))));
        margin-top: min(20svh, max(0px,calc(0.5 * (var(--max-size) - 1024px))));
        margin-bottom: max(20svh, max(0px,calc(var(--max-size) - 1024px)));
        #site-title {
            // height: var(--font-size);
            h1 {
                font-size: var(--font-size);
                // margin-top: calc(-1 * var(--font-size));
                // height: var(--font-size);
            }
        }
    }
</style>

<div class="container mx-auto p-4" id="site-wrap" data-pathUrl={$page.url.pathname} style="{loadingGraphicStyle}">
    <div id="site-title" class="flex flex-wrap">
        <h1><a href="/">{siteConfig.name}</a></h1>
    </div>
    <div class="">
        <nav class="">
            <a href="/">Home</a>
            <a href="/projects#">Projects</a>
            {#each customPages as page}
                <a href="{page.url}">{page.title}</a>
            {/each}
            {#each pages as page}
                <a href="/{page.slug}">{page.title}</a>
            {/each}
        </nav>
        <main class=""><slot></slot></main>
    </div>
</div>