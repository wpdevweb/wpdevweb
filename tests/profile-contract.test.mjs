import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check } from '../scripts/check-profile.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const s=JSON.parse(fs.readFileSync(path.join(root,'dashboard.snapshot.json'),'utf8'));
const m=fs.readFileSync(path.join(root,'README.md'),'utf8');
const files=Object.fromEntries(['assets/hero-dark.svg','assets/hero-light.svg'].map(n=>[n,fs.readFileSync(path.join(root,n),'utf8')]));
const run=(o={})=>check({snapshot:o.snapshot??s,readme:o.readme??m,files:o.files??files});
test('positive public, local-only accessible profile contract',()=>assert.deepEqual(run(),[]));
test('deny inventory overclaim',()=>assert.ok(run({snapshot:{...s,portfolio:{...s.portfolio,indexed:315}}}).length));
test('deny gate numerator overclaim',()=>assert.ok(run({snapshot:{...s,lanes:s.lanes.map((x,i)=>i?x:{...x,done:2})}}).length));
test('deny missing timestamp',()=>assert.ok(run({readme:m.replaceAll(s.observed_at,'missing-time')}).length));
test('deny remote markdown badge',()=>assert.ok(run({readme:m+'\n![bad](https://img.shields.io/x.svg)'}).length));
test('deny remote HTML image',()=>assert.ok(run({readme:m.replace('assets/hero-light.svg','https://example.invalid/banner.svg')}).length));
test('deny inline script',()=>assert.ok(run({readme:m+'<script>alert(1)</script>'}).length));
test('deny private repository paths',()=>assert.ok(run({readme:m+'See wpdevweb/hidden-private-repo'}).length));
test('deny javascript link',()=>assert.ok(run({readme:m+'<a href="javascript:alert(1)">bad</a>'}).length));
test('deny embedded data URI',()=>assert.ok(run({readme:m+'<img src="data:image/svg+xml;base64,bad">'}).length));
test('deny SVG external href',()=>assert.ok(run({files:{...files,'assets/hero-dark.svg':files['assets/hero-dark.svg'].replace('</svg>','<a href="https://example.invalid"/></svg>')}}).length));
test('deny SVG scripts even in otherwise static files',()=>assert.ok(run({files:{...files,'assets/hero-light.svg':files['assets/hero-light.svg'].replace('</svg>','<script>hi()</script></svg>')}}).length));
test('deny SVG missing accessibility title',()=>assert.ok(run({files:{...files,'assets/hero-light.svg':files['assets/hero-light.svg'].replace(/<title[^>]*>.*?<\/title>/,'')}}).length));
test('deny missing dark image',()=>assert.ok(run({files:{...files,'assets/hero-dark.svg':null}}).length));
test('snapshot must declare zero request and public-safe',()=>assert.ok(run({snapshot:{...s,privacy:{...s.privacy,runtime_api_calls_on_profile_load:1}}}).length));
// The rendered README may not be silently hand-edited around the committed snapshot.
import os from 'node:os';
import { spawnSync } from 'node:child_process';
test('negative generator drift fails closed and clean baseline succeeds',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'profile-render-'));
 try{
  fs.mkdirSync(path.join(tmp,'scripts'),{recursive:true});fs.mkdirSync(path.join(tmp,'assets'),{recursive:true});
  fs.copyFileSync(path.join(root,'scripts/render-profile.mjs'),path.join(tmp,'scripts/render-profile.mjs'));
  fs.copyFileSync(path.join(root,'dashboard.snapshot.json'),path.join(tmp,'dashboard.snapshot.json'));
  fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
  const first=spawnSync(process.execPath,['scripts/render-profile.mjs'],{cwd:tmp,encoding:'utf8'});assert.equal(first.status,0,first.stderr);
  let ok=spawnSync(process.execPath,['scripts/render-profile.mjs','--check'],{cwd:tmp,encoding:'utf8'});assert.equal(ok.status,0,ok.stderr);
  fs.appendFileSync(path.join(tmp,'README.md'),'\nFalse capability claim\n');
  ok=spawnSync(process.execPath,['scripts/render-profile.mjs','--check'],{cwd:tmp,encoding:'utf8'});assert.equal(ok.status,1);
  assert.match(ok.stderr,/generated_drift/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
