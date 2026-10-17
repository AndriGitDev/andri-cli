export interface WpmData {
  sessionId: string;
  characters: number;
  timeElapsed: number;
  accuracy: number;
}

export function validateWpmData(value: unknown): value is WpmData {
  if (!value || typeof value !== 'object') return false;
  const data = value as WpmData;
  return typeof data.sessionId === 'string' && data.sessionId.length > 0 && data.sessionId.length <= 128 &&
    Number.isInteger(data.characters) && data.characters >= 0 && data.characters <= 1_000_000 &&
    Number.isFinite(data.timeElapsed) && data.timeElapsed >= 0.1 && data.timeElapsed <= 86_400 &&
    Number.isFinite(data.accuracy) && data.accuracy >= 0 && data.accuracy <= 100;
}

interface SessionData {
  totalWpm: number;
  samples: number;
  peakWpm: number;
  achievements: string[];
  updatedAt: number;
}

// Fixed capacity and idle expiry bound memory even when session IDs are hostile.
// Running totals avoid retaining and scanning every submitted sample.
export class WpmTracker {
  private sessions = new Map<string, SessionData>();
  private capacity: number;
  private ttlMs: number;

  constructor(capacity = 1_000, ttlMs = 30 * 60_000) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;
  }

  record(id: string, wpm: number, now = Date.now()): SessionData {
    for (const [key, session] of this.sessions) {
      if (now - session.updatedAt < this.ttlMs) break;
      this.sessions.delete(key);
    }
    const session = this.sessions.get(id) ?? {
      totalWpm: 0, samples: 0, peakWpm: 0, achievements: [], updatedAt: now,
    };
    this.sessions.delete(id);
    if (this.sessions.size >= this.capacity) {
      this.sessions.delete(this.sessions.keys().next().value!);
    }
    session.totalWpm += wpm;
    session.samples += 1;
    session.peakWpm = Math.max(session.peakWpm, wpm);
    session.updatedAt = now;
    this.sessions.set(id, session);
    return session;
  }
}
