# HideSearch

HideSearch is a minimal browser-like frontend with tabs, navigation, bookmarks, themes, settings, and games. The backend adds an Express server and a server-side Google sign-in foundation without replacing the existing iframe browser behavior.

## Requirements

- Node.js 20 or newer
- A Google Cloud OAuth 2.0 Web application client for Google sign-in

## Install

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` with local values:

```dotenv
PORT=3000
BASE_URL=http://localhost:3000
SESSION_SECRET=use-a-long-random-value
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NODE_ENV=development
```

`express` serves the HTTP API, `express-session` manages the signed session cookie, `dotenv` loads local configuration, and `googleapis` performs the server-side Google OAuth code exchange and ID-token verification. TypeScript, `tsx`, and the `@types/*` packages support development and compilation.

## Run

```powershell
npm run dev
```

The development server serves the browser at `http://localhost:3000/`.

```powershell
npm run build
npm start
```

`npm run build` compiles `backend/src` into `dist`. `npm start` runs the compiled JavaScript. `npm test` currently runs the TypeScript build as the basic automated check.

## API

- `GET /api/health` reports server status and whether Google configuration is present.
- `GET /api/auth/google` starts Google sign-in.
- `GET /api/auth/google/callback` validates the OAuth state, exchanges the code, verifies the Google ID token, and stores only a safe profile in the session.
- `GET /api/auth/me` returns the current safe user profile or `{ "authenticated": false }`.
- `POST /api/auth/logout` destroys the current session.

The frontend login control calls `/api/auth/me` on startup. It redirects to Google when signed out and logs out through the API when signed in. Sessions use an HTTP-only, same-site cookie; no Google secret or token is placed in frontend JavaScript or localStorage.

## Google setup

1. Create or select a project in Google Cloud Console.
2. Configure the OAuth consent screen.
3. Create an OAuth client with application type **Web application**.
4. Add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI.
5. Put the client ID and secret in `.env`, never in source control.

The implementation follows Google's current server-side OAuth guidance and requests only `openid profile email` for authentication. It does not request Google API access or store refresh tokens. For production, use HTTPS, a strong secret, an appropriate persistent session store instead of the default in-memory store, and a production `BASE_URL`.

## Frontend and iframe limitations

The browser frontend continues to navigate URLs in iframes and preserves its raw GitHub HTML handling. Many sites cannot be embedded because of `X-Frame-Options`, Content Security Policy `frame-ancestors`, authentication policies, or browser same-origin restrictions. Express cannot make every site embeddable. HideSearch does not include an open proxy; adding one would require strict destination and response controls to avoid SSRF and abuse risks.

## Git and Cursor

`.env`, `node_modules`, and `dist` are ignored. The same repository can be opened in Cursor with:

```powershell
cursor .
```

No VS Code-specific extension is required.
