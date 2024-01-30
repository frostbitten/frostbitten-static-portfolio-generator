
export const prerender = true;
export const trailingSlash = 'always';

import siteData from '../../../data/siteData.js'; 
import md  from '$lib/markdownRenderer';

export async function load({params}) {
    const { singlePage } = params;
    const pageContentMd = siteData.pages[singlePage];
    // console.log('got single page',{singlePage,pageData})
    return { content: md.render(pageContentMd||'') };
}