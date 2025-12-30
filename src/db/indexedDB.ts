/**
 * @fileoverview IndexedDB schema and initialization for the calculator app.
 *
 * Defines the database schema with three object stores:
 * - calculator-state: Persists calculator internal state and display
 * - chat-messages: Stores chat conversation history
 * - quota: Tracks daily API call limits
 *
 * Uses the `idb` library for a promise-based IndexedDB wrapper.
 *
 * @module db/indexedDB
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

/**
 * Type-safe IndexedDB schema for the Casio calculator application.
 *
 * Defines the structure of all object stores and their indexes.
 */
interface CasioDBSchema extends DBSchema {
  /**
   * Stores the current calculator state for session recovery.
   * Single record with key 'current'.
   */
  'calculator-state': {
    key: 'current';
    value: {
      id: 'current';
      /** Calculator engine internal state */
      state: import('../engine/calculatorEngine').CalculatorInternalState;
      /** Display value and indicators */
      display: import('../types/calculator').CalculatorDisplay;
      /** ISO timestamp of last update */
      updatedAt: string;
    };
  };
  /**
   * Stores chat messages between user and AI.
   * Indexed by creation date for chronological retrieval.
   */
  'chat-messages': {
    key: string;
    value: import('../types/chat').ChatMessage;
    indexes: { 'by-created': string };
  };
  /**
   * Stores daily API quota tracking.
   * Single record with key 'daily', resets each calendar day.
   */
  quota: {
    key: 'daily';
    value: {
      id: 'daily';
      /** ISO date string (YYYY-MM-DD) */
      date: string;
      /** Number of API calls made today */
      callsUsed: number;
      /** Maximum allowed calls per day */
      dailyLimit: number;
    };
  };
}

/** Cached database promise for singleton pattern */
let dbPromise: Promise<IDBPDatabase<CasioDBSchema>> | null = null;

/**
 * Gets or creates the IndexedDB database connection.
 *
 * Uses a singleton pattern - the database is opened once and the
 * promise is cached for subsequent calls.
 *
 * Database name: 'casio-calculator-v2'
 * Version: 1
 *
 * @returns Promise resolving to the database instance
 *
 * @example
 * ```ts
 * const db = await getDB();
 * const state = await db.get('calculator-state', 'current');
 * ```
 */
export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CasioDBSchema>('casio-calculator-v2', 1, {
      /**
       * Called when the database is created or upgraded.
       * Creates all required object stores and indexes.
       */
      upgrade(db) {
        // Calculator state store - single record persistence
        db.createObjectStore('calculator-state', { keyPath: 'id' });

        // Chat messages store with chronological index
        const chatStore = db.createObjectStore('chat-messages', {
          keyPath: 'id',
        });
        chatStore.createIndex('by-created', 'createdAt');

        // Quota store - daily API limit tracking
        db.createObjectStore('quota', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};
