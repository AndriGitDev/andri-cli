import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WpmTracker, validateWpmData } from '../src/lib/wpm.ts';

test('validates bounds before allocating session state or calculating WPM', () => {
  const valid = { sessionId: 'session', characters: 100, timeElapsed: 30, accuracy: 99 };
  assert.equal(validateWpmData(valid), true);
  for (const bad of [null, {}, { ...valid, sessionId: 'a'.repeat(129) }, { ...valid, characters: 1e20 },
    { ...valid, timeElapsed: 0 }, { ...valid, accuracy: NaN }, { ...valid, accuracy: 101 }]) {
    assert.equal(validateWpmData(bad), false);
  }
});

test('retains exact running averages and peaks without storing sample history', () => {
  const tracker = new WpmTracker();
  tracker.record('a', 40, 0);
  const result = tracker.record('a', 80, 1);
  assert.equal(result.totalWpm / result.samples, 60);
  assert.equal(result.peakWpm, 80);
});

test('expires idle sessions and evicts the least recently used session at capacity', () => {
  const tracker = new WpmTracker(2, 100);
  tracker.record('a', 40, 0);
  tracker.record('b', 50, 1);
  tracker.record('a', 60, 2);
  tracker.record('c', 70, 3);
  assert.equal(tracker.record('b', 10, 4).samples, 1);
  assert.equal(tracker.record('b', 20, 104).samples, 1);
});
