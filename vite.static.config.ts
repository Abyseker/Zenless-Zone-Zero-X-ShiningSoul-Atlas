import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({root:'web',base:'./',publicDir:path.resolve('public'),plugins:[react()],css:{postcss:{plugins:[]}},server:{host:'127.0.0.1',fs:{allow:[process.cwd()]}},build:{outDir:path.resolve('dist'),emptyOutDir:true}});
