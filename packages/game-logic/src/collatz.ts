export function collatzStep(n: number): number {
  if (n <= 1) return 1;
  return n % 2 === 0 ? n / 2 : 3 * n + 1;
}

export function collatzSequence(n: number): number[] {
  const seq: number[] = [n];
  let current = n;
  while (current !== 1) {
    current = collatzStep(current);
    seq.push(current);
  }
  return seq;
}

export function collatzSequenceLength(n: number): number {
  let steps = 0;
  let current = n;
  while (current !== 1) {
    current = collatzStep(current);
    steps++;
  }
  return steps;
}
