import Case from '../models/Case.js';
import { DIFFICULTY } from '../config/difficulty.js';
import { generateMystery, GeminiServiceError } from './geminiService.js';

export class ApiError extends Error { constructor(status, code, message) { super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.expose = true; } }
export const progressOf = (record) => ({ discoveredClueIds: record.discoveredClueIds, hintsUsed: record.hintsUsed, hintsRemaining: DIFFICULTY[record.difficulty].hints - record.hintsUsed, score: record.score });
export function publicCase(record) {
  return { id: String(record._id), title: record.title, story: record.story, difficulty: record.difficulty,
    suspects: record.suspects.map(({ id, name, description }) => ({ id, name, description })),
    clues: record.clues.map(({ id, description }) => {
      const discovered = record.discoveredClueIds.includes(id);
      return { id, ...(discovered ? { description } : {}), discovered };
    }),
    progress: progressOf(record), status: record.status };
}
export function resultOf(record) {
  if (record.status !== 'Completed' || !record.accusation) throw new ApiError(400, 'RESULT_NOT_READY', 'Submit an accusation before viewing the result.');
  return { correct: record.accusation.correct, selectedSuspectId: record.accusation.suspectId, culpritId: record.solution.culpritId, culpritName: record.suspects.find((s) => s.id === record.solution.culpritId)?.name, explanation: record.solution.explanation, reasoning: record.solution.reasoning, score: record.score, status: record.status };
}
async function load(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new ApiError(404, 'CASE_NOT_FOUND', 'That case could not be found.');
  const record = await Case.findById(id);
  if (!record) throw new ApiError(404, 'CASE_NOT_FOUND', 'That case could not be found.');
  return record;
}
function active(record) { if (record.status !== 'Active') throw new ApiError(409, 'CASE_COMPLETED', 'This case is already complete.'); }
export async function createCase({ premise, difficulty }) {
  let mystery;
  try { mystery = await generateMystery({ premise, difficulty }); }
  catch (error) {
    if (error instanceof GeminiServiceError) throw new ApiError(error.status, error.code, error.message);
    throw new ApiError(502, 'AI_GENERATION_FAILED', 'Mystery generation failed. Check the server configuration, then try again.');
  }
  const record = await Case.create({ ...mystery, difficulty });
  return publicCase(record);
}
export async function getCase(id) { return publicCase(await load(id)); }
export async function discoverClue(id, clueId) {
  let record = await load(id); active(record);
  const clue = record.clues.find((entry) => entry.id === clueId);
  if (!clue) throw new ApiError(404, 'CLUE_NOT_FOUND', 'That clue is not part of this case.');
  const result = await Case.updateOne({ _id: id, status: 'Active', discoveredClueIds: { $ne: clueId } }, { $addToSet: { discoveredClueIds: clueId }, $inc: { score: 5 } });
  if (result.modifiedCount) record = await load(id);
  else record = await load(id);
  if (record.status !== 'Active') throw new ApiError(409, 'CASE_COMPLETED', 'This case is already complete.');
  return { clue: { id: clue.id, description: clue.description }, progress: progressOf(record) };
}
export async function requestHint(id) {
  let record = await load(id); active(record);
  const max = DIFFICULTY[record.difficulty].hints;
  const update = await Case.findOneAndUpdate({ _id: id, status: 'Active', hintsUsed: { $lt: max } }, [{ $set: { hintsUsed: { $add: ['$hintsUsed', 1] }, score: { $max: [0, { $subtract: ['$score', 10] }] } } }], { new: true });
  if (!update) { record = await load(id); active(record); throw new ApiError(400, 'NO_HINTS_REMAINING', 'You have used all available hints.'); }
  return { hint: update.hints[update.hintsUsed - 1], progress: progressOf(update) };
}
export async function accuse(id, suspectId) {
  const record = await load(id); active(record);
  if (!record.suspects.some((s) => s.id === suspectId)) throw new ApiError(400, 'INVALID_SUSPECT', 'Choose a suspect from this case.');
  const correct = suspectId === record.solution.culpritId;
  const bonus = correct ? DIFFICULTY[record.difficulty].bonus : 0;
  const updated = await Case.findOneAndUpdate({ _id: id, status: 'Active', accusation: { $exists: false } }, [{ $set: { status: 'Completed', accusation: { suspectId, correct }, score: { $max: [0, { $add: [bonus, { $multiply: [5, { $size: '$discoveredClueIds' }] }, { $multiply: [-10, '$hintsUsed'] }] }] } } }], { new: true });
  if (!updated) throw new ApiError(409, 'CASE_COMPLETED', 'An accusation has already been submitted.');
  return resultOf(updated);
}
export async function getResult(id) { return resultOf(await load(id)); }
