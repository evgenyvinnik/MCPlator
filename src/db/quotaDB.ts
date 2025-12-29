/**
 * @fileoverview Daily API quota management using IndexedDB.
 *
 * Tracks and enforces daily limits on API calls to prevent abuse.
 * Quota resets automatically at midnight (based on local date).
 *
 * @module db/quotaDB
 */

import { getDB } from './indexedDB';

/** Default daily API call limit */
const DEFAULT_LIMIT = 100;

/**
 * Shape of the quota record stored in IndexedDB.
 */
type QuotaState = {
  /** Fixed key for the single quota record */
  id: 'daily';
  /** ISO date string (YYYY-MM-DD) of the current quota period */
  date: string;
  /** Number of API calls made today */
  callsUsed: number;
  /** Maximum allowed calls per day */
  dailyLimit: number;
};

/**
 * Returns today's date as ISO string (YYYY-MM-DD).
 * Used for quota period comparison.
 *
 * @returns Today's date string
 */
const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Quota database operations for API rate limiting.
 *
 * Manages a daily counter that resets at midnight. If the date
 * changes, the counter automatically resets to 0.
 *
 * @example
 * ```ts
 * // Check if user can make a call
 * if (await quotaDB.canMakeCall()) {
 *   await quotaDB.recordCall();
 *   // Make the API call
 * } else {
 *   // Show quota exceeded message
 * }
 * ```
 */
export const quotaDB = {
  /**
   * Gets the current quota state, creating or resetting if needed.
   *
   * If no quota exists or the date has changed, creates a fresh
   * quota with callsUsed = 0, preserving any custom dailyLimit.
   *
   * @returns Promise resolving to the current quota state
   */
  async getQuota(): Promise<QuotaState> {
    const db = await getDB();
    const stored = await db.get('quota', 'daily');

    // Reset if no quota or date has changed
    if (!stored || stored.date !== todayStr()) {
      const fresh: QuotaState = {
        id: 'daily',
        date: todayStr(),
        callsUsed: 0,
        // Preserve custom limit if set, otherwise use default
        dailyLimit: stored?.dailyLimit ?? DEFAULT_LIMIT,
      };
      await db.put('quota', fresh);
      return fresh;
    }

    return stored;
  },

  /**
   * Checks if the user can make another API call today.
   *
   * @returns Promise resolving to true if under limit, false if exceeded
   */
  async canMakeCall(): Promise<boolean> {
    const quota = await this.getQuota();
    return quota.callsUsed < quota.dailyLimit;
  },

  /**
   * Records an API call, incrementing the daily counter.
   *
   * Should be called after successfully initiating an API request.
   */
  async recordCall(): Promise<void> {
    const db = await getDB();
    const quota = await this.getQuota();
    await db.put('quota', {
      ...quota,
      callsUsed: quota.callsUsed + 1,
    });
  },
};
