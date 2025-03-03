// import fs from 'fs'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url';
import YAML from 'yaml'
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import mime from 'mime-types'
import webp from 'webp-converter'
import sharp from 'sharp'
import pLimit from 'p-limit';
import os from 'os'
import CRC32C from 'crc-32'


const numCpuThreads = os.cpus().length;
const threadsToUse = Math.max(1,Math.floor(numCpuThreads/2));
const limit = pLimit(threadsToUse);

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

const workPath = path.join(__dirname, 'work');


function crc32ToHex(crc) {
	// Convert to unsigned 32-bit integer
	const unsigned = crc >>> 0;
	// Convert to hex and pad with zeros if needed
	return unsigned.toString(16).padStart(8, '0');
}


// Function to recursively read project folders
const readProjects = async (workPath:string) => {
	const projects:any[] = [];
	const years:any[] = [];
	const keywords:any[] = [];
	const siteConfig:any = {}
	const pages:any = {}

	// await new Promise((res)=>{setTimeout(function(){res(true)},1000)})
	
	// Read site config.yaml file
	const siteConfigPath = path.join(__dirname, 'work', 'config.yaml');
	if (fs.existsSync(siteConfigPath)) {
		const yamlContent = fs.readFileSync(siteConfigPath, 'utf8');
		try {
			const yamlData = YAML.parse(yamlContent);
			Object.assign(siteConfig, yamlData);
		}catch (e) {
			console.error('Error parsing config.yaml file',e);
		}
	}
	// console.log('siteConfig',siteConfig)

	// console.log('Reading projects from', workPath)
	const workFolder = fs.readdirSync(workPath, { withFileTypes: true });
	// console.log('yearFolders',yearsFolders)
	// console.log("\n")
	for( let workItem of workFolder ) {
		if (workItem.isDirectory()) {
			const yearFolder = workItem;
			const year = yearFolder.name;
			const projectsPath = path.join(workPath, year);
			const projectsFolders = fs.readdirSync(projectsPath, { withFileTypes: true });
			// console.log('projectFolders',projectsFolders)
			// console.log("\n")
			for( let entry of projectsFolders) {
				if (entry.isDirectory()) {
					if(!years.includes(year)){ years.push(year); }

					// console.log('Found project' + `${entry.name} (${yearFolder.name})`);
					const projectName = entry.name;
					const projectPath = path.join(projectsPath, entry.name);
					const medias:any[] = []
					const slug = slugify(entry.name);
					const projectData:any = {
						year,
						slug,
						folder: entry.name,
						projectName,
						title: projectName,
						medias,
						keywords: [],
					};

					// Read project.yaml file
					const yamlPath = path.join(projectPath, 'project.yaml');
					if (fs.existsSync(yamlPath)) {
						// console.log('Reading project.yaml file');
						const yamlContent = fs.readFileSync(yamlPath, 'utf8');
						const yamlData = YAML.parse(yamlContent);
						Object.assign(projectData, yamlData);
					}

					const mediasProperties = {...projectData?.media};
					if(projectData?.media) delete projectData.media
					// console.log('Read project.yaml file');

					// Read about.md file
					const aboutPath = path.join(projectPath, 'about.md');
					if (fs.existsSync(aboutPath)) {
						const content = fs.readFileSync(aboutPath, 'utf8');
						projectData.about = content;
					}
					
					if(projectData?.keywords){
						projectData.keywords.forEach((tag) => {
							if(!keywords.includes(tag)){
								keywords.push(tag);
							}
						});
					}
					// console.log('Handled keywords');

					const projectInfo = {year: projectData.year, slug: projectData.slug, title: projectData.title, folder: projectData.folder, projectName};
					// Read media folder
					const mediaPath = path.join(projectPath, 'media');
					console.log('Reading media folder', {mediaPath});
					if (fs.existsSync(mediaPath)) {
						const mediasFiles = fs.readdirSync(mediaPath);
						for(let mediaFile of mediasFiles){
							console.log('checking mediaFile', {mediaFile});
							if(mediaFile.startsWith('!')) continue;
							if(mediaFile.includes('!')) continue;
							if(!mediaFile.includes('.')) continue
							const mediaElement = await processMediaFile(mediaFile,mediaPath,projectData);
							if(mediaElement){
								if(mediasProperties?.[mediaFile]){
									if(typeof mediasProperties[mediaFile] === "string"){
										mediaElement.title = mediasProperties[mediaFile];
									}else
										Object.assign(mediaElement, mediasProperties[mediaFile]);
								}
								// console.log('got media element', mediaElement)
								mediaElement.project = projectInfo;
								medias.push(mediaElement)
							}
						}
						for(let media of medias){
							// console.log('handle media second time',media)
							if(media?.poster){
								media.poster = medias.find(m=>m.fileName===media.poster);
							}
						}
						projectData.cover = medias.find(media=>media.isCover||media.cover) || medias.find(media=>media.mimeType==="image/gif") || medias.find(media=>media.mediaType==="image");
					}
					// console.log('Handled media');
					projects.push(projectData);
				}
			};
		}else if(workItem.name.endsWith('.md')){
			pages[workItem.name.split('.').slice(0,-1).join('.')] = fs.readFileSync(path.join(workItem.path,workItem.name), { encoding: 'utf8', flag: 'r' });
		}
	}
	return {config:siteConfig, projects, years, keywords, pages};
};
let knownDirs:string[] = [];
async function processMediaFile(mediaFile:string, mediaPath:string, projectData:any){
	console.log('processMediaFile',mediaFile,mediaPath)
	// const thumbnailSizes = [144,288,512];
	const thumbnailSizes = [
		{
			size:144,
			folder:'thumb144',
			quality: 69,
			minQuality: 33,
			maxFileSize: 0.2, //MB
			qualityStep: 9,
		},
		{
			size:288,
			folder:'thumb288',
			quality: 69,
			minQuality: 39,
			maxFileSize: 0.8, //MB
			qualityStep: 6,
		},
		{
			size:512,
			folder:'thumb512',
			quality: 69,
			minQuality: 33,
			maxFileSize: 2, //MB
			qualityStep: 9,
		},
		{
			size:512,
			folder:'thumb512_sm',
			quality: 22,
			minQuality: 10,
			maxFileSize: 2, //MB
			qualityStep: 3,
		},
		{
			size:512,
			folder:'thumb512_still',
			still: true,
			quality: 78,
			minQuality: 24,
			maxFileSize: 0.1, // MB
			qualityStep: 9,
		},
	];
	const fileName = mediaFile;
	const mediaItem:any = {
		fileName,
		baseName: fileName.split('.').slice(0, -1).join('.'),
	}
	const mediaFullPath = path.join(mediaPath,fileName);
	
	const relativeFolder = path.relative(
		path.join(__dirname,'work'),
		mediaPath
	);

	const relativePathParts = relativeFolder.split(path.sep);
	const projectYear = relativePathParts[0];
	const projectFolderSrc = relativePathParts[1];
	const relativeInProject = relativePathParts.slice(2).join(path.sep);

	// const staticFolder = path.join(__dirname,'static','projects',relativeFolder)
	const staticFolder = path.join(__dirname,'static','projects',projectYear, projectData.slug, relativeInProject);

	console.log({mediaFile,mediaPath,relativeFolder,staticFolder,relativePathParts, projectData}); 
	// throw 'stop';

	const fileType:string = (fileName.split('.').pop() || "").toLowerCase()
	mediaItem.fileType = fileType;
	mediaItem.fullExt = fileType;
	const mimeType = mime.lookup(fileType)
	if(!mimeType) return;
	// console.log('mimeType',mimeType)
	mediaItem.mimeType = mimeType;
	const mediaType = mimeType.split('/')[0]
	mediaItem.mediaType = mediaType;


	const hash = crc32ToHex(CRC32C.str(mediaItem.baseName,0));
	mediaItem.hash = hash;

	
	console.log('media info:',{mediaItem})

	const setMediaSize = (mediaItem,width,height)=>{
		mediaItem.width = width??0;
		mediaItem.height = height??0;
		mediaItem.aspectRatio = mediaItem.width/mediaItem.height;
	}


	if(!knownDirs.find(dir=>dir.indexOf(staticFolder)===0)){//not sure of exists
		[{folder:'full'}].concat(thumbnailSizes).forEach(thumb=>{
			if(fs.existsSync(path.join(staticFolder,thumb.folder))) return;
			fs.mkdirSync(path.join(staticFolder,thumb.folder), { recursive: true });
		})
		knownDirs.push(staticFolder);
	}
	
			
	let destinationPath, destinationPathAlt;

	if(mediaFile.endsWith('.cfstream.json')){
		// console.log('handle cfstream')
		const mediaInfo = JSON.parse(fs.readFileSync(mediaFullPath, 'utf-8'));
		// console.log('cfstream mediaInfo: ',mediaInfo)
		const { type:mimeType, name:fileName } = mediaInfo.meta;
		
		mediaItem.fileName = fileName;
		// console.log('cfstream mediaFile: ',fileName)
		mediaItem.baseName = fileName.split('.').slice(0, -1).join('.');

		// const mediaType = mimeType.split('/')[0]
		// mediaItem.mediaType = mediaType;

		const { width , height } = mediaInfo.input;
		setMediaSize(mediaItem,width,height)

		const uid = mediaInfo.uid;
		mediaItem.uid = uid;
		mediaItem.mediaType = "cloudflare-stream"

	}
	else if(mediaFile.endsWith('.yaml')){
		console.log('handle yaml stream')
		
		const yamlContent = fs.readFileSync(mediaFullPath, 'utf8');
		try {
			const mediaInfo = YAML.parse(yamlContent);
			Object.assign(mediaItem, mediaInfo);
			// console.log('yaml mediaInfo: ',mediaInfo)
			const width = mediaInfo.width;
			const height = mediaInfo.height;
			
			mediaItem.fileName = mediaFile.split('.').slice(0, -1).join('.');
			mediaItem.baseName = mediaItem.fileName;

			setMediaSize(mediaItem,width,height)
			
			mediaItem.v = mediaInfo.v;
			mediaItem.mediaType = mediaInfo.type;


		}catch (e) {
			console.error(`Error parsing ${mediaFullPath} file`,e);
		}

	}
	else if(mediaType==="video"){

		await new Promise((res) => {
			ffprobe(mediaFullPath, { path: ffprobeStatic.path }, function (err, info) {
				if (err) {
					console.error(err);
					// return rej(err);
					return res(false);
				}
				// console.log('got streams info:',info);
				// mediaItem.info = info;
				let width,height;
				for(let stream of info.streams){
					if(stream?.width){
						width = stream.width
						height = stream.height
						break;
					}
				}
				setMediaSize(mediaItem,width,height)
				
				const destinationPath = path.join(staticFolder,`full`,`${hash}.${fileType}`)
				if(!fs.existsSync(destinationPath)){
					// fs.copyFileSync(mediaFullPath,destinationPath)
					fs.ensureSymlinkSync(mediaFullPath, destinationPath)
				}
				res(true)
			})
		});
	}
	else if(mediaType==="image"){
			const animated = fileType==="gif"
			if(animated) mediaItem.animated = true;
			let sharpOptions:any;
			if(animated) sharpOptions = { animated, pages: -1 };
			
			const sharpImageBase = sharp(mediaFullPath, sharpOptions) // supports animated gif and webp images
			let sharpStillImageBase = sharp(mediaFullPath, { animated: false })
			const imageMeta = await sharpImageBase.metadata()
			// console.log('got metadata',imageMeta)
			const {width, height, pageHeight} = imageMeta;
			setMediaSize(mediaItem,width,pageHeight??height)

			mediaItem.thumbs = {};
			[{folder:'full'}].concat(thumbnailSizes).forEach((size)=>{
				mediaItem.thumbs[size.folder] = {}
			})

			let thumbTasks:any[] = [];

			for(let thumb of thumbnailSizes){
				const size = thumb.size;
				const thumbFolder = thumb.folder;
				const quality = thumb?.quality || 69;
				const still = thumb?.still || false;
				if(still && !animated) continue;
				thumbTasks.push(()=>{
					return new Promise(async (res)=>{
						const destinationPath = path.join(staticFolder,thumbFolder,`${hash}.webp`)
						const destinationPathAlt = path.join(staticFolder,thumbFolder,`${hash}.${fileType}`)
						if(!fs.existsSync(destinationPath) && !fs.existsSync(destinationPathAlt)){
							console.log(`generating optimized ${size}px thumbnail. `+mediaItem.baseName);
							// await new Promise(async (res)=>{
								const baseImage = still?sharpStillImageBase:sharpImageBase;
								const sharpImage = baseImage.clone()
								let { pages } = imageMeta;
								if(!pages) pages = 1;
								// const thumbPages = still?1:pages;
								if(still) pages = 1;
								const resized = sharpImage.resize({
									width: size,
									height: size * pages,
									fit: sharp.fit.inside
								})
								const qualityStep = thumb?.qualityStep || 3;
								const minQuality = thumb?.minQuality || quality;
								const maxFileSize = thumb?.maxFileSize || Infinity;
								let crunches = 0;
								let qualityStepFactor = 1;
								let fileData;
								for(let q = quality; q>=minQuality; q-=qualityStep*qualityStepFactor){
									qualityStepFactor = 1;
									crunches++;
									if(minQuality!==quality) console.log(`try to crunch ${size}px thumbnail below ${maxFileSize} using quality ${q}`);

									const crunch = resized.clone();						
									await crunch.webp({
										quality: q,
										minSize: true,
										mixed: true,
										// effort: 5,
									}).toFile(destinationPath)
									fileData = fs.statSync(destinationPath);
									if(fileData.size < maxFileSize*1024*1024) break;
									if(crunches===1 && fileData.size > 2*maxFileSize*1024*1024) { //if first try is too big, try to reduce quality faster
										qualityStepFactor = 2;
									}
								}
								mediaItem.thumbs[thumbFolder].size = fileData.size;
							// 	res(true);
							// });
							console.log(`thumbnail generated for ${mediaItem.baseName}: ${thumbFolder} `);
						}else{
							let currentPath = fs.existsSync(destinationPath)?destinationPath:destinationPathAlt;
							const fileData = fs.statSync(currentPath);
							mediaItem.thumbs[thumbFolder].size = fileData.size;
						}
						res(true);
					});
				});
			}
			thumbTasks.push( ()=>{
				return new Promise(async (res)=>{
					const destinationPath = path.join(staticFolder,`full`,`${hash}.webp`)
					const destinationPathAlt = path.join(staticFolder,`full`,`${hash}.${fileType}`)
					if(!fs.existsSync(destinationPath) && !fs.existsSync(destinationPathAlt)){
						console.log('generating optimized full. '+mediaItem.baseName);
						await new Promise(async (res)=>{
							const sharpImage = sharpImageBase.clone()
							sharpImage.webp({ lossless: true }).toFile(destinationPath).then(()=>{
								const ogFileData = fs.statSync(mediaFullPath);
								const webpFileData = fs.statSync(destinationPath);
								if(webpFileData.size > ogFileData.size){
									fs.unlinkSync(destinationPath)
									fs.copyFileSync(mediaFullPath,destinationPathAlt)
								}
								res(true);
							})
						});
						console.log(`thumbnail generated for ${mediaItem.baseName}: full `);
					}else{
						let currentPath = fs.existsSync(destinationPath)?destinationPath:destinationPathAlt;
						const fileData = fs.statSync(currentPath);
						mediaItem.thumbs['full'].size = fileData.size;
					}
					if(fs.existsSync(destinationPath)){
						mediaItem.fullExt = "webp"
					}else if(fs.existsSync(destinationPathAlt)){
						mediaItem.fullExt = fileType
					}
					res(true);
				})
			})

			await Promise.all(thumbTasks.map(task => limit(task)));
	}

	return mediaItem;
}

const buildSiteData = async function () {
	console.log('Building Site Data');
	// console.log("~~~~~~~~~~~~~~~~~~~~~~~~~");
	
	let siteData:any = {};
	try {
		siteData = await readProjects(workPath);
	} catch (error) {
		console.error('Error reading projects',error);
		console.log('FAILED rebuilding site data')
		return;
	}

	// Write the projects array to a JavaScript file
	const outputPath = path.join(__dirname, 'data/siteData.js');
	const outputPathLib = path.join(__dirname, 'src/lib/siteData.js');
	const outputContent = `
		export default ${JSON.stringify(siteData, null, 2)};
	`;
	// export default ${JSON.stringify({config:siteConfig, projects, years, keywords}, null, 2)};
			


	fs.writeFileSync(outputPath, outputContent, 'utf8');
	fs.writeFileSync(outputPathLib, outputContent, 'utf8');

	console.log(`Rebuilt ${siteData.projects.length} projects`)
	console.log('Done rebuilding site data')
	console.log("\n")
}



function slugify(str:string) {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // remove non-word, non-whitespace, non-hyphen characters
		.replace(/[\s_-]+/g, '-') // replace spaces, underscores, and hyphens with a single hyphen
		.replace(/^-+/, '') // trim leading hyphens
		.replace(/-+$/, ''); // trim trailing hyphens
}

export default buildSiteData;