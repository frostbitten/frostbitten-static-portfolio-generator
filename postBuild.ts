
import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import { fileURLToPath } from 'url';
import mime from 'mime-types'
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

const ignoreFromBuild = [
    './src/routes/projects/[year]/[projectSlug]/media/[...file]/+server.ts'
]
ignoreFromBuild.forEach((file)=>{
    const dir = path.dirname(file);
    const filename = path.basename(file);
    const currentPath = path.join(dir,'!'+filename)
    if(!fs.existsSync(currentPath)) return;
    fs.renameSync(currentPath,file);
})

//copy static to build
glob(path.join(__dirname,'static/**/*'), (err, staticFiles) => {
    glob(path.join(__dirname,'build-base/**/*'), (err, buildFiles) => {
        if (err) {
            console.error(`Error globbing files: ${err}`);
            return;
        }
        const fileSets = [
            {files:buildFiles,dir:'build-base'},
            {files:staticFiles,dir:'static'},
        ]
    
        for(let {files,dir} of fileSets){
            const knownDirs:string[] = [];
            for(let filePath of files){

                console.log('copy filePath',filePath)
                if(filePath.includes('!')) continue; //we assume this is part of a directory meant to be ignored
                if(fs.lstatSync(filePath).isDirectory()) continue;

                // console.log(`Processing file: ${filePath}`);
                const relativePath = path.normalize(path.relative(path.join(__dirname,dir),filePath))
                // console.log(`               : ${relativePath}`);

                const baseName = path.basename(filePath);
                // if(baseName.startsWith('!')) continue;
                
                const folderPath = path.join('build',path.dirname(relativePath))

                const fileType = baseName.includes('.') ? baseName.split('.').pop() : null;
                if(!fileType) continue;
                // if(!knownDirs.find(dir=>dir.indexOf(folderPath)===0)){//not sure of exists
                    if(fs.existsSync(folderPath)){
                    }else{
                        fs.mkdirSync(folderPath, { recursive: true });
                    }
                    // knownDirs.push(folderPath);
                // }
                const outPath = path.join(folderPath,baseName);
                if(fs.existsSync(outPath)) continue;
                fs.copyFileSync(fs.realpathSync(filePath),outPath)
                console.log('copied ' + outPath)
            }
        }
        console.log('postbuild done')

    });
});