import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { createCase } from '../src/services/caseService.js';

test('case API explains when MongoDB is not connected without exposing configuration', async (t) => {
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/cases`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ premise: 'A locked archive was opened from the inside.', difficulty: 'Easy' }),
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error.code, 'DATABASE_UNAVAILABLE');
  assert.match(body.error.message, /MONGODB_URI.*server\/\.env/i);
  assert.equal(JSON.stringify(body).includes('mongodb+srv://'), false);
});

test('case service reports missing Gemini configuration safely', async () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(
      createCase({ premise: 'A locked archive was opened from the inside.', difficulty: 'Easy' }),
      (error) => error.status === 503 && error.code === 'GEMINI_NOT_CONFIGURED' && /GEMINI_API_KEY.*server\/\.env/i.test(error.message),
    );
  } finally {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  }
});
