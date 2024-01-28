
import { page } from '$app/stores';
import siteData from '../../../../../data/siteData.js'
export async function load({params}) {
    const { projectSlug:slug } = params;
    // console.log('load ran',{slug,siteData,params})
    return {
        // pageData: {test:1},
        project: siteData.projects.find(p=>p.slug===slug),
    };
}