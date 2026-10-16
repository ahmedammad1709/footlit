// Pins local media/browser binaries and keeps Hyperframes caches inside the workspace.
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const repo=path.resolve(import.meta.dirname,'../..');
const req=createRequire(path.join(repo,'video/linkedin-tools/package.json'));
const root=path.join(repo,'brag-output-2026-10-14-linkedin/composition');
const cache=path.join(repo,'video/.cache/chrome-headless-shell');
const ver=(await fs.readdir(cache)).find(x=>x.startsWith('win64-'));
const env={...process.env,HYPERFRAMES_BROWSER_PATH:path.join(cache,ver,'chrome-headless-shell-win64/chrome-headless-shell.exe'),HYPERFRAMES_FFMPEG_PATH:createRequire(import.meta.url)('ffmpeg-static'),HYPERFRAMES_FFPROBE_PATH:req('ffprobe-static').path,DO_NOT_TRACK:'1',HF_NO_BROWSER:'1'};
env.HYPERFRAMES_HISTORY_ROOT=path.join(repo,'video/.cache/hyperframes-history');
env.HYPERFRAMES_EXTRACT_CACHE_DIR=path.join(repo,'video/.cache/hyperframes-extract');
const p=spawn(process.execPath,[path.join(repo,'video/linkedin-tools/node_modules/hyperframes/bin/hyperframes.mjs'),...process.argv.slice(2)],{cwd:root,env,stdio:'inherit',windowsHide:true});
p.on('exit',c=>process.exitCode=c??1);
