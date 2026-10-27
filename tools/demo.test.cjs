const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function worker() {
  const data = {};
  let listener, removed;
  const chrome = {
    runtime: { id: 'test-extension', onMessage: { addListener(fn) { listener = fn; } } },
    tabs: { onRemoved: { addListener(fn) { removed = fn; } } },
    storage: { session: {
      async get(key) { return { [key]: data[key] }; },
      async set(values) { Object.assign(data, values); },
      async remove(key) { delete data[key]; },
    } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'demo-background.js'), 'utf8'), { chrome, URL });
  const sender = { id: chrome.runtime.id, tab: { id: 4 }, frameId: 0, url: 'https://www.instagram.com/' };
  function send(message, from = sender) {
    return new Promise((resolve) => {
      if (listener(message, from, resolve) !== true) resolve(undefined);
    });
  }
  return { send, sender, data, removed };
}

test('Demo is off by default, opt-in, isolated by tab, and can be disabled', async () => {
  const w = worker();
  assert.equal((await w.send({ type: 'demo:get' })).enabled, false);
  assert.equal((await w.send({ type: 'demo:set', enabled: true })).enabled, true);
  assert.equal((await w.send({ type: 'demo:get' }, { ...w.sender, tab: { id: 5 } })).enabled, false);
  assert.equal((await w.send({ type: 'demo:set', enabled: false })).enabled, false);
  assert.equal(Object.keys(w.data).length, 0);
});

test('Reject foreign origins, frames, extension IDs and malformed commands', async () => {
  const w = worker();
  for (const sender of [
    { ...w.sender, url: 'https://example.com/' },
    { ...w.sender, url: 'https://www.instagram.com.evil.test/' },
    { ...w.sender, frameId: 1 },
    { ...w.sender, id: 'other' },
  ]) assert.equal(await w.send({ type: 'demo:set', enabled: true }, sender), undefined);
  assert.equal(await w.send({ type: 'demo:set', enabled: 'true' }), undefined);
  assert.equal(await w.send({ type: 'unknown' }), undefined);
  assert.equal(Object.keys(w.data).length, 0);
});

test('Closing the demo tab clears its state', async () => {
  const w = worker();
  await w.send({ type: 'demo:set', enabled: true });
  w.removed(4);
  assert.equal((await w.send({ type: 'demo:get' })).enabled, false);
});

test('Normal effect code remains intact except timing switches and demo ASCII guard', () => {
  const original = fs.readFileSync(path.join(__dirname, '../.extension-preview/original-content.js'), 'utf8');
  const generated = fs.readFileSync(path.join(__dirname, '../.extension-preview/content.js'), 'utf8');
  const normalized = generated.replace(/const (\w+) = modoDemo \? [^:;]+ : ([^;]+);/g, 'const $1 = $2;')
    .replace('if (!modoDemo) iniciarConteoPublicaciones();', 'iniciarConteoPublicaciones();');
  assert.ok(normalized.includes(original));
});
