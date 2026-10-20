import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('empty states offer a relevant action instead of a dead clear-search button', () => {
  assert.match(page, /query\.trim\(\) \? 'No matching messages'/);
  assert.match(page, /query\.trim\(\) \? <button onClick=\{\(\) => setQuery\(''\)\}>Clear search<\/button>/);
  assert.match(page, /folder === 'drafts' \? 'Create draft' : 'Compose entry'/);
  assert.match(page, /setSaveAsDraft\(folder === 'drafts'\)/);
});
