const STORAGE_KEY = 'casio_llm_quota_v1';
const DEFAULT_LIMIT = 100;

type QuotaState = {
  date: string;       // YYYY-MM-DD
  callsUsed: number;
  dailyLimit: number;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const loadQuota = (): QuotaState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { date: todayStr(), callsUsed: 0, dailyLimit: DEFAULT_LIMIT };
    }
    const parsed = JSON.parse(raw) as QuotaState;
    if (parsed.date !== todayStr()) {
      return { date: todayStr(), callsUsed: 0, dailyLimit: parsed.dailyLimit };
    }
    return parsed;
  } catch {
    return { date: todayStr(), callsUsed: 0, dailyLimit: DEFAULT_LIMIT };
  }
};

const saveQuota = (q: QuotaState) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
};

export const canMakeCall = () => {
  const q = loadQuota();
  return q.callsUsed < q.dailyLimit;
};

export const recordCall = () => {
  const q = loadQuota();
  const updated: QuotaState = {
    ...q,
    date: todayStr(),
    callsUsed: q.callsUsed + 1,
  };
  saveQuota(updated);
};
