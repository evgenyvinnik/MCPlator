import { getDB } from './indexedDB';
import type { ChatMessage } from '@calculator/shared-types';

export const chatDB = {
  async getAllMessages(): Promise<ChatMessage[]> {
    const db = await getDB();
    return db.getAllFromIndex('chat-messages', 'by-created');
  },

  async addMessage(message: ChatMessage): Promise<void> {
    const db = await getDB();
    await db.put('chat-messages', message);
  },

  async clearMessages(): Promise<void> {
    const db = await getDB();
    await db.clear('chat-messages');
  },

  async getRecentMessages(limit: number): Promise<ChatMessage[]> {
    const all = await this.getAllMessages();
    return all.slice(-limit);
  },
};
