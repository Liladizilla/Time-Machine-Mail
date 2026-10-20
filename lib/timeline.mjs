/** Pure timeline helpers shared by the app and Node's built-in test runner. */
export function compareMessages(a, b, direction = 'newest') {
  const delta = new Date(a.timeline_at).getTime() - new Date(b.timeline_at).getTime();
  if (!Number.isFinite(delta) || delta === 0) return 0;
  return direction === 'oldest' ? delta : -delta;
}

export function searchMessages(messages, query) {
  const needle = String(query ?? '').trim().toLocaleLowerCase();
  if (!needle) return [...messages];
  return messages.filter((message) => [message.subject, message.sender, message.recipient, message.body].some((field) => String(field ?? '').toLocaleLowerCase().includes(needle)));
}

export function isValidTimelineDate(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return false;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return true;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

export function validateCompose(input) {
  const errors = {};
  if (!String(input.recipient ?? '').trim() || !/^\S+@\S+\.\S+$/.test(String(input.recipient).trim())) errors.recipient = 'Enter a valid recipient email address.';
  if (!String(input.subject ?? '').trim()) errors.subject = 'Add a subject.';
  if (!String(input.body ?? '').trim()) errors.body = 'Write a message first.';
  if (!isValidTimelineDate(input.timeline_at)) errors.timeline_at = 'Choose a valid date and time.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function formatTimelineDate(value, locale = 'en-GB') {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}
