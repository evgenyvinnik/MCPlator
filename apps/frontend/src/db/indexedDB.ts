import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface CasioDBSchema extends DBSchema {
  'calculator-state': {
    key: 'current';
    value: {
      id: 'current';
      state: import('@calculator/calculator-engine').CalculatorInternalState;
      display: import('@calculator/shared-types').CalculatorDisplay;
      updatedAt: string;
    };
  };
  'chat-messages': {
    key: string;
    value: import('@calculator/shared-types').ChatMessage;
    indexes: { 'by-created': string };
  };
  'quota': {
    key: 'daily';
    value: {
      id: 'daily';
      date: string;
      callsUsed: number;
      dailyLimit: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<CasioDBSchema>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CasioDBSchema>('casio-calculator-v2', 1, {
      upgrade(db) {
        // Calculator state store
        db.createObjectStore('calculator-state', { keyPath: 'id' });

        // Chat messages store
        const chatStore = db.createObjectStore('chat-messages', { keyPath: 'id' });
        chatStore.createIndex('by-created', 'createdAt');

        // Quota store
        db.createObjectStore('quota', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};
