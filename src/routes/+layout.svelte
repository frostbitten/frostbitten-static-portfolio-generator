<script>
    import '../styles/global.scss';
	import { page } from '$app/stores';
    // import { onMount } from 'svelte';
	$: siteData = $page.data.siteData;
	$: pages = $page.data.pages;
	$: siteConfig = $page.data.siteConfig;

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
</style>

<div class="container mx-auto p-4" data-pathUrl={$page.url.pathname}>
    <div class="flex flex-wrap">
        <h1><a href="/">{siteConfig.name}</a></h1>
    </div>
    <div class="">
        <nav class="">
            <a href="/">Home</a>
            <a href="/projects#">Projects</a>
            {#each pages as page}
                <a href="/{page.slug}">{page.title}</a>
            {/each}
        </nav>
        <main class=""><slot></slot></main>
    </div>
</div>