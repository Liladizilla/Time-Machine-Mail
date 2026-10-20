import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('interactive panels expose dialog semantics and accessible names', () => {
  for (const id of ['settings-title', 'detail-title', 'compose-title', 'delete-title', 'auth-title']) {
    assert.ok(page.includes(`aria-labelledby="${id}"`), `${id} is referenced by its dialog`);
    assert.ok(page.includes(`id="${id}"`), `${id} exists on a heading`);
  }
  assert.equal((page.match(/role="dialog" aria-modal="true"/g) ?? []).length, 5);
});
