import test from 'node:test';
import assert from 'node:assert/strict';
import { compareMessages, searchMessages, validateCompose, formatTimelineDate, isValidTimelineDate } from '../lib/timeline.mjs';

const messages = [
  { id: 'old', timeline_at: '1998-09-03T10:00:00.000Z', subject: 'A letter from the past', sender: 'Ada', recipient: 'you@example.com', body: 'archive note' },
  { id: 'recent', timeline_at: '2026-10-19T10:00:00.000Z', subject: 'Meeting notes', sender: 'Lin', recipient: 'you@example.com', body: 'tomorrow' },
  { id: 'middle', timeline_at: '2012-01-01T00:00:00.000Z', subject: 'Old project', sender: 'Ada', recipient: 'team@example.com', body: 'launch' }
];

test('newest-first sort orders by timeline date, not creation date', () => {
  assert.deepEqual([...messages].sort(compareMessages).map(m => m.id), ['recent', 'middle', 'old']);
});
test('oldest-first sort puts historical entries first', () => {
  assert.deepEqual([...messages].sort((a, b) => compareMessages(a, b, 'oldest')).map(m => m.id), ['old', 'middle', 'recent']);
});
test('search matches subject, sender, recipient and body case-insensitively', () => {
  assert.deepEqual(searchMessages(messages, 'ADA').map(m => m.id), ['old', 'middle']);
  assert.deepEqual(searchMessages(messages, 'team@example.com').map(m => m.id), ['middle']);
  assert.deepEqual(searchMessages(messages, 'LAUNCH').map(m => m.id), ['middle']);
});
test('blank search returns all messages without mutating the source', () => {
  assert.equal(searchMessages(messages, '  ').length, 3);
  assert.equal(messages.length, 3);
});
test('compose validation rejects missing and malformed fields', () => {
  const result = validateCompose({ recipient: 'nope', subject: '', body: '', timeline_at: 'nonsense' });
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['body', 'recipient', 'subject', 'timeline_at']);
});
test('compose validation accepts a complete message with an explicit historical date', () => {
  const result = validateCompose({ recipient: 'friend@example.com', subject: 'A note', body: 'Hello from the past', timeline_at: '1998-09-03T12:00' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});
test('compose validation rejects whitespace-only fields and invalid recipient addresses', () => {
  for (const recipient of ['', 'x', 'person@', '@example.com', 'person@example']) {
    const result = validateCompose({ recipient, subject: 'Subject', body: 'Body', timeline_at: '2001-01-01T00:00:00Z' });
    assert.equal(result.valid, false, `should reject recipient: ${recipient}`);
    assert.ok(result.errors.recipient);
  }
  assert.equal(validateCompose({ recipient: 'person@example.com', subject: '  ', body: 'Body', timeline_at: '2001-01-01T00:00:00Z' }).errors.subject, 'Add a subject.');
});
test('invalid dates format safely instead of crashing the inbox', () => {
  assert.equal(formatTimelineDate('not-a-date'), 'Unknown date');
});
test('sort comparator stays deterministic when an entry has an invalid date', () => {
  const invalid = { id: 'bad', timeline_at: 'not-a-date' };
  assert.equal(compareMessages(invalid, messages[0]), 0);
  assert.equal(compareMessages(messages[0], invalid), 0);
});

test('calendar validation rejects impossible dates instead of normalizing them', () => {
  assert.equal(isValidTimelineDate('2026-02-31T12:00'), false);
  assert.equal(isValidTimelineDate('2025-02-29T12:00'), false);
  assert.equal(isValidTimelineDate('2024-02-29T12:00'), true);
  assert.equal(isValidTimelineDate('1998-09-03T09:00'), true);
  assert.equal(isValidTimelineDate('not-a-date'), false);
});
