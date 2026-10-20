import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
const result=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','vite.static.config.ts'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
try{await fs.access('.openai/hosting.json');await fs.mkdir('dist/.openai',{recursive:true});await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.writeFile('dist/.nojekyll','');
