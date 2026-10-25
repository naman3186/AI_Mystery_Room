# Build progress

## Latest verification

- `server/.env` exists. A secret-safe dotenv check confirmed that `MONGODB_URI` and `GEMINI_API_KEY` are present in that file and match the variables loaded by dotenv. No values were printed. This file was not modified.
- MongoDB connection: **connected**. The separate Mongoose probe succeeded; the backend also began listening only after its database connection completed.
- Gemini connectivity: **connected**. The models-list request succeeded.
- Model diagnosis: `gemini-2.5-flash` returned 404 for generation with this key, despite appearing in the list. The official docs say access to the 2.5 models is limited and recommend newer models for new projects. The 3.8 Flash generation endpoint returned 503 during this check. The default is now `gemini-3.5-flash-lite`, which the key supports and which completed mystery generation. It has free-tier token pricing per Google's pricing page.
- Structured JSON output now includes a response schema with exact difficulty counts. Validation diagnostics log only schema paths/codes or counts; no generated text, API keys, or database values are logged.
- Actual local HTTP API flow passed: create Easy case; confirmed 3 suspects/5 clues and no solution/significance in the active response; confirmed result access is blocked before accusation; discovered three clues (+15), repeated one without extra reward, used one hint (-10), accused a suspect, and retrieved the result. Final score was 5 for an incorrect accusation, matching the server formula. Culprit/result appeared only after accusation.
- Backend and frontend scripts started on temporary ports because 5000 and 5173 were already occupied. The API health endpoint and Vite page both returned HTTP 200. The browser UI could not be inspected: Computer Use could not establish the browser URL, so the game flow was exercised over the actual API rather than by clicking through the page.
- `npm.cmd test`: 8 passed, 0 failed. `npm.cmd run check --workspace=server`: passed. `npm.cmd run build`: passed.

## Remaining limits

- The browser UI was not manually exercised. The frontend page was served, and its configured API base was overridden to the tested backend port for this run.
- An older Node process already occupied port 5000 and another process occupied 5173; they were left untouched. Our verification processes were stopped afterward.
- Cases are not bound to player sessions, consistent with the current no-account specification. No deployment was performed.

## Next exact action

To verify the browser flow locally, run these PowerShell commands from the repository root and open the Vite URL it prints:

```powershell
$env:PORT='5001'
$env:VITE_API_BASE_URL='http://localhost:5001/api'
npm.cmd run dev
```

## UI review (2026-10-26)

- Fixed Results headings to render actual line breaks instead of literal JSX tags.
- Added accessible progressbar values for discovered clues, visible keyboard focus, reduced-motion handling, and 320px mobile layout adjustments. Existing loading announcements and home-page section navigation are also accessible and functional.
- Reviewed the five route components and their loading, error/empty, interaction, and success/result states in source. Browser-based visual QA was not performed in this run.
- Verification after UI changes: `npm.cmd test` passed (8/8). `npm.cmd run build` passed, including client Vite production build and server syntax check. Sandboxed build initially failed when esbuild tried to read a parent directory; rerunning the requested build with approved elevated access passed.
- No backend logic, environment files, deployment settings, or paid services were changed.
## Sherlock-inspired casebook redesign (2026-10-26)

- Reworked the React UI and styles across Home, Create, Investigation, Accusation, and Results with parchment surfaces, editorial serif typography, ink-blue text, forest green, burgundy, brass details, newspaper/case-file artwork, dossier cards, and paper-like transitions.
- Added a casebook dispatch on Home, case-ordered discovery timeline, selectable two-clue connection pins, keyboard-aware accusation review, score breakdown, and accessible clue progress. Existing create/discover/hint/accuse/result API calls and backend rules remain in place.
- Browser QA: opened the local Vite preview in Chrome and reviewed Home and Create at the available 742px-wide browser viewport; adjusted the hero to stack before its paper notes collide. Other route layouts were verified from source and the production compilation, not through a live case run.
- `npm.cmd test`: passed (8/8). `npm.cmd run build`: passed (client Vite production build and server syntax checks). Vite needed elevated access because the sandbox denied esbuild's read of a parent directory. The local preview on port 5174 was stopped after review.
- No server code, game rules, API contracts, database configuration, environment files, paid services, or deployment settings were changed. No mystery was created during browser QA.