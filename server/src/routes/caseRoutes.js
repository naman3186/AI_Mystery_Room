import { Router } from 'express';
import { generationRequest, accusationRequest } from '../validators/caseSchemas.js';
import * as cases from '../services/caseService.js';
import { ApiError } from '../services/caseService.js';

const router = Router();
function validate(schema, req) { const parsed = schema.safeParse(req.body); if (!parsed.success) throw new ApiError(400, 'INVALID_REQUEST', parsed.error.issues[0]?.message || 'The supplied request is invalid.'); return parsed.data; }
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
router.post('/', wrap(async (req, res) => res.status(201).json({ success: true, case: await cases.createCase(validate(generationRequest, req)) })));
router.get('/:id', wrap(async (req, res) => res.json({ success: true, case: await cases.getCase(req.params.id) })));
router.post('/:id/clues/:clueId/discover', wrap(async (req, res) => res.json({ success: true, ...(await cases.discoverClue(req.params.id, req.params.clueId)) })));
router.post('/:id/hints', wrap(async (req, res) => res.json({ success: true, ...(await cases.requestHint(req.params.id)) })));
router.post('/:id/accuse', wrap(async (req, res) => res.json({ success: true, result: await cases.accuse(req.params.id, validate(accusationRequest, req).suspectId) })));
router.get('/:id/result', wrap(async (req, res) => res.json({ success: true, result: await cases.getResult(req.params.id) })));
export default router;
