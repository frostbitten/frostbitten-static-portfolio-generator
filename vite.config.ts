import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type BuildOptions } from 'vite';
import path from 'path'
// import fs from 'fs-extra'
import glob from 'glob'
import { fileURLToPath } from 'url';
import mime from 'mime-types'

import fs from 'fs';
import util from 'util';

// Store the original methods
const originalFunctions = {
  stat: fs.stat,
  statSync: fs.statSync,
  readFile: fs.readFile,
  readFileSync: fs.readFileSync,
  // Add other fs methods as needed
};

// Create logger
const logError = (method, path, error) => {
  console.error(`\n==== ENOENT ERROR DETECTED ====`);
  console.error(`Method: ${method}`);
  console.error(`Path: ${path}`);
  console.error(`Error: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  console.error(`===============================\n`);
};

// Monkey patch fs methods
fs.stat = function(path, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  
  originalFunctions.stat(path, options, (err, stats) => {
    if (err && err.code === 'ENOENT') {
      logError('fs.stat', path, err);
    }
    if (callback) callback(err, stats);
  });
};

fs.statSync = function(path, options) {
  try {
    return originalFunctions.statSync(path, options);
  } catch (err) {
    if (err.code === 'ENOENT') {
      logError('fs.statSync', path, err);
    }
    throw err;
  }
};

// Add other method overrides as needed
// For example:
fs.readFile = function(path, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  
  originalFunctions.readFile(path, options, (err, data) => {
    if (err && err.code === 'ENOENT') {
      logError('fs.readFile', path, err);
    }
    if (callback) callback(err, data);
  });
};



const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

export default ({ mode }) => {
	let build:BuildOptions = {}

	console.log('vite.config.ts',{mode})

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
					console.log('buildStart')
					// glob(path.join(__dirname,'work/**/*'), (err, files) => {
					// 	if (err) {
					// 		console.error(`Error globbing files: ${err}`);
					// 		return;
					// 	}
					// 	const knownDirs:string[] = [];
					
					// // 	for(let filePath of files){

					// // 		if(filePath.includes('!')) continue; //we assume this is part of a directory meant to be ignored


					// // 		// console.log(`Processing file: ${filePath}`);
					// // 		const relativePath = path.normalize(path.relative(path.join(__dirname,'work'),filePath))
					// // 		// console.log(`               : ${relativePath}`);

					// // 		const baseName = path.basename(filePath);
					// // 		const folderPath = path.join('static','projects',path.dirname(relativePath))
					// // 		const fileType = baseName.includes('.') ? baseName.split('.').pop() : null;
					// // 		if(!fileType) continue;
					// // 		const mimeType = mime.lookup(fileType)
					// // 		if(!mimeType) continue;
					// // 		const mediaType = mimeType.split('/')[0];
					// // 		// if(['image','video'].includes(mediaType)){
					// // 		// if(['video'].includes(mediaType)){
					// // 			// console.log('linking '+ relativePath)
					// // 			// if(!knownDirs.find(dir=>dir.indexOf(folderPath)===0)){//not sure of exists
					// // 			// 	if(fs.existsSync(folderPath)){
					// // 			// 	}else{
					// // 			// 		fs.mkdirSync(folderPath, { recursive: true });
					// // 			// 	}
					// // 			// 	knownDirs.push(folderPath);
					// // 			// }
					// // 			// fs.ensureSymlinkSync(filePath, path.join(folderPath,baseName))
					// // 		// }
					// // 	}

					// });
					console.log('Clearing old build files.')
					glob(path.join(__dirname,'build/**/*'), (err, files) => {
						for(let filePath of files){
							if(filePath.includes('.git')) continue;
							console.log(`Processing file: ${filePath}`);
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
								fs.unlinkSync(filePath);
								console.log('Deleted '+ relativePath)
							}
						}
					});

					console.log('prebuild done')
				}
			},
			
			{
				name: 'vite-enoent-plugin',
				configureServer(server) {
				server.middlewares.use((req, res, next) => {
					// Capture any middleware errors
					try {
					next();
					} catch (err) {
					if (err.code === 'ENOENT') {
						logError('Vite middleware', req.url, err);
					}
					throw err;
					}
				});
				}
			},
			sveltekit(),
		]
	});
}
