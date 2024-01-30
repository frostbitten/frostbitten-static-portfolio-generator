
export const prerender = true;
export const trailingSlash = 'always';

import siteData from '../../data/siteData.js'; 
import md  from '$lib/markdownRenderer';

export async function load() {
    const pageData = siteData.pages?.home || '';
    // console.log('got single page',{singlePage,pageData})
    return { content: md.render(pageData) };
}