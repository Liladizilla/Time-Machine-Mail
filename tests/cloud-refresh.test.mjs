import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('manual refresh reloads cloud data and accurately labels preview mode', () => {
  assert.match(page, /aria-label="Refresh timeline"/);
  assert.match(page, /if \(user\) void refreshMessages\(user\)/);
  assert.match(page, /Preview data is local to this session; there is no cloud connection to refresh\./);
  assert.match(page, /disabled=\{loading\}/);
  assert.match(page, /Refreshing…/);
});
