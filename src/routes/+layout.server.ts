
export const prerender = true;
export const trailingSlash = 'always';

import siteData from '../../data/siteData.js'; 

let siteDataMini:any = {}

Object.keys(siteData).forEach(k=>{
    if(typeof siteData[k] !== "object"){
        siteDataMini[k] = siteData[k]
    }
})

export async function load() {
    return { siteData: siteDataMini, siteConfig: siteData.config };
}