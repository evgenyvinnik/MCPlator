/**
 * @fileoverview Chat message persistence layer using IndexedDB.
 *
 * Provides CRUD operations for chat messages with chronological ordering.
 * Messages are stored in the 'chat-messages' object store.
 *
 * @module db/chatDB
 */

import { getDB } from './indexedDB';
import type { ChatMessage } from '../types/chat';

/**
 * Chat database operations for message persistence.
 *
 * All messages are stored with their full content and metadata.
 * Messages are indexed by createdAt for chronological retrieval.
 *
 * @example
 * ```ts
 * // Add a message
 * await chatDB.addMessage({
 *   id: 'msg-1',
 *   role: 'user',
 *   text: 'Calculate 5 + 3',
 *   createdAt: new Date().toISOString()
 * });
 *
 * // Get all messages in order
 * const messages = await chatDB.getAllMessages();
 *
 * // Get last 6 messages for context
 * const recent = await chatDB.getRecentMessages(6);
 * ```
 */
export const chatDB = {
  /**
   * Retrieves all chat messages sorted by creation date.
   *
   * Uses the 'by-created' index for chronological ordering.
   *
   * @returns Promise resolving to array of all messages
   */
  async getAllMessages(): Promise<ChatMessage[]> {
    const db = await getDB();
    return db.getAllFromIndex('chat-messages', 'by-created');
  },

  /**
   * Adds or updates a chat message.
   *
   * Uses put() which will update if the ID exists, or insert if new.
   *
   * @param message - The chat message to persist
   */
  async addMessage(message: ChatMessage): Promise<void> {
    const db = await getDB();
    await db.put('chat-messages', message);
  },

  /**
   * Deletes all chat messages from the store.
   *
   * Used for clearing conversation history.
   */
  async clearMessages(): Promise<void> {
    const db = await getDB();
    await db.clear('chat-messages');
  },

  /**
   * Retrieves the most recent N messages.
   *
   * Useful for building context for AI requests.
   *
   * @param limit - Maximum number of messages to return
   * @returns Promise resolving to the last N messages
   */
  async getRecentMessages(limit: number): Promise<ChatMessage[]> {
    const all = await this.getAllMessages();
    return all.slice(-limit);
  },
};
