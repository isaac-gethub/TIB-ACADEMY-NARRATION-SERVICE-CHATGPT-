// Static-only Vercel build. Never call paid narration APIs during deployment.
const fs=require('fs'),path=require('path');
const output=path.join(__dirname,'..','public');
fs.mkdirSync(output,{recursive:true});
const root=path.join(__dirname,'..');
let count=0;
for(const file of fs.readdirSync(root)){
 if(/^lab\d{2}(?:-interactive)?\.html$/.test(file)||file==='index.html'||file==='trainee-skills-career-report.html'){
  fs.copyFileSync(path.join(root,file),path.join(output,file));count++;
 }
}
const audioSource=path.join(root,'audio');
if(fs.existsSync(audioSource)){
 const dest=path.join(output,'audio');fs.mkdirSync(dest,{recursive:true});
 for(const file of fs.readdirSync(audioSource)){
  if(/^lab\d{2}-section-[1-5]\.mp3$/.test(file)){
   fs.copyFileSync(path.join(audioSource,file),path.join(dest,file));
   // Preserve the original interactive lab players' root-relative MP3 URLs.
   // Keep /audio/ copies for narrated lesson pages; do not regenerate audio.
   fs.copyFileSync(path.join(audioSource,file),path.join(output,file));count+=2;
  }
 }
}
console.log('Static build complete:',count,'files. No narration APIs invoked.');
