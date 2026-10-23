import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration } from '../dist/src/duration-value.js';

test('durations parse to whole seconds with an idempotent canonical representation', () => {
  for (const [text, expected] of [['1h 30m', 5400], ['90m', 5400], ['01:30', 5400], ['01:30:05', 5405], ['2h 3s', 7203], ['0s', 0], [' 12M ', 720], ['42', 42]]) {
    assert.equal(parseDuration(text), expected, text);
    assert.equal(parseDuration(String(expected)), expected);
  }
});

test('ambiguous, fractional, negative, overflowing, or malformed durations are rejected', () => {
  for (const value of ['', ' ', '-1', '1.5h', '1:60', '1:2', '30m 1h', '1d', 'Infinity', '9007199254740992', '1h junk', '1h 2h', '1h30']) assert.equal(parseDuration(value), null, value);
});
