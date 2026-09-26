#!/usr/bin/env node
/** Public-surface security + rendering contract: not a broad Markdown sanitizer. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function check({ snapshot, readme, files }) {
 const errors=[];
 if(snapshot?.schema_version!=='edi.public-profile-dashboard.v1'||snapshot?.privacy?.public_safe_aggregate_only!==true||snapshot?.privacy?.runtime_api_calls_on_profile_load!==0)errors.push('snapshot privacy/schema invalid');
 const p=snapshot?.portfolio;
 if(!Number.isInteger(p?.indexed)||!Number.isInteger(p?.total)||p?.total<=0||p.indexed<0||p.indexed>p.total)errors.push('invalid portfolio denominator');
 for(const x of snapshot?.lanes||[])if(!Number.isInteger(x.done)||!Number.isInteger(x.total)||x.total<=0||x.done<0||x.done>x.total)errors.push('invalid lane denominator');
 if(!readme.includes(snapshot?.observed_at||'impossible-snapshot'))errors.push('dated evidence missing');
 if(!readme.includes(`${p?.indexed}/${p?.total}`))errors.push('inventory projection mismatch');
 if(!readme.includes('0 third-party badges'))errors.push('static policy missing');
 // Avoid accidentally linking private source repos. Visible public prose is reviewed separately.
 const img=readme.match(/<img\b[^>]*>/gi)||[],src=readme.match(/<source\b[^>]*>/gi)||[];
 if(img.length!==1||src.length!==1 || !/\bsrc="assets\/hero-light\.svg"/.test(img[0]||'') || !/\bsrcset="assets\/hero-dark\.svg"/.test(src[0]||''))errors.push('unexpected picture contract');
 const redFlags=[/https?:\/\//i,/<script\b/i,/javascript:/i,/data:/i,/on[a-z]+\s*=/i,/!\[[^\]]*\]\(/,/<iframe\b/i,/shields\.io/i,/api\.github\.com/i,/github-readme-stats/i,/wpdevweb\//i];
 for(const re of redFlags)if(re.test(readme))errors.push(`public remote or privacy constraint: ${re}`);
 for(const name of ['assets/hero-dark.svg','assets/hero-light.svg']){
  const raw=files[name];if(!raw||raw.length>16000){errors.push('asset absent or exceeds budget: '+name);continue;}
  if(!/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(raw))errors.push('invalid SVG root: '+name);
  if(!/<title\s/.test(raw)||!/<desc\s/.test(raw))errors.push('missing accessible SVG metadata: '+name);
  const forbidden=/<(?:script|foreignObject|image|animate|set|iframe)\b|\b(?:href|xlink:href|onload|onclick|onerror)\s*=|javascript:|data:|https?:\/\/(?!www\.w3\.org\/2000\/svg)|url\(\s*[\'\"]?\/\/|@import/i;
  // SVG namespace declaration is the single allowed URL.
  if(forbidden.test(raw))errors.push('SVG executable or remote payload: '+name);
 }
 return errors;
}
if(process.argv[1] && path.resolve(fileURLToPath(import.meta.url))===path.resolve(process.argv[1])){
 const snapshot=JSON.parse(fs.readFileSync(path.join(root,'dashboard.snapshot.json'),'utf8'));
 const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
 const files=Object.fromEntries(['assets/hero-dark.svg','assets/hero-light.svg'].map(n=>[n,fs.existsSync(path.join(root,n))?fs.readFileSync(path.join(root,n),'utf8'):null]));
 const errors=check({snapshot,readme,files});if(errors.length){console.error(JSON.stringify({ok:false,errors},null,2));process.exitCode=1;}else console.log(JSON.stringify({ok:true,snapshot:snapshot.schema_version,lanes:snapshot.lanes.length,static_only:true,external_requests:0},null,2));
}