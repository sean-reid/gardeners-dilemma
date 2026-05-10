/**
 * Perform one step of the Collatz iteration.
 * Even numbers are halved; odd numbers go to 3n + 1.
 * Returns 1 unchanged (fixed point).
 */
export function collatzStep(n: number): number {
  if (n <= 1) return 1;
  return n % 2 === 0 ? n / 2 : 3 * n + 1;
}

/**
 * Compute the full Collatz sequence from n down to 1.
 * The sequence includes the starting value and ends with 1.
 */
export function collatzSequence(n: number): number[] {
  const seq: number[] = [n];
  let current = n;
  while (current !== 1) {
    current = collatzStep(current);
    seq.push(current);
  }
  return seq;
}

/**
 * Count the number of steps it takes for n to reach 1.
 * collatzSequenceLength(1) === 0.
 */
export function collatzSequenceLength(n: number): number {
  let steps = 0;
  let current = n;
  while (current !== 1) {
    current = collatzStep(current);
    steps++;
  }
  return steps;
}
