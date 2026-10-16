// Exercise the built background worker with interleaved writes from independent callers.
import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const listeners = [];
let data = {};
const tick = () => new Promise((resolve) => setTimeout(resolve, 2));
const context = vm.createContext({
  chrome: {
    runtime: { onMessage: { addListener: (fn) => listeners.push(fn) }, onInstalled: { addListener() {} } },
    storage: { local: {
      async get(key) { await tick(); return structuredClone({ [key]: data[key] }); },
      async set(value) { await tick(); Object.assign(data, structuredClone(value)); },
      async remove(key) { await tick(); delete data[key]; },
    } },
  },
});
vm.runInContext(await fs.readFile(new URL('../dist/background.js', import.meta.url), 'utf8'), context);
const ask = (msg) => new Promise((resolve) => { for (const fn of listeners) if (fn(msg, {}, resolve)) break; });
await Promise.all(Array.from({ length: 60 }, (_, i) => ask({ type: 'record-event', entry: { at: i, event: 'pr.merged', shown: true } })));
assert.equal(data['footlit:stats'].shows, 60);
assert.equal(data['footlit:stats'].log.length, 40);
const operations = [ask({ type: 'record-event', entry: { at: 61, event: 'ci.passed', shown: true } }), ask({ type: 'clear-stats' }), ask({ type: 'record-event', entry: { at: 62, event: 'pr.closed', shown: false } })];
await Promise.all(operations);
assert.equal(data['footlit:stats'].shows, 0);
assert.equal(data['footlit:stats'].log.length, 1);
assert.equal(data['footlit:stats'].log[0].at, 62);
console.log('PASS 60 concurrent writes, bounded log, and clear/write ordering');
