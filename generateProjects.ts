import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import YAML from 'yaml'
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import mime from 'mime-types'
import webp from 'webp-converter'
import sharp from 'sharp'

import CRC32C from 'crc-32'

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

const workPath = path.join(__dirname, 'work');

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
					const projectData:any = {
						year,
						slug: entry.name,
						projectName,
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
					// console.log('Read about.md file');

					if(projectData?.keywords){
						projectData.keywords.forEach((tag) => {
							if(!keywords.includes(tag)){
								keywords.push(tag);
							}
						});
					}
					// console.log('Handled keywords');

					const projectInfo = {year: projectData.year, slug: projectData.slug, title: projectData.title}
					// Read media folder
					const mediaPath = path.join(projectPath, 'media');
					if (fs.existsSync(mediaPath)) {
						const mediasFiles = fs.readdirSync(mediaPath);
						for(let mediaFile of mediasFiles){
							if(mediaFile.startsWith('!')) continue;
							if(mediaFile.includes('!')) continue;
							if(!mediaFile.includes('.')) continue
							const mediaElement = await processMediaFile(mediaFile,mediaPath);
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
async function processMediaFile(mediaFile:string, mediaPath:string){
	const thumbnailSizes = [288,512];
	const fileName = mediaFile;
	const mediaItem:any = {
		fileName,
		baseName: fileName.split('.').slice(0, -1).join('.'),
	}
	const mediaFullPath = path.join(mediaPath,fileName);
	
	const relativeFolder = path.relative(path.join(__dirname,'work'),mediaPath)
	const staticFolder = path.join(__dirname,'static','projects',relativeFolder)

	// console.log({mediaFile,mediaPath,relativeFolder}); 
	// throw 'stop';

	const fileType:string = (fileName.split('.').pop() || "").toLowerCase()
	mediaItem.fileType = fileType;
	const mimeType = mime.lookup(fileType)
	if(!mimeType) return;
	// console.log('mimeType',mimeType)
	mediaItem.mimeType = mimeType;
	const mediaType = mimeType.split('/')[0]
	mediaItem.mediaType = mediaType;

	const hash = CRC32C.str(mediaItem.baseName,0)
	mediaItem.hash = hash;

	const setMediaSize = (mediaItem,width,height)=>{
		mediaItem.width = width??0;
		mediaItem.height = height??0;
		mediaItem.aspectRatio = mediaItem.width/mediaItem.height;
	}

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
				res(true)
			})
		});
	}
	else if(mediaType==="image"){
		const animated = fileType==="gif"
		let sharpOptions:any;
		if(animated) sharpOptions = { animated, pages: -1 };
		
		const sharpImageBase = sharp(mediaFullPath, sharpOptions) // supports animated gif and webp images
		const imageMeta = await sharpImageBase.metadata()
		// console.log('got metadata',imageMeta)
		const {width, height, pageHeight} = imageMeta;
		setMediaSize(mediaItem,width,pageHeight??height)
		
		let destinationPath, destinationPathAlt;


		if(!knownDirs.find(dir=>dir.indexOf(staticFolder)===0)){//not sure of exists
			if(fs.existsSync(path.join(staticFolder,'full'))){
			}else{
				fs.mkdirSync(path.join(staticFolder,'full'), { recursive: true });
				thumbnailSizes.forEach(size=>{
					fs.mkdirSync(path.join(staticFolder,`thumb${size}`), { recursive: true });
				})
			}
			knownDirs.push(staticFolder);
		}

		for(let size of thumbnailSizes){
			destinationPath = path.join(staticFolder,`thumb${size}`,`${hash}.webp`)
			destinationPathAlt = path.join(staticFolder,`thumb${size}`,`${hash}.${fileType}`)
			if(!fs.existsSync(destinationPath) && !fs.existsSync(destinationPathAlt)){
				console.log(`generating optimized ${size}px thumbnail. `+mediaItem.baseName);
				await new Promise(async (res)=>{
					const sharpImage = sharpImageBase.clone()
					let { pages } = imageMeta;
					if(!pages) pages = 1;
					const resized = sharpImage.resize({
						width: size,
						height: size * pages,
						fit: sharp.fit.inside
					})
					resized.webp({ quality: 69 }).toFile(destinationPath).then(()=>{
						res(true);
					})
				});
			}
		}
		destinationPath = path.join(staticFolder,`full`,`${hash}.webp`)
		destinationPathAlt = path.join(staticFolder,`full`,`${hash}.${fileType}`)
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
		}
		
		if(fs.existsSync(destinationPath)){
			mediaItem.fullExt = "webp"
		}else if(fs.existsSync(destinationPathAlt)){
			mediaItem.fullExt = fileType
		}
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
	const outputContent = `
		export default ${JSON.stringify(siteData, null, 2)};
	`;
	// export default ${JSON.stringify({config:siteConfig, projects, years, keywords}, null, 2)};
			


	fs.writeFileSync(outputPath, outputContent, 'utf8');

	console.log(`Rebuilt ${siteData.projects.length} projects`)
	console.log('Done rebuilding site data')
	console.log("\n")
}

export default buildSiteData;