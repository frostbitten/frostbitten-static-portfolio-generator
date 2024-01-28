import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type BuildOptions } from 'vite';
import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import { fileURLToPath } from 'url';
import mime from 'mime-types'
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

export default ({ mode }) => {
	let build:BuildOptions = {}


	// console.log("mode",{mode})
	if(mode === 'production'){
		// build.emptyOutDir = false;
	}else if(mode === 'development'){
		build.watch = {
			include: 'src/**',
		}
	}

	return defineConfig({
		build,
		server: {
			fs: {
				allow: ['data'],
			},
		},
		plugins: [
			{
				name: 'prebuild-commands',
				buildStart: async () => {
					glob(path.join(__dirname,'work/**/*'), (err, files) => {
						if (err) {
							console.error(`Error globbing files: ${err}`);
							return;
						}
						const knownDirs:string[] = [];
					
						for(let filePath of files){

							if(filePath.includes('!')) continue; //we assume this is part of a directory meant to be ignored


							// console.log(`Processing file: ${filePath}`);
							const relativePath = path.normalize(path.relative(path.join(__dirname,'work'),filePath))
							// console.log(`               : ${relativePath}`);

							const baseName = path.basename(filePath);
							const folderPath = path.join('static','projects',path.dirname(relativePath))
							const fileType = baseName.includes('.') ? baseName.split('.').pop() : null;
							if(!fileType) continue;
							const mimeType = mime.lookup(fileType)
							if(!mimeType) continue;
							const mediaType = mimeType.split('/')[0];
							// if(['image','video'].includes(mediaType)){
							if(['video'].includes(mediaType)){
								if(!knownDirs.find(dir=>dir.indexOf(folderPath)===0)){//not sure of exists
									if(fs.existsSync(folderPath)){
									}else{
										fs.mkdirSync(folderPath, { recursive: true });
									}
									knownDirs.push(folderPath);
								}
								fs.ensureSymlinkSync(filePath, path.join(folderPath,baseName))
							}
						}

					});
					console.log('Clearing old build files.')
					glob(path.join(__dirname,'build/**/*'), (err, files) => {
						for(let filePath of files){
							// console.log(`Processing file: ${filePath}`);
							const relativePath = path.normalize(path.relative(path.join(__dirname,'build'),filePath))
							// console.log(`               : ${relativePath}`);

							const baseName = path.basename(filePath);
							const folderPath = path.join('build',path.dirname(relativePath))
							const fileType = baseName.includes('.') ? baseName.split('.').pop() : null;
							if(!fileType) continue;
							const mimeType = mime.lookup(fileType)
							if(!mimeType) continue;
							const mediaType = mimeType.split('/')[0];
							if(['image','video'].includes(mediaType)){
							}else{
								fs.unlink(filePath);
								console.log('Deleted '+ relativePath)
							}
						}
					});

					console.log('prebuild done')
				}
			},
			sveltekit(),
		]
	});
}
