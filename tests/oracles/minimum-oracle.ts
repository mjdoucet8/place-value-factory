/** Independent dynamic-programming minimum-count oracle. It deliberately does not call game-engine. */
export function dynamicProgrammingMinimum(target: number, denominations: readonly number[]): number | null {
  const best = Array<number>(target + 1).fill(Number.POSITIVE_INFINITY);
  best[0] = 0;
  for (let value = 1; value <= target; value++) {
    for (const denomination of denominations) if (denomination <= value) best[value] = Math.min(best[value], best[value - denomination] + 1);
  }
  return Number.isFinite(best[target]) ? best[target] : null;
}
