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
  const start = page.indexOf('async function refreshMessages');
  const end = page.indexOf('\n  useEffect', start);
  const refresh = page.slice(start, end);
  assert.ok(start >= 0 && end > start, 'refreshMessages handler exists');
  assert.match(refresh, /catch \{/);
  assert.match(refresh, /finally \{[\s\S]*?setLoading\(false\)/);
});

test('cloud delete and write operations are scoped to the signed-in user', () => {
  assert.match(page, /\.from\('messages'\)\.delete\(\)\.eq\('id', message\.id\)\.eq\('user_id', user\.id\)/);
  assert.match(page, /\.from\('messages'\)\.update\([\s\S]*?\.eq\('id', editingId\)\.eq\('user_id', user!\.id\)/);
  assert.match(page, /\.from\('messages'\)\.insert\(\{ user_id: user!\.id/);
});

test('failed cloud writes report failure and do not close the composer', () => {
  const start = page.indexOf('async function handleCompose');
  const end = page.indexOf('\n\n  return <main', start);
  const compose = page.slice(start, end);
  assert.ok(start >= 0 && end > start, 'handleCompose handler exists');
  assert.match(compose, /Your changes were not saved/);
  assert.match(compose, /finally \{[\s\S]*?setLoading\(false\)/);
  assert.ok(compose.indexOf('Could not reach the cloud service') < compose.indexOf('setComposeOpen(false)'), 'failure returns before closing the composer');
});

test('cloud updates and inserts require a returned record before reporting success', () => {
  const start = page.indexOf('async function handleCompose');
  const end = page.indexOf('\n\n  return <main', start);
  const compose = page.slice(start, end);
  assert.match(compose, /composeInFlight\.current/);
  assert.match(compose, /if \(!data\) \{ setNotice\('The cloud service did not return the updated entry/);
  assert.match(compose, /if \(!data\) \{ setNotice\('The cloud service did not confirm the saved entry/);
  assert.match(page, /type=\"submit\" disabled=\{loading \|\| composeInFlight\.current\}/);
});

test('cloud updates and deletes report entries that no longer exist', () => {
  assert.match(page, /error\.code === 'PGRST116'[\s\S]*?no longer exists or is not accessible/);
  assert.match(page, /delete\(\)\.eq\('id', message\.id\)\.eq\('user_id', user\.id\)\.select\('id'\)/);
  assert.match(page, /if \(!data\?\.length\) \{ setNotice\('This entry no longer exists or is not accessible/);
});

test('authentication submissions are guarded against rapid duplicate requests', () => {
  const start = page.indexOf('async function handleAuth');
  const end = page.indexOf('\n\n  async function signOut', start);
  const auth = page.slice(start, end);
  assert.ok(start >= 0 && end > start, 'handleAuth handler exists');
  assert.match(auth, /if \(authInFlight\.current\) return;/);
  assert.match(auth, /authInFlight\.current = true;[\s\S]*?setLoading\(true\)/);
  assert.match(auth, /finally \{[\s\S]*?authInFlight\.current = false;[\s\S]*?setLoading\(false\)/);
  assert.match(page, /className=\"primary-button auth-submit\" type=\"submit\" disabled=\{loading\}/);
});

test('stale timeline responses cannot overwrite the active account or sort order', () => {
  const start = page.indexOf('async function refreshMessages');
  const end = page.indexOf('\n  useEffect', start);
  const refresh = page.slice(start, end);
  assert.match(refresh, /const requestSequence = \+\+timelineRequestSequence\.current/);
  assert.match(refresh, /if \(requestSequence !== timelineRequestSequence\.current\) return;/);
  assert.match(refresh, /if \(requestSequence === timelineRequestSequence\.current\) setLoading\(false\)/);
  const authStart = page.indexOf('supabase.auth.onAuthStateChange');
  const authEnd = page.indexOf('listener.subscription.unsubscribe()', authStart);
  const authListener = page.slice(authStart, authEnd);
  assert.match(authListener, /timelineRequestSequence\.current \+= 1/);
  assert.match(authListener, /if \(next\) \{[\s\S]*?setMessages\(\[\]\)/);
});

test('status updates are announced and Escape closes the topmost open panel', () => {
  assert.match(page, /className=\"notice-bar\" role=\"status\" aria-live=\"polite\" aria-atomic=\"true\"/);
  const start = page.indexOf('function handleShortcut');
  const end = page.indexOf('window.addEventListener('keydown'', start);
  const shortcuts = page.slice(start, end);
  assert.match(shortcuts, /event\.key === 'Escape'/);
  assert.match(shortcuts, /if \(deleteTarget\) \{ setDeleteTarget\(null\); return; \}/);
  assert.match(shortcuts, /if \(authOpen\) \{ setAuthOpen\(false\); return; \}/);
  assert.match(shortcuts, /if \(composeOpen\) \{ setComposeOpen\(false\); return; \}/);
  assert.match(shortcuts, /if \(selected\) \{ setSelected\(null\); return; \}/);
});
