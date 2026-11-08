import { describe, it, expect } from 'vitest';
import {
  formatPKTDateTime,
  formatPKTDate,
  createSlotUTC,
  isArticlePubliclyVisible,
  DAILY_PUBLISHING_SLOTS_PKT
} from '../apps/web/src/lib/date-utils';
import { ARTICLES, getPublishedArticles } from '../apps/web/src/lib/articles';

describe('Phase 12.8 — Editorial Publishing System & Date Management', () => {
  it('correctly maps 09:00 PKT and 18:00 PKT to UTC without daylight-saving drift', () => {
    // 09:00 AM PKT = 04:00 AM UTC
    const morningSlotUTC = createSlotUTC(2026, 11, 8, 9);
    expect(morningSlotUTC).toBe('2026-11-08T04:00:00.000Z');
    expect(formatPKTDateTime(morningSlotUTC)).toContain('09:00 AM');
    expect(formatPKTDateTime(morningSlotUTC)).toContain('PKT');

    // 06:00 PM PKT = 01:00 PM (13:00) UTC
    const eveningSlotUTC = createSlotUTC(2026, 11, 8, 18);
    expect(eveningSlotUTC).toBe('2026-11-08T13:00:00.000Z');
    expect(formatPKTDateTime(eveningSlotUTC)).toContain('06:00 PM');
    expect(formatPKTDateTime(eveningSlotUTC)).toContain('PKT');
  });

  it('prohibits publication of draft, technical review, and editorial review states', () => {
    const morningSlot = createSlotUTC(2026, 11, 8, 9);

    const draft = {
      editorialStatus: 'Draft',
      publicationStatus: 'Published',
      publishedAt: morningSlot
    };
    const techReview = {
      editorialStatus: 'Technical Review',
      publicationStatus: 'Published',
      publishedAt: morningSlot
    };
    const editReview = {
      editorialStatus: 'Editorial Review',
      publicationStatus: 'Published',
      publishedAt: morningSlot
    };

    expect(isArticlePubliclyVisible(draft)).toBe(false);
    expect(isArticlePubliclyVisible(techReview)).toBe(false);
    expect(isArticlePubliclyVisible(editReview)).toBe(false);
  });

  it('hides future scheduled articles until the slot passes', () => {
    const futureDate = '2099-01-01T04:00:00.000Z';
    const futureArticle = {
      editorialStatus: 'Approved',
      publicationStatus: 'Published',
      publishedAt: futureDate
    };

    expect(isArticlePubliclyVisible(futureArticle)).toBe(false);
  });

  it('approves visibility for past approved and published articles', () => {
    const pastArticle = {
      editorialStatus: 'Approved',
      publicationStatus: 'Published',
      publishedAt: '2026-11-05T04:00:00.000Z'
    };

    expect(isArticlePubliclyVisible(pastArticle)).toBe(true);
  });

  it('confirms all 11 published catalog articles have verified date fields and PKT representations', () => {
    const published = getPublishedArticles();
    expect(published.length).toBe(11);

    published.forEach((article) => {
      expect(article.createdAt).toBeDefined();
      expect(article.updatedAt).toBeDefined();
      expect(article.publishedAt).toBeDefined();
      expect(article.editorialStatus).toBe('Approved');
      expect(article.publicationStatus).toBe('Published');

      // Verify PKT date string formatting works without error
      const pktFormatted = formatPKTDate(article.publishedAt);
      expect(pktFormatted).toBeTruthy();
    });
  });
});
