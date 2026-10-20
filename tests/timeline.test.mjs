import test from 'node:test';
import assert from 'node:assert/strict';
import { compareMessages, searchMessages, validateCompose } from '../lib/timeline.mjs';

const messages = [
  { id: 'old', timeline_at: '1998-09-03T10:00:00.000Z', subject: 'A letter from the past', sender: 'Ada', recipient: 'you@example.com', body: 'archive note' },
  { id: 'recent', timeline_at: '2026-10-19T10:00:00.000Z', subject: 'Meeting notes', sender: 'Lin', recipient: 'you@example.com', body: 'tomorrow' },
  { id: 'middle', timeline_at: '2012-01-01T00:00:00.000Z', subject: 'Old project', sender: 'Ada', recipient: 'team@example.com', body: 'launch' }
];

test('newest-first sort orders by timeline date, not creation date', () => { assert.deepEqual([...messages].sort(compareMessages).map(m => m.id), ['recent', 'middle', 'old']); });
test('oldest-first sort puts historical entries first', () => { assert.deepEqual([...messages].sort((a, b) => compareMessages(a, b, 'oldest')).map(m => m.id), ['old', 'middle', 'recent']); });
test('search matches subject, sender, recipient and body case-insensitively', () => { assert.deepEqual(searchMessages(messages, 'ADA').map(m => m.id), ['old', 'middle']); assert.deepEqual(searchMessages(messages, 'team@example.com').map(m => m.id), ['middle']); assert.deepEqual(searchMessages(messages, 'LAUNCH').map(m => m.id), ['middle']); });
test('blank search returns all messages without mutating the source', () => { assert.equal(searchMessages(messages, '  ').length, 3); assert.equal(messages.length, 3); });
test('compose validation rejects missing and malformed fields', () => { const result = validateCompose({ recipient: 'nope', subject: '', body: '', timeline_at: 'nonsense' }); assert.equal(result.valid, false); assert.deepEqual(Object.keys(result.errors).sort(), ['body', 'recipient', 'subject', 'timeline_at']); });
test('compose validation accepts a complete message with an explicit historical date', () => { const result = validateCompose({ recipient: 'friend@example.com', subject: 'A note', body: 'Hello from the past', timeline_at: '1998-09-03T12:00' }); assert.equal(result.valid, true); assert.deepEqual(result.errors, {}); });
