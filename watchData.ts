// import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import buildSiteData from './generateProjects';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
const folderPath = path.join(__dirname, 'work');

//check for "build" in command line args and run buildSiteData if found
const args = process.argv.slice(2);
if(args.includes('build')){

  buildSiteData();
  
}else{

  const watcher = chokidar.watch(folderPath, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
  });

  watcher
    .on('add', async (path) => {
      // console.log(`File ${path} has been added`);
      if(path.includes('!')) return;
      await executeCode(`File ${path} has been added`);
    })
    .on('change', async (path) => {
      // console.log(`File ${path} has been changed`);
      if(path.includes('!')) return;
      await executeCode(`File ${path} has been changed`);
    })
    .on('unlink', async (path) => {
      // console.log(`File ${path} has been removed`);
      if(path.includes('!')) return;
      await executeCode(`File ${path} has been removed`);
    });

  let dataBuild = setTimeout(()=>{},0);
  async function executeCode(reason) {
      clearTimeout(dataBuild)
      dataBuild = setTimeout(async ()=>{
          console.log('triggered rebuild because: '+ reason)
          await buildSiteData();  
      },250);
  }

  console.log(`Watching folder: ${folderPath}`);
}