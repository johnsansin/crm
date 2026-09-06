const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const esbuild = require('esbuild');
(async()=>{
 const result=await esbuild.build({
  stdin:{contents:"import React from 'react'; import {createRoot} from 'react-dom/client'; import {SocialForceStudio} from './src/components/socialforce/SocialForceStudio'; createRoot(document.getElementById('root')).render(<SocialForceStudio demo />); document.addEventListener('click',e=>{const a=e.target.closest('a');if(a && a.getAttribute('href')?.startsWith('/')){e.preventDefault();window.scrollTo(0,0)}})",resolveDir:path.join(root, 'packages/frontend-next'),sourcefile:'demo.tsx',loader:'tsx'},
  alias:{react:path.join(root,'packages/frontend-next/node_modules/react'),'react-dom':path.join(root,'packages/frontend-next/node_modules/react-dom')},
  bundle:true,minify:true,write:false,outdir:'/tmp/socialforce-standalone',jsx:'automatic',platform:'browser',target:'es2022',define:{'process.env.NODE_ENV':'"production"'},
  plugins:[{name:'offline-demo-api',setup(build){build.onResolve({filter:/^@\/lib\/api$/},()=>({path:'offline-api',namespace:'offline'}));build.onLoad({filter:/.*/,namespace:'offline'},()=>({contents:"export const api={request:async()=>{throw new Error('Offline demonstration: CRM API is unavailable.')}}",loader:'js'}))}}]
 });
 const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script');
 const css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SocialForce AI — Offline Interactive Demo</title><style>body{margin:0}button,input,textarea,select{box-sizing:border-box}.sf-announcement>a,.sf-sidebar-bottom>a.sf-back{display:none}'+css+'</style></head><body><div id="root"></div><script>'+js+'</script></body></html>';
 fs.writeFileSync(path.join(root, 'docs/socialforce/demo.html'),html);
 console.log('Created standalone interactive demo:',Buffer.byteLength(html),'bytes, no external assets or API access.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
