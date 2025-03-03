// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
// import adapter from 'sveltejs-adapter-static-skip';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import siteData from './data/siteData.js'
// import { dev } from '$app/environment';
// console.log('config env',process.env)
// import sveltePreprocess from 'svelte-preprocess';

const dev = process.env.NODE_ENV === 'development';
const production = process.env.NODE_ENV === 'production';
let adapterOpts = {}

if(production){
	// adapterOpts.assets = false;
	adapterOpts.assets = 'build-base';
	adapterOpts.pages = 'build-base';
}

let entries = ['/','/projects'];

Object.keys(siteData.pages).filter(n=>n!=='home').forEach(slug=>{entries.push('/'+slug)})
siteData.projects.forEach(project=>{entries.push(`/projects/${project.year}/${project.slug}`)})

console.log('page entries:',entries)

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess({
		scss: {
		  // SCSS options
		},
	}),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter( adapterOpts ),
		prerender: {
			handleMissingId: 'ignore',
			entries,
		},
	}
};

console.log('exporting config',config)

export default config;
