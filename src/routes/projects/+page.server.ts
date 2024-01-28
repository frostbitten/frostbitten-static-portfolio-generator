
export const prerender = true;
export const trailingSlash = 'always';

import siteData from '../../../data/siteData.js'; 


export async function load() {
    return { projects: siteData.projects.sort((a,b)=>b.year-a.year) };
}