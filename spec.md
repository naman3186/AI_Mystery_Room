# AI Mystery Room — Project Specification

**Document:** SPEC.md  
**Project Name:** AI Mystery Room  
**Version:** 1.0  
**Status:** Development Blueprint

---

## 1. Project Overview

### 1.1 Description
AI Mystery Room is an AI-powered web application that allows users to create and solve interactive detective mysteries generated using the Gemini API. Players investigate a case by examining suspects, discovering clues, requesting hints, and identifying the culprit.

### 1.2 Objective
Build, test, and deploy a complete mystery-solving web application with a functional frontend, backend, database, and AI integration.

### 1.3 Problem Statement
Traditional mystery games often offer fixed stories and limited replayability. AI Mystery Room generates mysteries dynamically, providing users with varied investigative experiences and different difficulty levels.

### 1.4 Target Users
- Mystery and detective-fiction enthusiasts.
- Casual gamers seeking interactive experiences.
- Students and users interested in logical reasoning.

### 1.5 Core Principles
- Every mystery must have a logically consistent solution.
- The culprit and solution must remain private until the player submits an accusation.
- All scoring and game-state validation must happen on the backend.
- AI-generated content must be validated before use.
- The application must be responsive and production-ready.

---

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React with Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| HTTP client | Axios |
| Backend | Node.js and Express |
| Database | MongoDB Atlas |
| Database ODM | Mongoose |
| AI integration | Gemini API using `@google/genai` |
| Validation | Zod |
| Configuration | dotenv |
| Frontend hosting | Vercel |
| Backend hosting | Suitable Node.js hosting provider |

Use JavaScript throughout the project unless a technical limitation requires otherwise.

---

## 3. Functional Requirements

### FR-01: Home Page
Display:
- Application name and introduction.
- Brief explanation of how the game works.
- Start Mystery button.
- Responsive navigation and consistent visual design.

Clicking Start Mystery must navigate to the mystery creation page.

### FR-02: Mystery Creation
Allow users to:
- Enter a mystery premise.
- Select Easy, Medium, or Hard difficulty.
- Generate a mystery.

Requirements:
- Validate the premise before submitting.
- Prevent duplicate submissions while generation is in progress.
- Display loading and error states.
- Send the request to the backend.
- Never call Gemini directly from the frontend.

### FR-03: Mystery Generation
The backend must:
1. Validate the request.
2. Request structured mystery content from Gemini.
3. Validate the AI response using Zod.
4. Check the required number of suspects, clues, and hints.
5. Check that all referenced suspects and clues exist.
6. Reject invalid or inconsistent responses.
7. Store the validated case in MongoDB.
8. Return only the information the player is permitted to see.

If generation fails, return a meaningful error without exposing API keys, internal prompts, or sensitive solution data.

### FR-04: Investigation Room
Display:
- Mystery title and story.
- Selected difficulty.
- Suspect cards with descriptions and relevant information.
- Discoverable clues.
- Hint request control.
- Clues discovered and remaining.
- Hints used and remaining.
- Current score.
- Accusation action.
- Progress indicators.

Players must be able to investigate without seeing the correct culprit or hidden solution.

### FR-05: Clue Discovery
When a player discovers a clue:
- Verify that the case exists and is active.
- Verify that the clue belongs to the case.
- Verify that it has not already been discovered.
- Mark it as discovered on the backend.
- Update the score by adding 5 points.
- Return the clue's permitted information and updated progress.

Repeated requests for the same clue must not award additional points.

### FR-06: Hint System
Players may request hints while the case is active.

Rules:
- Easy: 2 hints.
- Medium: 3 hints.
- Hard: 3 hints.
- Each successful hint request costs 10 points.
- A hint must not directly reveal the culprit.
- A hint request must be rejected if no hints remain.
- Each successful request must be recorded by the backend.

The score cannot fall below zero.

### FR-07: Accusation
Allow players to select a suspect and submit an accusation.

The backend must:
1. Verify that the case exists and is active.
2. Validate the selected suspect.
3. Ensure the suspect belongs to the case.
4. Reject duplicate or subsequent accusations.
5. Compare the selected suspect against the stored solution.
6. Calculate the final score.
7. Mark the case as completed.
8. Return the verdict and permitted result information.

The frontend must not determine whether an accusation is correct.

### FR-08: Results
Display:
- Correct or incorrect verdict.
- Actual culprit.
- Explanation of the solution.
- Final score.
- Selected suspect.
- Option to start another mystery.

The solution must only become available after the accusation has been processed successfully.

### FR-09: New Mystery
Allow users to start another mystery without carrying over the previous case's clues, hints, accusation, or score.

---

## 4. Difficulty Configuration

Use the following exact configuration:

| Difficulty | Suspects | Clues | Hints | Correct Accusation |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 points |
| Medium | 4 | 7 | 3 | 150 points |
| Hard | 5 | 9 | 3 | 200 points |

Each discovered clue awards 5 points. Each hint used deducts 10 points.

### Scoring Formula

For a correct accusation:

`Final Score = Base Points + (5 × Unique Clues Discovered) − (10 × Hints Used)`

For an incorrect accusation:

`Final Score = 5 × Unique Clues Discovered − (10 × Hints Used)`

The final score must be clamped to a minimum of zero.

The score must be calculated using server-side data only. The client must never submit its own score or receive permission to overwrite one.

---

## 5. AI Generation Specification

### 5.1 Gemini Responsibilities
Gemini must generate:
- Mystery title.
- Mystery premise and story.
- Suspects and descriptions.
- Clues and their investigative significance.
- Hints ordered from less revealing to more revealing.
- Correct culprit identifier.
- Complete solution explanation.
- Internal reasoning structure sufficient to verify the mystery's consistency.

### 5.2 Structured Output
The backend should request JSON in the following conceptual structure:

```json
{
  "title": "The Clockmaker's Last Hour",
  "story": "The initial mystery narrative...",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Example Suspect",
      "description": "A description visible to the player"
    }
  ],
  "clues": [
    {
      "id": "clue_1",
      "description": "A discoverable piece of evidence",
      "significance": "How the clue supports or eliminates a theory"
    }
  ],
  "hints": [
    "First hint that encourages investigation"
  ],
  "solution": {
    "culpritId": "suspect_1",
    "explanation": "The complete explanation of the crime",
    "reasoning": "How the evidence establishes the solution"
  }
}
```

This is a conceptual schema. Actual generated content must satisfy the selected difficulty's exact counts. The `significance`, `solution`, and `reasoning` fields must remain server-side until the case is completed.

### 5.3 Consistency Requirements
Every generated mystery must:
- Have exactly one intended culprit.
- Include the required number of unique suspects, clues, and hints.
- Use unique identifiers.
- Reference valid suspects.
- Contain clues that support the intended solution.
- Avoid contradictions that make the solution impossible.
- Provide an explanation that accounts for the important evidence.
- Ensure hints assist investigation without revealing the culprit outright.

The backend must reject invalid responses and may retry generation a limited number of times. If retries fail, return an error rather than storing an invalid case.

AI output validation must include both schema validation and application-level consistency checks.

---

## 6. Database Design

### 6.1 Case Model

Create a Mongoose model named `Case`.

Required fields:

| Field | Type | Purpose |
|---|---|---|
| title | String | Mystery title |
| story | String | Initial narrative |
| difficulty | Enum | Easy, Medium, or Hard |
| suspects | Array | Suspect identifiers, names, descriptions |
| clues | Array | Clue identifiers, descriptions, significance |
| hints | Array | Ordered hint content |
| solution | Object | Culprit ID and complete explanation |
| discoveredClueIds | Array | Unique clues discovered |
| hintsUsed | Number | Number of hints consumed |
| accusation | Object or null | Submitted suspect and verdict |
| score | Number | Server-calculated score |
| status | Enum | Active or Completed |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

The schema may include additional fields required for reliable operation.

### 6.2 Data Integrity
- Use MongoDB-generated document identifiers.
- Use unique IDs for suspects and clues within each case.
- Validate all difficulty values.
- Enforce valid state transitions.
- Prevent duplicate clue rewards.
- Prevent repeated hint deductions.
- Prevent multiple final accusations.
- Use atomic database updates or transactions where appropriate to prevent concurrent requests from awarding duplicate points.

### 6.3 Solution Privacy
Never return the complete database document to the frontend.

Use explicit response serializers or DTOs to separate:
- Public case information.
- Player progress.
- Private solution information.

Before completion, omit the culprit ID, solution explanation, clue significance intended only for internal validation, and hidden answer data from all client responses.

---

## 7. Backend API Specification

All endpoints must use the `/api` prefix and return JSON.

### 7.1 Generate Case

**Endpoint:** `POST /api/cases`

Request:

```json
{
  "premise": "A priceless painting disappears during a locked-room exhibition.",
  "difficulty": "Medium"
}
```

Success: `201 Created`

Response:

```json
{
  "success": true,
  "case": {
    "id": "case_id",
    "title": "Mystery Title",
    "story": "Initial story...",
    "difficulty": "Medium",
    "suspects": [],
    "clues": [],
    "progress": {
      "discoveredClueIds": [],
      "hintsUsed": 0,
      "score": 0
    },
    "status": "Active"
  }
}
```

The response must exclude the hidden solution and internal clue significance.

### 7.2 Retrieve Case

**Endpoint:** `GET /api/cases/:id`

Return the permitted public case information and current progress. Include only clues and hints the player is allowed to see.

Do not expose the solution while the case is active.

### 7.3 Discover Clue

**Endpoint:** `POST /api/cases/:id/clues/:clueId/discover`

Request body: none required.

On success, return the discovered clue and updated progress.

Reject invalid clues, completed cases, and invalid state transitions. A repeated discovery must not award points again.

### 7.4 Request Hint

**Endpoint:** `POST /api/cases/:id/hints`

Request body: none required.

Return the next available hint and updated progress. Reject the request if the case is completed or the hint limit has been reached.

### 7.5 Submit Accusation

**Endpoint:** `POST /api/cases/:id/accuse`

Request:

```json
{
  "suspectId": "suspect_2"
}
```

Success response:

```json
{
  "success": true,
  "result": {
    "correct": false,
    "selectedSuspectId": "suspect_2",
    "culpritId": "suspect_1",
    "explanation": "The complete solution...",
    "score": 25,
    "status": "Completed"
  }
}
```

The example is illustrative; actual scores must follow the scoring formula. This endpoint is the only point at which the solution is intentionally revealed.

### 7.6 Retrieve Result

**Endpoint:** `GET /api/cases/:id/result`

- Return the final result only when the case is completed.
- Return a suitable error if the case is active.
- Do not permit this endpoint to bypass the accusation requirement.

### 7.7 Error Format

Use a consistent response structure:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The supplied request is invalid."
  }
}
```

Use appropriate HTTP status codes:
- `400` — Invalid input or invalid game-state transition.
- `404` — Case or resource not found.
- `409` — Conflicting action or already completed case.
- `429` — Rate limit exceeded.
- `500` — Unexpected server error.
- `502` — Invalid or failed AI response.

Never expose stack traces, database credentials, API keys, or internal prompts in production responses.

---

## 8. Frontend Page Specifications

### 8.1 Home
- Application branding.
- Short project introduction.
- How-to-play section.
- Start Mystery button.
- Responsive layout.

### 8.2 Create Mystery
- Premise text area.
- Difficulty selection.
- Generate button.
- Input validation.
- Loading indicator and generation error message.

### 8.3 Investigation Room
- Case title and story.
- Suspect cards.
- Clue discovery interface.
- Discovered clue indicators.
- Hint request control.
- Score and progress.
- Accusation button.
- Loading, empty, and error states.

### 8.4 Accusation
- List of suspects.
- Single suspect selection.
- Confirmation before submission.
- Submission loading state.
- Error feedback for invalid selections or failed requests.

### 8.5 Results
- Correct or incorrect verdict.
- Culprit identity.
- Explanation of the solution.
- Final score.
- Play Again button.

### 8.6 UI and Accessibility
- Use Tailwind CSS for styling.
- Maintain a consistent detective-themed visual identity.
- Make layouts responsive across mobile, tablet, and desktop.
- Use readable typography and adequate contrast.
- Provide accessible labels and keyboard navigation.
- Clearly communicate loading, success, and error states.
- Prevent accidental duplicate actions while requests are pending.
- Use React Router for navigation and Axios for API calls.

The visual design may be created using Stitch AI, but the implemented screens must follow the functional requirements defined in this document.

---

## 9. Security Requirements

- Keep `GEMINI_API_KEY` exclusively on the backend.
- Keep MongoDB credentials exclusively on the backend.
- Store secrets in environment variables.
- Commit an `.env.example` file containing placeholders, never actual credentials.
- Add `.env` files to `.gitignore`.
- Validate every incoming request using Zod.
- Restrict CORS to configured frontend origins.
- Add request size limits and rate limiting to expensive AI endpoints.
- Sanitize and safely render user input and AI-generated content.
- Never trust client-supplied scores, clue progress, hint counts, verdicts, or culprit IDs.
- Never expose solution data through API responses, browser-visible configuration, or client-side state before accusation.
- Handle database failures and AI errors safely.

For the initial version, users may play without accounts. Case IDs should be treated as unguessable identifiers, and API access should be rate-limited. If the application is later made public, add suitable session ownership or authentication to prevent unauthorized access to another player's case.

---

## 10. Project Structure

Use the following structure:

```text
ai-mystery-room/
├── SPEC.md
├── .gitignore
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── CreateMystery.jsx
│   │   │   ├── InvestigationRoom.jsx
│   │   │   ├── Accusation.jsx
│   │   │   └── Results.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── server/
    ├── src/
    │   ├── config/
    │   │   └── db.js
    │   ├── models/
    │   │   └── Case.js
    │   ├── routes/
    │   │   └── caseRoutes.js
    │   ├── controllers/
    │   ├── services/
    │   │   └── geminiService.js
    │   ├── validators/
    │   ├── middleware/
    │   ├── app.js
    │   └── server.js
    ├── .env.example
    └── package.json
```

Adjust the structure if necessary, but preserve clear separation between routes, business logic, validation, database models, and AI integration.

---

## 11. Environment Configuration

Backend `.env.example`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

Frontend `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Use actual secret values only in local, untracked `.env` files or hosting-provider environment settings.

---

## 12. Testing Requirements

Test the following scenarios:

1. Generate mysteries at all three difficulty levels.
2. Reject missing or invalid premises.
3. Verify exact suspect, clue, and hint counts.
4. Handle malformed Gemini responses.
5. Discover a clue and award exactly 5 points.
6. Prevent duplicate clue rewards.
7. Request hints and deduct exactly 10 points per successful request.
8. Reject hint requests beyond the limit.
9. Ensure scores never fall below zero.
10. Verify correct and incorrect accusations.
11. Prevent repeat accusations and actions on completed cases.
12. Reject results requests before accusation.
13. Confirm that active-case responses never contain the solution.
14. Verify that the backend calculates all scores independently.
15. Test API and database failures.
16. Test responsive layouts and navigation.
17. Verify the complete workflow on the deployed website.

Use automated tests for scoring, validation, privacy, and game-state transitions where practical.

---

## 13. Deployment Requirements

### Frontend
- Deploy the React/Vite application to Vercel.
- Configure `VITE_API_BASE_URL` to the deployed backend API.
- Ensure client-side routes work after refresh.

### Backend
- Deploy Express to a Node.js-compatible hosting provider.
- Configure production environment variables.
- Restrict CORS to the production frontend domain.
- Ensure the server starts and connects to MongoDB successfully.

### Database
- Use MongoDB Atlas.
- Configure database access securely.
- Use appropriate database network-access rules and credentials.

### Production Verification
Run the complete workflow against the live website:
1. Open the home page.
2. Create a mystery.
3. Investigate and discover clues.
4. Request a hint.
5. Submit an accusation.
6. Review the verdict and score.
7. Start another mystery.

The application is not considered complete until this entire workflow succeeds in production.

---

## 14. Acceptance Criteria

The project is complete only when:

- [ ] All five required pages are implemented.
- [ ] Mysteries can be generated at Easy, Medium, and Hard difficulty.
- [ ] Generated cases satisfy the defined content counts.
- [ ] Players can inspect suspects, discover clues, and request hints.
- [ ] Clue and hint actions update server-side progress correctly.
- [ ] Players can submit an accusation.
- [ ] The correct culprit and explanation remain hidden until accusation.
- [ ] Scores are calculated and validated on the backend.
- [ ] The results page displays the verdict, culprit, explanation, and final score.
- [ ] Invalid AI output and API failures are handled gracefully.
- [ ] Secrets are not exposed in frontend code or GitHub.
- [ ] The application is deployed and works on its live website.

---

## 15. Implementation Plan

Build the application in the following order:

**Phase 1 — Specification and Setup**
- Save this document as `SPEC.md`.
- Create the client and server applications.
- Configure environment variables and Git.

**Phase 2 — Backend Foundation**
- Configure Express and MongoDB.
- Create the Case model.
- Implement request validation and error handling.

**Phase 3 — AI Integration**
- Integrate Gemini.
- Generate structured mystery data.
- Validate difficulty counts and solution consistency.
- Keep the solution private.

**Phase 4 — Game APIs**
- Implement case generation and retrieval.
- Implement clue discovery and hints.
- Implement accusations, scoring, and results.

**Phase 5 — Frontend**
- Implement the five required pages.
- Connect the frontend to the backend.
- Add responsive styling, loading states, and error handling.

**Phase 6 — Testing and Deployment**
- Test every acceptance criterion.
- Configure MongoDB Atlas and hosting environment variables.
- Deploy the frontend and backend.
- Verify the entire live workflow.

Complete and test each phase before moving to the next.

---

## 16. Instructions for AI Coding Assistants

Treat this `SPEC.md` as the authoritative project specification.

1. Read the entire document before making changes.
2. Do not skip requirements or silently change scoring, difficulty counts, endpoints, or security rules.
3. Inspect the existing codebase before creating or modifying files.
4. Implement the project incrementally, following the implementation plan.
5. Explain the purpose of each phase briefly and list the files being changed.
6. Install only necessary dependencies.
7. Run the available checks and fix errors before proceeding.
8. Never hardcode API keys or expose hidden solutions.
9. Do not mark a feature complete unless it has been implemented and verified.
10. If a requirement is ambiguous or technically incompatible with the current codebase, explain the issue before making a significant design change.
11. Keep the implementation simple enough for a student developer to understand and maintain.
12. Update the specification only when an intentional requirement change is approved.

**Final deliverable:** A fully functional, tested, secure, responsive, and deployed AI Mystery Room web application that satisfies the acceptance criteria in this document.
