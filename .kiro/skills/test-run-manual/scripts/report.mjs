#!/usr/bin/env node
// Progress + report helper for the test-run-manual skill.
//
//   node report.mjs progress <runDir>   print a one-line progress bar from <runDir>/results.json
//   node report.mjs build <runDir>      write report.md, report.html and junit.xml into <runDir>
//
// results.json shape (written and updated by Claude during the run):
// {
//   "testCase": { "id": "MIG-123", "title": "...", "source": "jira|file|chat", "sourceRef": "...",
//                 "url": "https://...", "preconditions": "...", "testData": { "Age": "30" } },
//   "startedAt": "ISO", "finishedAt": "ISO | null", "browser": "chromium", "tester": "name",
//   "steps": [ { "n": 1, "action": "...", "expected": "...", "data": "...",
//                "status": "pending|running|passed|failed|blocked|skipped",
//                "actual": "...", "notes": "...", "userHelp": "...",
//                "screenshot": "screenshots/step-01.png", "durationMs": 1234 } ]
// }

import fs from 'node:fs';
import path from 'node:path';

const [cmd, runDir] = process.argv.slice(2);
if (!cmd || !runDir) {
    console.error('usage: report.mjs <progress|build> <runDir>');
    process.exit(2);
}
const run = JSON.parse(fs.readFileSync(path.join(runDir, 'results.json'), 'utf8'));
const steps = run.steps ?? [];
const done = steps.filter(s => !['pending', 'running'].includes(s.status));
const count = st => steps.filter(s => s.status === st).length;
const pct = steps.length ? Math.round((done.length / steps.length) * 100) : 0;
const ICON = { passed: '✅', failed: '❌', blocked: '⛔', skipped: '⏭️', running: '▶️', pending: '⬜' };

function verdict() {
    if (count('failed')) return 'FAILED';
    if (count('blocked')) return 'BLOCKED';
    if (done.length < steps.length) return 'INCOMPLETE';
    return 'PASSED';
}

if (cmd === 'progress') {
    const width = 20;
    const filled = Math.round((pct / 100) * width);
    const current = steps.find(s => s.status === 'running') ?? steps.find(s => s.status === 'pending');
    console.log(
        `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}] ${pct}%  ${done.length}/${steps.length} steps` +
        `  ✅ ${count('passed')}  ❌ ${count('failed')}  ⛔ ${count('blocked')}  ⏭️ ${count('skipped')}` +
        (current ? `\nNext: step ${current.n} — ${current.action}` : ''),
    );
    process.exit(0);
}

if (cmd !== 'build') {
    console.error(`unknown command: ${cmd}`);
    process.exit(2);
}

const tc = run.testCase ?? {};
const started = run.startedAt ? new Date(run.startedAt) : null;
const finished = run.finishedAt ? new Date(run.finishedAt) : new Date();
const totalSec = started ? Math.round((finished - started) / 1000) : 0;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');

// ---- Markdown ----
const md = [
    `# Test run: ${tc.id ? `${tc.id} — ` : ''}${tc.title ?? 'Untitled test case'}`,
    '',
    `**Result: ${verdict()}** — ${count('passed')} passed, ${count('failed')} failed, ${count('blocked')} blocked, ${count('skipped')} skipped of ${steps.length} steps (${pct}% executed)`,
    '',
    `- Source: ${tc.source ?? '-'} ${tc.sourceRef ? `(${tc.sourceRef})` : ''}`,
    `- URL: ${tc.url ?? '-'}`,
    `- Started: ${run.startedAt ?? '-'} · Duration: ${totalSec}s · Browser: ${run.browser ?? 'chromium'}${run.tester ? ` · Tester: ${run.tester}` : ''}`,
    tc.preconditions ? `- Preconditions: ${tc.preconditions}` : null,
    tc.testData && Object.keys(tc.testData).length
        ? `- Test data: ${Object.entries(tc.testData).map(([k, v]) => `${k}=${v}`).join(', ')}`
        : null,
    '',
    '| # | Status | Action | Expected | Actual | Notes |',
    '|---|---|---|---|---|---|',
    ...steps.map(s =>
        `| ${s.n} | ${ICON[s.status] ?? ''} ${s.status} | ${cell(s.action)}${s.data ? `<br>_data:_ ${cell(s.data)}` : ''} | ${cell(s.expected)} | ${cell(s.actual)} | ${cell([s.notes, s.userHelp && `user: ${s.userHelp}`].filter(Boolean).join(' · '))}${s.screenshot ? ` [screenshot](${s.screenshot})` : ''} |`,
    ),
    '',
].filter(l => l !== null).join('\n');
fs.writeFileSync(path.join(runDir, 'report.md'), md);

// ---- HTML (self-contained, screenshots referenced relatively) ----
const color = { passed: '#1a7f37', failed: '#cf222e', blocked: '#9a6700', skipped: '#57606a', pending: '#57606a', running: '#0969da' };
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tc.id ?? 'Test run')} report</title>
<style>
body{font:14px/1.45 system-ui,sans-serif;margin:24px;color:#1f2328;background:#fff}
h1{font-size:20px;margin:0 0 8px}.v{font-weight:700;padding:2px 8px;border-radius:4px;color:#fff}
.bar{height:10px;background:#eaeef2;border-radius:5px;overflow:hidden;display:flex;margin:12px 0;max-width:600px}
.bar span{display:block;height:100%}table{border-collapse:collapse;width:100%;margin-top:16px}
th,td{border:1px solid #d0d7de;padding:6px 8px;vertical-align:top;text-align:start}th{background:#f6f8fa}
td.s{font-weight:600;white-space:nowrap}img{max-width:320px;border:1px solid #d0d7de;display:block;margin-top:4px}
.meta{color:#57606a}
</style></head><body>
<h1>${esc(tc.id ? `${tc.id} — ` : '')}${esc(tc.title ?? 'Untitled test case')}</h1>
<span class="v" style="background:${color[verdict().toLowerCase()] ?? '#57606a'}">${verdict()}</span>
<div class="bar">${['passed', 'failed', 'blocked', 'skipped'].map(st => `<span style="width:${steps.length ? (count(st) / steps.length) * 100 : 0}%;background:${color[st]}"></span>`).join('')}</div>
<div class="meta">${count('passed')} passed · ${count('failed')} failed · ${count('blocked')} blocked · ${count('skipped')} skipped · ${steps.length} steps · ${totalSec}s<br>
Source: ${esc(tc.source)} ${esc(tc.sourceRef)} · URL: ${esc(tc.url)} · Started: ${esc(run.startedAt)}</div>
<table><thead><tr><th>#</th><th>Status</th><th>Action</th><th>Expected</th><th>Actual</th><th>Notes</th></tr></thead><tbody>
${steps.map(s => `<tr><td>${s.n}</td><td class="s" style="color:${color[s.status] ?? '#000'}">${s.status}</td><td>${esc(s.action)}${s.data ? `<br><i>data:</i> ${esc(s.data)}` : ''}</td><td>${esc(s.expected)}</td><td>${esc(s.actual)}</td><td>${esc(s.notes)}${s.userHelp ? `<br><i>user:</i> ${esc(s.userHelp)}` : ''}${s.screenshot ? `<a href="${esc(s.screenshot)}"><img src="${esc(s.screenshot)}" alt="step ${s.n}"></a>` : ''}</td></tr>`).join('\n')}
</tbody></table></body></html>`;
fs.writeFileSync(path.join(runDir, 'report.html'), html);

// ---- JUnit XML: one testsuite = the test case, one testcase = each step ----
const suiteName = `${tc.id ? `${tc.id} ` : ''}${tc.title ?? 'Manual test case'}`;
const junit = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="${esc(suiteName)}" tests="${steps.length}" failures="${count('failed')}" errors="${count('blocked')}" skipped="${count('skipped') + count('pending')}" time="${totalSec}">
  <testsuite name="${esc(suiteName)}" tests="${steps.length}" failures="${count('failed')}" errors="${count('blocked')}" skipped="${count('skipped') + count('pending')}" time="${totalSec}" timestamp="${esc(run.startedAt ?? '')}">
${steps.map(s => {
    const name = `Step ${s.n}: ${s.action}`;
    const t = ((s.durationMs ?? 0) / 1000).toFixed(3);
    const body =
        s.status === 'failed' ? `<failure message="${esc(s.actual)}">Expected: ${esc(s.expected)}\nActual: ${esc(s.actual)}\n${esc(s.notes)}</failure>`
        : s.status === 'blocked' ? `<error message="${esc(s.notes || 'blocked')}">${esc(s.actual)}</error>`
        : ['skipped', 'pending', 'running'].includes(s.status) ? `<skipped message="${esc(s.notes || s.status)}"/>`
        : '';
    const out = s.screenshot ? `<system-out>[[ATTACHMENT|${esc(path.resolve(runDir, s.screenshot))}]]</system-out>` : '';
    return `    <testcase classname="${esc(suiteName)}" name="${esc(name)}" time="${t}">${body}${out}</testcase>`;
}).join('\n')}
  </testsuite>
</testsuites>
`;
fs.writeFileSync(path.join(runDir, 'junit.xml'), junit);

console.log(`${verdict()} — wrote ${['report.md', 'report.html', 'junit.xml'].map(f => path.join(runDir, f)).join(', ')}`);
