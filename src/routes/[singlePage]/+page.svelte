<script>
	import { page } from '$app/stores';
    import { onMount } from 'svelte';

	$: singlePage = $page.params.singlePage;
	$: content = $page.data.content;
    
    onMount(() => {
        // console.log('page',$page);
        // console.log('slug',slug);
        // console.log('siteData',siteData);
        // console.log('projects',projects);
        // console.log('project',project);
        // console.log('about',about);
    });
</script>

{@html content}