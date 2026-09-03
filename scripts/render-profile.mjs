#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'dashboard.snapshot.json'),'utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const pct=(done,total)=>total>0?Math.round(done*100/total):null;
const bar=(done,total,width=10)=>{const p=pct(done,total);if(p==null)return '░'.repeat(width)+' ?';const n=Math.round(width*p/100);return '█'.repeat(n)+'░'.repeat(width-n)+` ${p}%`;};
const gate=l=>`${l.done}/${l.total}`;
const laneRows=snapshot.lanes.map(l=>`<tr><td><b>${esc(l.name)}</b><br><sub>${esc(l.detail)}</sub></td><td><code>${bar(l.done,l.total)}</code><br><sub>${gate(l)} gates · ${esc(l.status)}</sub></td></tr>`).join('\n');
const domainCells=snapshot.domains.map(d=>`<td width="25%" valign="top"><b>${esc(d.name)}</b><br><sub>${esc(d.summary)}</sub></td>`);
const domainRows=[];for(let i=0;i<domainCells.length;i+=4)domainRows.push(`<tr>${domainCells.slice(i,i+4).join('')}</tr>`);
const readme=`<div align="center">

# EDI Engineering Portfolio
### Solution Architecture · AI Systems · Full-Stack · DevSecOps

<code>local-first</code> · <code>contract-first</code> · <code>evidence-first</code> · <code>security-first</code>

</div>

---

## Portfolio telemetry

<table>
<tr>
<td width="25%" align="center"><b>Repository inventory</b><br><code>${snapshot.portfolio.indexed}/${snapshot.portfolio.total}</code><br><sub>${bar(snapshot.portfolio.indexed,snapshot.portfolio.total)}</sub></td>
<td width="25%" align="center"><b>Observation</b><br><code>${esc(snapshot.portfolio.coverage_status)}</code><br><sub>${esc(snapshot.portfolio.coverage_note)}</sub></td>
<td width="25%" align="center"><b>Active engineering model</b><br><code>${esc(snapshot.engineering_model)}</code><br><sub>ownership + contracts + evidence</sub></td>
<td width="25%" align="center"><b>Snapshot</b><br><code>${esc(snapshot.observed_date)}</code><br><sub>static · public-safe · zero-request</sub></td>
</tr>
</table>

> Inventory coverage is **not** product completion. Per-repository readiness is evidence-gated and private; unknown percentages are intentionally not invented.

---

## Maturity lanes

<table>
<tr><th width="55%">Lane</th><th width="45%">Gate progress</th></tr>
${laneRows}
</table>

---

## System map

<table>
${domainRows.join('\n')}
</table>

---

## Engineering loop

<pre>
intent → context → contracts → implementation → tests
       → evidence → merge → handoff → learning → next

reuse → adapter → morph → rewrite
facts ≠ inference · capability ≠ authority · progress ≠ readiness
</pre>

## Public dashboard semantics

- README rendering performs **0 runtime API calls** from this repository.
- No third-party badges, dynamic images, scripts or analytics are loaded.
- Private repository names and private task topology are redacted from this public projection.
- Percent bars are derived only from explicit gate denominators in <code>dashboard.snapshot.json</code>.
- Detailed per-repository state belongs to the private portfolio/control-plane layer, not this public README.

<details>
<summary><b>Stack & operating principles</b></summary>

<br>

<code>TypeScript</code> · <code>Node.js</code> · <code>React/Next.js</code> · <code>Rust/Tauri</code> · <code>PHP/WordPress</code> · <code>Python</code> · <code>Docker</code> · <code>GitHub Actions</code>

Local-first · schema-first · contract-first · security-first · observability-first · evidence-first · reversible-by-default.

</details>

---

<div align="center"><sub>Generated from a committed public-safe snapshot · observed ${esc(snapshot.observed_at)} · no live API dependency on profile load</sub></div>
`;
fs.writeFileSync(path.join(root,'README.md'),readme);
console.log(JSON.stringify({ok:true,output:'README.md',snapshot:snapshot.schema_version,observed_at:snapshot.observed_at},null,2));
