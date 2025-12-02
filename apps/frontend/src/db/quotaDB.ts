import { getDB } from './indexedDB';

const DEFAULT_LIMIT = 100;

type QuotaState = {
  id: 'daily';
  date: string;
  callsUsed: number;
  dailyLimit: number;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export const quotaDB = {
  async getQuota(): Promise<QuotaState> {
    const db = await getDB();
    const stored = await db.get('quota', 'daily');

    if (!stored || stored.date !== todayStr()) {
      const fresh: QuotaState = {
        id: 'daily',
        date: todayStr(),
        callsUsed: 0,
        dailyLimit: stored?.dailyLimit ?? DEFAULT_LIMIT,
      };
      await db.put('quota', fresh);
      return fresh;
    }

    return stored;
  },

  async canMakeCall(): Promise<boolean> {
    const quota = await this.getQuota();
    return quota.callsUsed < quota.dailyLimit;
  },

  async recordCall(): Promise<void> {
    const db = await getDB();
    const quota = await this.getQuota();
    await db.put('quota', {
      ...quota,
      callsUsed: quota.callsUsed + 1,
    });
  },
};
