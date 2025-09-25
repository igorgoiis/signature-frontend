import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatUTCDateToUserTimezone(utcDate: string | Date): Date {
  return toZonedTime(utcDate, userTimezone);
}

export function formatUserTimezoneToUTCDate(date: string | Date): Date {
  return fromZonedTime(date, userTimezone);
}