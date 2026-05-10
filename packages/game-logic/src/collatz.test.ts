import { describe, it, expect } from 'vitest';
import { collatzStep, collatzSequence, collatzSequenceLength } from './collatz.js';

describe('collatzStep', () => {
  it('halves even numbers', () => {
    expect(collatzStep(10)).toBe(5);
    expect(collatzStep(64)).toBe(32);
    expect(collatzStep(100)).toBe(50);
  });

  it('applies 3n+1 to odd numbers', () => {
    expect(collatzStep(3)).toBe(10);
    expect(collatzStep(7)).toBe(22);
    expect(collatzStep(27)).toBe(82);
  });

  it('returns 1 for input 1', () => {
    expect(collatzStep(1)).toBe(1);
  });

  it('returns 1 for input 2 (2 / 2 = 1)', () => {
    expect(collatzStep(2)).toBe(1);
  });
});

describe('collatzSequence', () => {
  it('returns [1] for input 1', () => {
    expect(collatzSequence(1)).toEqual([1]);
  });

  it('returns correct sequence for small numbers', () => {
    // 6 -> 3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1
    expect(collatzSequence(6)).toEqual([6, 3, 10, 5, 16, 8, 4, 2, 1]);
  });

  it('starts with input and ends with 1', () => {
    const seq = collatzSequence(27);
    expect(seq[0]).toBe(27);
    expect(seq[seq.length - 1]).toBe(1);
  });

  it('has length of sequenceLength + 1', () => {
    const seq = collatzSequence(27);
    const len = collatzSequenceLength(27);
    expect(seq.length).toBe(len + 1);
  });
});

describe('collatzSequenceLength', () => {
  it('returns 0 for 1', () => {
    expect(collatzSequenceLength(1)).toBe(0);
  });

  it('returns 111 for 27 (classic example)', () => {
    expect(collatzSequenceLength(27)).toBe(111);
  });

  it('returns log2(n) for powers of 2', () => {
    expect(collatzSequenceLength(2)).toBe(1);   // log2(2) = 1
    expect(collatzSequenceLength(4)).toBe(2);   // log2(4) = 2
    expect(collatzSequenceLength(8)).toBe(3);   // log2(8) = 3
    expect(collatzSequenceLength(16)).toBe(4);  // log2(16) = 4
    expect(collatzSequenceLength(32)).toBe(5);  // log2(32) = 5
    expect(collatzSequenceLength(64)).toBe(6);  // log2(64) = 6
  });

  it('returns 8 for 6', () => {
    // 6 -> 3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1 (8 steps)
    expect(collatzSequenceLength(6)).toBe(8);
  });
});
