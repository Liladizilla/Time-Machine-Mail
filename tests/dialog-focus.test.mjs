import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('modal focus is moved inside, trapped with Tab, and restored on close', () => {
  assert.match(page, /const activeDialog = deleteTarget \? 'delete'/);
  assert.match(page, /document\.querySelectorAll<HTMLElement>\('\[role="dialog"\]\[aria-modal="true"\]'\)/);
  assert.match(page, /\(getFocusable\(\)\[0\] \?\? dialog\)\.focus\(\)/);
  assert.match(page, /event\.shiftKey && \(document\.activeElement === first/);
  assert.match(page, /!event\.shiftKey && \(document\.activeElement === last/);
  assert.match(page, /if \(previousFocus\?\.isConnected\) previousFocus\.focus\(\)/);
  assert.match(page, /document\.removeEventListener\('keydown', trapFocus\)/);
});
