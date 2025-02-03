import moment from 'moment-timezone';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const parseDateTime = (dateStr: string, timeStr: string, timezone: string) => moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm', timezone).toDate();

export const convertTimezone = (date: Date, fromTimezone: string, toTimezone: string) => moment.tz(date, fromTimezone).tz(toTimezone).toDate();

export const formatDateTime = (date: Date, timezone: string) => moment.tz(date, timezone).format('YYYY-MM-DD HH:mm');

export const getReminderTime = (eventDate: Date, leadTimeMs: number) => new Date(eventDate.getTime() - leadTimeMs);

export const removeDuplicates = <T>(arr: T[]) => [...new Set(arr)];