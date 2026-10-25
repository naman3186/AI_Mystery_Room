export const DIFFICULTY = Object.freeze({
  Easy: { suspects: 3, clues: 5, hints: 2, bonus: 100 },
  Medium: { suspects: 4, clues: 7, hints: 3, bonus: 150 },
  Hard: { suspects: 5, clues: 9, hints: 3, bonus: 200 },
});

export function finalScore({ difficulty, discovered = 0, hintsUsed = 0, correct }) {
  const base = correct ? DIFFICULTY[difficulty]?.bonus ?? 0 : 0;
  return Math.max(0, base + discovered * 5 - hintsUsed * 10);
}
