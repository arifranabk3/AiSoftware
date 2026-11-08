/**
 * Timezone & Publishing Slot Utilities for AIsoftware Editorial System
 * Timezone: Asia/Karachi (PKT, UTC+5:00 permanently, no Daylight Saving Time)
 */

export const PKT_TIMEZONE = 'Asia/Karachi';
export const PKT_OFFSET_HOURS = 5;

/**
 * Two daily publishing slots in PKT:
 * Slot 1: 09:00 PKT -> 04:00 UTC
 * Slot 2: 18:00 PKT -> 13:00 UTC
 */
export const DAILY_PUBLISHING_SLOTS_PKT = [
  { hour: 9, minute: 0, label: '09:00 AM PKT (Morning Slot)' },
  { hour: 18, minute: 0, label: '06:00 PM PKT (Evening Slot)' }
] as const;

/**
 * Format any UTC ISO date string into readable Asia/Karachi local presentation
 */
export function formatPKTDateTime(utcIsoString: string | null | undefined): string {
  if (!utcIsoString) return 'Not Scheduled';
  const d = new Date(utcIsoString);
  if (isNaN(d.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: PKT_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d) + ' PKT';
}

/**
 * Format date-only in Asia/Karachi
 */
export function formatPKTDate(utcIsoString: string | null | undefined): string {
  if (!utcIsoString) return 'Unpublished';
  const d = new Date(utcIsoString);
  if (isNaN(d.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: PKT_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

/**
 * Construct UTC ISO timestamp from PKT Date and Slot
 */
export function createSlotUTC(year: number, month: number, day: number, slot: 9 | 18): string {
  // PKT is strictly UTC+5
  const utcHour = slot === 9 ? 4 : 13;
  const d = new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0, 0));
  return d.toISOString();
}

/**
 * Determine if an article is officially published and publicly visible
 * Rules:
 * 1. Must NOT be 'Draft', 'Technical Review', or 'Editorial Review'
 * 2. editorialStatus must be 'Approved' or 'Published'
 * 3. publicationStatus must be 'Published'
 * 4. publishedAt must be in the past (<= now)
 */
export function isArticlePubliclyVisible(article: {
  editorialStatus: string;
  publicationStatus: string;
  publishedAt: string | null;
  scheduledAt?: string | null;
}, referenceDate: Date = new Date()): boolean {
  // Never publish articles with pending human review
  if (
    article.editorialStatus === 'Draft' ||
    article.editorialStatus === 'Technical Review' ||
    article.editorialStatus === 'Editorial Review'
  ) {
    return false;
  }

  if (article.publicationStatus !== 'Published') {
    return false;
  }

  if (!article.publishedAt) {
    return false;
  }

  const pubTime = new Date(article.publishedAt).getTime();
  if (isNaN(pubTime)) return false;

  // Future scheduled articles do not appear before publication
  return pubTime <= referenceDate.getTime();
}
