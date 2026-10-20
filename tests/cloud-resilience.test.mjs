import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('session restoration handles rejected requests and avoids updates after unmount', () => {
  assert.match(page, /supabase\.auth\.getUser\(\)[\s\S]*?\.catch\(\(\) =>/);
  assert.match(page, /if \(!active\) return;/);
  assert.match(page, /active = false; listener\.subscription\.unsubscribe\(\)/);
});

test('cloud timeline loading always clears its loading state', () => {
  const refresh = page.match(/async function refreshMessages[\s\S]*?
  }/);
  assert.ok(refresh, 'refreshMessages handler exists');
  assert.match(refresh[0], /catch \{/);
  assert.match(refresh[0], /finally \{[\s\S]*?setLoading\(false\)/);
});

test('cloud delete and write operations are scoped to the signed-in user', () => {
  assert.match(page, /\.from\('messages'\)\.delete\(\)\.eq\('id', message\.id\)\.eq\('user_id', user\.id\)/);
  assert.match(page, /\.from\('messages'\)\.update\([\s\S]*?\.eq\('id', editingId\)\.eq\('user_id', user!\.id\)/);
  assert.match(page, /\.from\('messages'\)\.insert\(\{ user_id: user!\.id/);
});

test('failed cloud writes report failure and do not close the composer', () => {
  const compose = page.match(/async function handleCompose[\s\S]*?
  }/);
  assert.ok(compose, 'handleCompose handler exists');
  assert.match(compose[0], /Your changes were not saved/);
  assert.match(compose[0], /finally \{[\s\S]*?setLoading\(false\)/);
  assert.ok(compose[0].indexOf('Could not reach the cloud service') < compose[0].indexOf('setComposeOpen(false)'), 'failure returns before closing the composer');
});
