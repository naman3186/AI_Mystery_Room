import { z } from 'zod';
import { DIFFICULTY } from '../config/difficulty.js';

const text = z.string().trim().min(2).max(1800);
const uniqueIds = (items) => new Set(items.map((item) => item.id)).size === items.length;
export const generationRequest = z.object({
  premise: z.string().trim().min(12, 'Premise must be at least 12 characters.').max(600),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
}).strict();
export const accusationRequest = z.object({ suspectId: z.string().regex(/^suspect_[a-zA-Z0-9_-]+$/) }).strict();

export function validateMystery(data, difficulty) {
  const suspect = z.object({ id: z.string().min(1), name: text, description: text });
  const clue = z.object({ id: z.string().min(1), description: text, significance: text });
  const schema = z.object({
    title: text, story: z.string().trim().min(40).max(5000),
    suspects: z.array(suspect), clues: z.array(clue), hints: z.array(text),
    solution: z.object({ culpritId: z.string().min(1), explanation: z.string().trim().min(30).max(4000), reasoning: z.string().trim().min(30).max(5000) }),
  }).strict();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error('Gemini output failed schema validation', { issues: parsed.error.issues.map(({ path, code }) => ({ path: path.join('.'), code })) });
    throw new Error('The generated mystery did not match the required format.');
  }
  const mystery = parsed.data;
  const required = DIFFICULTY[difficulty];
  if (mystery.suspects.length !== required.suspects || mystery.clues.length !== required.clues || mystery.hints.length !== required.hints) {
    console.error('Gemini output failed count validation', { expected: required, actual: { suspects: mystery.suspects.length, clues: mystery.clues.length, hints: mystery.hints.length } });
    throw new Error('The generated mystery has incorrect content counts.');
  }
  if (!uniqueIds(mystery.suspects) || !uniqueIds(mystery.clues)) {
    console.error('Gemini output failed identifier validation', { suspectsUnique: uniqueIds(mystery.suspects), cluesUnique: uniqueIds(mystery.clues) });
    throw new Error('The generated mystery contains duplicate identifiers.');
  }
  if (!mystery.suspects.some(({ id }) => id === mystery.solution.culpritId)) {
    console.error('Gemini output references an unknown culprit', { culpritReferenceValid: false });
    throw new Error('The solution references an unknown suspect.');
  }
  const culpritName = mystery.suspects.find(({ id }) => id === mystery.solution.culpritId).name.toLocaleLowerCase();
  if (mystery.hints.some((hint) => hint.toLocaleLowerCase().includes(culpritName) || hint.toLocaleLowerCase().includes(mystery.solution.culpritId.toLocaleLowerCase()))) {
    console.error('Gemini output failed hint privacy validation', { hintRevealsCulprit: true });
    throw new Error('A hint reveals the culprit directly.');
  }
  return mystery;
}
