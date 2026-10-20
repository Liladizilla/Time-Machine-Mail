/** Pure timeline helpers shared by the app and Node's built-in test runner. */
export function compareMessages(a, b, direction = 'newest') {
  const delta = new Date(a.timeline_at).getTime() - new Date(b.timeline_at).getTime();
  const safeDelta = Number.isFinite(delta) ? delta : 0;
  return direction === 'oldest' ? safeDelta : -safeDelta;
}

export function searchMessages(messages, query) {
  const needle = String(query ?? '').trim().toLocaleLowerCase();
  if (!needle) return [...messages];
  return messages.filter((message) => [message.subject, message.sender, message.recipient, message.body].some((field) => String(field ?? '').toLocaleLowerCase().includes(needle)));
}

export function validateCompose(input) {
  const errors = {};
  if (!String(input.recipient ?? '').trim() || !/^\\S+@\\S+\\.\\S+$/.test(String(input.recipient).trim())) errors.recipient = 'Enter a valid recipient email address.';
  if (!String(input.subject ?? '').trim()) errors.subject = 'Add a subject.';
  if (!String(input.body ?? '').trim()) errors.body = 'Write a message first.';
  const timestamp = new Date(input.timeline_at).getTime();
  if (!input.timeline_at || !Number.isFinite(timestamp)) errors.timeline_at = 'Choose a valid date and time.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function formatTimelineDate(value, locale = 'en-GB') {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}
