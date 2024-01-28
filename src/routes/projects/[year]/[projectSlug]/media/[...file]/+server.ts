import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import path from 'path'
import fs from 'fs'
import mime from 'mime-types'
import CRC32C from 'crc-32'
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url); 
// const __dirname = path.dirname(__filename);

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {

	const fileName = url.pathname.split('/').pop() || ''
	const fileExt = fileName.split('.').pop()||'';
	const baseName = fileName.split('.').slice(0, -1).join('.')

    let filePath = path.join(process.cwd(), 'work', url.pathname.replace('/projects', ''));

	if(url.pathname.includes('/thumb288/')){
		const hash = CRC32C.str(baseName,0)
		filePath = path.join(process.cwd(), 'static', 'thumb288', `${hash}.${fileExt}`);
	}else
	if(url.pathname.includes('/thumb512/')){
		const hash = CRC32C.str(baseName,0)
		filePath = path.join(process.cwd(), 'static', 'thumb512', `${hash}.${fileExt}`);
	}else
	if(url.pathname.includes('/full/')){
		const hash = CRC32C.str(baseName,0)
		filePath = path.join(process.cwd(), 'static', 'full', `${hash}.${fileExt}`);
	}

	// console.log(baseName);

	if(!fs.existsSync(filePath)){
		error(404, 'media not found: '+ filePath);
	}
    var fileBuffer = fs.readFileSync(filePath)

    console.log(`internal path ${filePath}`);

    console.log('url', url)

	const contentType = mime.lookup(fileExt);
    const fileData = fs.statSync(filePath);
	console.log('fileData',fileData);
    // const videoSize = fileData.size
	
    // create and set response headers
    const options = {
			headers : {
			// "Content-Range": `bytes ${start}-${end}/${videoSize}`,
			// "Accept-Ranges": "bytes",
			"Content-Length": String(fileData.size),
			"Content-Type": String(contentType),
		}
    }

	// return new Response(String(1));
	return new Response(fileBuffer, options); //https://developer.mozilla.org/en-US/docs/Web/API/Response/Response
}