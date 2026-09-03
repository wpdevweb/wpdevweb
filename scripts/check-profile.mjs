#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'dashboard.snapshot.json'),'utf8'));
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
const errors=[];
if(snapshot.schema_version!=='edi.public-profile-dashboard.v1')errors.push('snapshot schema mismatch');
if(!Number.isInteger(snapshot.portfolio?.indexed)||!Number.isInteger(snapshot.portfolio?.total)||snapshot.portfolio.indexed<0||snapshot.portfolio.indexed>snapshot.portfolio.total)errors.push('invalid portfolio coverage');
for(const lane of snapshot.lanes??[])if(!Number.isInteger(lane.done)||!Number.isInteger(lane.total)||lane.total<=0||lane.done<0||lane.done>lane.total)errors.push(`invalid lane: ${lane.id}`);
const forbidden=[/https?:\/\//i,/<img\b/i,/!\[[^\]]*\]\(/,/<script\b/i,/shields\.io/i,/github-readme-stats/i,/api\.github\.com/i,/vercel\.app/i];
for(const rule of forbidden)if(rule.test(readme))errors.push(`remote/dynamic surface forbidden: ${rule}`);
if(!readme.includes(`${snapshot.portfolio.indexed}/${snapshot.portfolio.total}`))errors.push('README inventory does not match snapshot');
if(!readme.includes(snapshot.observed_at))errors.push('README timestamp does not match snapshot');
if(!readme.includes('0 runtime API calls'))errors.push('zero-request contract missing from README');
if(errors.length){console.error(JSON.stringify({ok:false,errors},null,2));process.exitCode=1;}else console.log(JSON.stringify({ok:true,snapshot:snapshot.schema_version,lanes:snapshot.lanes.length,remote_requests:0},null,2));
