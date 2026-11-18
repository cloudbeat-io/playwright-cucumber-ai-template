#!/usr/bin/env node
// Saves the CloudBeat API URL to the CloudBeat CLI config (~/.cloudbeat/config.json, or $CB_CONFIG_DIR),
// so a following `npx cloudbeat-cli login` uses it and only asks for the API key.
//
//   node scripts/cloudbeat-set-url.mjs <apiUrl>      e.g. https://cloudbeat.example.local:8080
//   node scripts/cloudbeat-set-url.mjs default       https://api.cloudbeat.io (CloudBeat cloud)
//   node scripts/cloudbeat-set-url.mjs --show        current settings, without changing anything
//
// Prints one JSON document: { ok, apiBaseUrl, configPath, apiKeyRemoved, reachable, reachError }, or for
// --show: { ok, apiBaseUrl, isDefault, hasApiKey, envApiUrl, configPath }.
// A stored API key is kept only when the URL doesn't change (a key belongs to one CloudBeat instance).
// Never prints the API key — agents use this instead of reading the config file, which contains it.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_API_BASE_URL = 'https://api.cloudbeat.io';

const fail = (error) => {
    console.log(JSON.stringify({ ok: false, error }, null, 2));
    process.exit(1);
};

const arg = process.argv[2];
if (!arg) {
    fail('usage: cloudbeat-set-url.mjs <apiUrl|default|--show>');
}

// Same location and file format as the CloudBeat CLI (lib/config.js).
const configDir = process.env.CB_CONFIG_DIR || path.join(os.homedir(), '.cloudbeat');
const configPath = path.join(configDir, 'config.json');

let config = {};
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch {
    config = {};
}

if (arg === '--show') {
    const storedUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;
    console.log(JSON.stringify({
        ok: true,
        apiBaseUrl: storedUrl,
        isDefault: storedUrl.replace(/\/+$/, '') === DEFAULT_API_BASE_URL,
        hasApiKey: Boolean(config.apiKey),
        envApiUrl: process.env.CB_API_URL || null,
        configPath,
    }, null, 2));
    process.exit(0);
}

let apiBaseUrl = arg === 'default' ? DEFAULT_API_BASE_URL : arg.trim();
let parsed;
try {
    parsed = new URL(apiBaseUrl);
} catch {
    fail(`Not a valid URL: "${apiBaseUrl}". Use the full address, e.g. https://cloudbeat.example.local:8080`);
}
if (!['http:', 'https:'].includes(parsed.protocol)) {
    fail(`The URL must start with http:// or https:// (got "${apiBaseUrl}").`);
}
apiBaseUrl = apiBaseUrl.replace(/\/+$/, '');

const previousUrl = (config.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
const apiKeyRemoved = Boolean(config.apiKey) && previousUrl !== apiBaseUrl;
if (apiKeyRemoved) {
    delete config.apiKey;
}
config.apiBaseUrl = apiBaseUrl;

fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
fs.writeFileSync(configPath, `${JSON.stringify(config, undefined, 4)}\n`, { mode: 0o600 });
fs.chmodSync(configPath, 0o600);

// Reachability check only: any HTTP answer means the server can be reached from this machine.
let reachable = false;
let reachError;
try {
    await fetch(apiBaseUrl, { method: 'GET', signal: AbortSignal.timeout(10000) });
    reachable = true;
} catch (e) {
    const cause = e?.cause;
    reachError = cause?.code ? `${cause.code}${cause.message ? `: ${cause.message}` : ''}` : (e?.name === 'TimeoutError' ? 'timed out after 10s' : String(e?.message ?? e));
}

console.log(JSON.stringify({ ok: true, apiBaseUrl, configPath, apiKeyRemoved, reachable, ...(reachError ? { reachError } : {}) }, null, 2));
