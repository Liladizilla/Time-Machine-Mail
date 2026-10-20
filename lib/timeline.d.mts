export type TimelineMessage = { timeline_at: string; subject?: string; sender?: string; recipient?: string; body?: string };
export function compareMessages(a: TimelineMessage, b: TimelineMessage, direction?: 'newest' | 'oldest'): number;
export function searchMessages<T extends TimelineMessage>(messages: T[], query: string): T[];
export function validateCompose(input: { recipient: string; subject: string; body: string; timeline_at: string }): { valid: boolean; errors: Record<string, string> };
export function formatTimelineDate(value: string, locale?: string): string;
