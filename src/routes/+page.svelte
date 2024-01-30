<script lang="ts">

    import { page } from '$app/stores';

	$: content = $page.data.content;

</script>
{@html content}