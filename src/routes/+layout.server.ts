
export const prerender = true;
export const trailingSlash = 'always';

import siteData from '../../data/siteData.js'; 

let siteDataMini:any = {}
let pageData: any[] = [];

Object.keys(siteData.pages).filter(n=>n!=='home').forEach(slug=>{
    pageData.push({slug, title: slug.replace(/-/g,' ').replace(/\w\S*/g, (w:string) => (w.replace(/^\w/, (c:string) => c.toUpperCase())))});
})
Object.keys(siteData).forEach(k=>{
    if(typeof siteData[k] !== "object"){
        siteDataMini[k] = siteData[k]
    }
})

console.log('pageData',pageData)
export async function load() {
    return { siteData: siteDataMini, siteConfig: siteData.config, pages: pageData };
}