const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=process.cwd(),sweep=fs.existsSync('lab47-interactive.html');
if(sweep){const b=spawnSync(process.execPath,['scripts/build-static.js'],{stdio:'inherit'});if(b.status)process.exit(b.status)}
const out=path.join(root,'.vercel/output');fs.rmSync(out,{recursive:true,force:true});
const fn=path.join(out,'functions/course.func'),assets=path.join(fn,'assets');fs.mkdirSync(assets,{recursive:true});
function copy(dir,dest){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name),q=path.join(dest,e.name);if(e.isDirectory()&&(/^(Chapter_\d+|audio)$/.test(e.name))){fs.mkdirSync(q,{recursive:true});copy(p,q)}else if(e.isFile()&&/\.(html|pdf|docx|png|jpg|jpeg|mp3)$/i.test(e.name))fs.copyFileSync(p,q)}}
copy(sweep?path.join(root,'public'):root,assets);
fs.copyFileSync('server/course-handler.js',path.join(fn,'index.js'));
fs.copyFileSync('server/course-login.html',path.join(assets,'login.html'));
fs.writeFileSync(path.join(fn,'course-config.json'),JSON.stringify({course:sweep?'TIB-FULL-SWEEP':'TIB-SECURITY'}));
fs.writeFileSync(path.join(fn,'.vc-config.json'),JSON.stringify({runtime:'nodejs22.x',handler:'index.js',launcherType:'Nodejs',shouldAddHelpers:true,maxDuration:60}));
const routes=[];
if(sweep){for(const name of ['health','speech']){const dir=path.join(out,'functions/api/'+name+'.func');fs.mkdirSync(dir,{recursive:true});fs.copyFileSync('api/'+name+'.js',path.join(dir,'index.js'));fs.writeFileSync(path.join(dir,'.vc-config.json'),JSON.stringify({runtime:'nodejs22.x',handler:'index.js',launcherType:'Nodejs',shouldAddHelpers:true,maxDuration:60}));routes.push({src:'/api/'+name,dest:'/api/'+name})}}
routes.push({src:'/(.*)',dest:'/course?resource=$1'});
fs.writeFileSync(path.join(out,'config.json'),JSON.stringify({version:3,routes},null,2));
console.log('Secure build: course assets are function-private; no public static course output. No narration API called.');
