import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('interactive panels expose dialog semantics and accessible names', () => {
  for (const id of ['settings-title', 'detail-title', 'compose-title', 'delete-title', 'auth-title']) {
    assert.match(page, new RegExp(`role=\\\"dialog\\\" aria-modal=\\\"true\\\" aria-labelledby=\\\"${id}\\\"`));
    assert.match(page, new RegExp(`id=\\\"${id}\\\"`));
  }
});
