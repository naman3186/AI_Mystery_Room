import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY, finalScore } from '../src/config/difficulty.js';
import { validateMystery } from '../src/validators/caseSchemas.js';
import { publicCase, resultOf, ApiError } from '../src/services/caseService.js';

function sample(difficulty) {
  const config = DIFFICULTY[difficulty];
  return { title: 'The Gallery at Dusk', story: 'A detailed opening account of a stolen painting during a private evening viewing.',
    suspects: Array.from({ length: config.suspects }, (_, i) => ({ id: `suspect_${i + 1}`, name: `Person ${i + 1}`, description: 'A measured account of their role in the gallery.' })),
    clues: Array.from({ length: config.clues }, (_, i) => ({ id: `clue_${i + 1}`, description: `Evidence ${i + 1} found in the gallery.`, significance: 'It places a suspect near the scene.' })),
    hints: Array.from({ length: config.hints }, (_, i) => `Consider evidence tier ${i + 1}.`), solution: { culpritId: 'suspect_1', explanation: 'The timing and access records reveal the culprit in the gallery.', reasoning: 'A detailed chain of evidence connects access, timing, and the missing artwork.' } };
}
test('difficulty configuration exactly matches the specification', () => {
  assert.deepEqual(DIFFICULTY, { Easy: { suspects: 3, clues: 5, hints: 2, bonus: 100 }, Medium: { suspects: 4, clues: 7, hints: 3, bonus: 150 }, Hard: { suspects: 5, clues: 9, hints: 3, bonus: 200 } });
});
test('AI schema accepts required counts at every difficulty', () => { for (const level of Object.keys(DIFFICULTY)) assert.equal(validateMystery(sample(level), level).clues.length, DIFFICULTY[level].clues); });
test('AI schema rejects wrong counts and unknown culprit references', () => {
  const badCount = sample('Easy'); badCount.clues.pop(); assert.throws(() => validateMystery(badCount, 'Easy'));
  const badId = sample('Easy'); badId.solution.culpritId = 'ghost'; assert.throws(() => validateMystery(badId, 'Easy'));
  const answerLeak = sample('Easy'); answerLeak.hints[0] = 'Person 1 stole the painting.'; assert.throws(() => validateMystery(answerLeak, 'Easy'));
});
test('scores follow server rules and floor at zero', () => {
  assert.equal(finalScore({ difficulty: 'Hard', discovered: 4, hintsUsed: 1, correct: true }), 210);
  assert.equal(finalScore({ difficulty: 'Easy', discovered: 1, hintsUsed: 2, correct: false }), 0);
  assert.equal(finalScore({ difficulty: 'Medium', discovered: 7, hintsUsed: 0, correct: false }), 35);
});
test('active case serializer hides solution, significance, and hint content', () => {
  const doc = { _id: 'abc', title: 'A Case', story: 'Story', difficulty: 'Easy', suspects: sample('Easy').suspects, clues: sample('Easy').clues, hints: ['private hint'], solution: { culpritId: 'suspect_1' }, discoveredClueIds: [], hintsUsed: 0, score: 0, status: 'Active' };
  const output = JSON.stringify(publicCase(doc));
  assert.equal(output.includes('culpritId'), false); assert.equal(output.includes('significance'), false); assert.equal(output.includes('private hint'), false);
});
test('result serializer refuses active cases', () => { assert.throws(() => resultOf({ status: 'Active' }), ApiError); });
