import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../supabase/migrations/202610200001_initial_schema.sql', import.meta.url), 'utf8');

test('messages are scoped to an authenticated user and RLS is enabled', () => {
  assert.match(schema, /alter\s+table\s+public\.messages\s+enable\s+row\s+level\s+security/i);
  assert.match(schema, /user_id\s+uuid\s+not\s+null\s+references\s+auth\.users\s*\(id\)\s+on\s+delete\s+cascade/i);
});

test('select, insert, update, and delete policies are present and user-scoped', () => {
  for (const operation of ['select', 'insert', 'update', 'delete']) {
    const policy = new RegExp(`create\\s+policy\\s+[\\"'][^\\"']+[\\"']\\s+on\\s+public\\.messages\\s+for\\s+${operation}\\b`, 'i');
    assert.match(schema, policy, `missing ${operation.toUpperCase()} policy`);
  }
  assert.ok((schema.match(/auth\.uid\(\)/g) ?? []).length >= 5, 'expected per-user USING and WITH CHECK predicates');
  assert.match(schema, /with\s+check\s*\(\s*\(select\s+auth\.uid\(\)\)\s*=\s*user_id\s*\)/i);
});

test('message statuses and user timeline indexes are constrained', () => {
  assert.match(schema, /status\s+text\s+not\s+null\s+default\s+'timeline_entry'\s+check\s*\(status\s+in\s*\('draft',\s*'timeline_entry'\)\)/i);
  assert.match(schema, /messages_user_timeline_idx\s+on\s+public\.messages\s*\(user_id,\s*timeline_at\s+desc\)/i);
  assert.match(schema, /messages_user_created_idx\s+on\s+public\.messages\s*\(user_id,\s*created_at\s+desc\)/i);
});
