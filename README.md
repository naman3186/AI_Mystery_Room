# AI Mystery Room

A React/Vite mystery game backed by an Express API, MongoDB, and Gemini. The root npm workspace installs and runs the client and server together.

## Windows setup (PowerShell)

Install Node.js 20 or newer. In PowerShell, use `npm.cmd` commands below; this avoids systems where the `npm.ps1` script is blocked by the execution policy.

From the repository root:

```powershell
node --version
npm.cmd --version
Copy-Item server/.env.example server/.env
notepad server/.env
npm.cmd install
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

In `server/.env`, set `MONGODB_URI` to your MongoDB connection string and `GEMINI_API_KEY` to your Gemini key. Keep these values in `server/.env`; do not put credentials in either `.env.example` file. The client reads `VITE_API_BASE_URL` from `client/.env.example`, defaulting to `http://localhost:5000/api`.

Open <http://localhost:5173>. API health is at <http://localhost:5000/api/health>. `npm.cmd test` runs the server rule tests; `npm.cmd run build` builds the client and syntax-checks the server. Mystery creation needs reachable MongoDB and a valid Gemini key. The server can start in health-only mode without `MONGODB_URI` in development.

## Deployment configuration

For a Vercel client, set `VITE_API_BASE_URL` to the deployed API URL ending in `/api`. On the server host, configure `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL`, and optionally `PORT` and `GEMINI_MODEL`. The client includes the SPA rewrite in `client/vercel.json`.
