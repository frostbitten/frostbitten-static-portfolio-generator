import path from 'path'
import fs from 'fs'

const ignoreFromBuild = [
    './src/routes/projects/[year]/[projectSlug]/media/[...file]/+server.ts'
]
ignoreFromBuild.forEach((file)=>{
    if(!fs.existsSync(file)) return;
    const dir = path.dirname(file);
    const filename = path.basename(file);
    fs.renameSync(file,path.join(dir,'!'+filename));
})