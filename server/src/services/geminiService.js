import { GoogleGenAI } from '@google/genai';
import { validateMystery } from '../validators/caseSchemas.js';
import { DIFFICULTY } from '../config/difficulty.js';

function responseSchemaFor(difficulty) {
  const counts = DIFFICULTY[difficulty];
  const object = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
  const string = { type: 'string' };
  return object({
    title: string,
    story: string,
    suspects: { type: 'array', minItems: counts.suspects, maxItems: counts.suspects, items: object({ id: string, name: string, description: string }) },
    clues: { type: 'array', minItems: counts.clues, maxItems: counts.clues, items: object({ id: string, description: string, significance: string }) },
    hints: { type: 'array', minItems: counts.hints, maxItems: counts.hints, items: string },
    solution: object({ culpritId: string, explanation: string, reasoning: string }),
  });
}

export class GeminiServiceError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
    this.status = status;
    this.expose = true;
  }
}

export async function generateMystery({ premise, difficulty }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new GeminiServiceError('GEMINI_NOT_CONFIGURED', 503, 'Mystery generation is not configured. Add GEMINI_API_KEY to server/.env, then restart the API.');
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const counts = DIFFICULTY[difficulty];
  let failure = 'upstream';
  let failureStatus = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        contents: `Create an original, fair-play detective mystery based on this premise: ${premise}\nDifficulty: ${difficulty}. Return a JSON object with exactly these fields and no others: title, story, suspects (exactly ${counts.suspects}, IDs suspect_1...), clues (exactly ${counts.clues}, IDs clue_1..., each with description and private significance), hints (exactly ${counts.hints}, progressively more specific without naming the culprit), and solution {culpritId, explanation, reasoning}. The story and evidence must make the culprit uniquely inferable. Include all required reasoning. Do not put the culprit's identity in the opening story or public suspect descriptions.`,
        config: { responseMimeType: 'application/json', responseJsonSchema: responseSchemaFor(difficulty), temperature: 0.85 },
      });
      let parsed;
      try { parsed = JSON.parse(response.text); }
      catch { failure = 'invalid_json'; continue; }
      try { return validateMystery(parsed, difficulty); }
      catch { failure = 'invalid_content'; }
    } catch (error) {
      failure = 'upstream';
      failureStatus = Number.isInteger(error?.status) ? error.status : null;
      const errorType = failureStatus === null ? 'network_or_client_error' : 'provider_error';
      console.error('Gemini generation request failed', { attempt: attempt + 1, errorType, status: failureStatus });
    }
  }
  if (failure === 'invalid_json' || failure === 'invalid_content') {
    throw new GeminiServiceError('AI_INVALID_RESPONSE', 502, 'Gemini returned a mystery that failed validation. Please try again.');
  }
  if (failureStatus === 404) {
    throw new GeminiServiceError('GEMINI_MODEL_UNAVAILABLE', 502, 'The configured Gemini model is unavailable for content generation. Check GEMINI_MODEL and API access.');
  }
  if (failureStatus === 403) {
    throw new GeminiServiceError('GEMINI_ACCESS_DENIED', 502, 'Gemini denied the request. Check API key permissions and access.');
  }
  if (failureStatus === 429) {
    throw new GeminiServiceError('GEMINI_QUOTA_EXCEEDED', 429, 'Gemini request quota was exceeded. Check the project quota and retry later.');
  }
  if (failureStatus === 503) {
    throw new GeminiServiceError('GEMINI_TEMPORARILY_UNAVAILABLE', 503, 'Gemini is temporarily unavailable. Wait briefly, then try again.');
  }
  if (failureStatus === 400) {
    throw new GeminiServiceError('GEMINI_REQUEST_INVALID', 502, 'Gemini rejected the generation request. Check model configuration and try again.');
  }
  throw new GeminiServiceError('GEMINI_REQUEST_FAILED', 502, 'Gemini could not complete the request. Check API access, model availability, and quota, then try again.');
}
