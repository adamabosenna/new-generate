# Deploying to Railway

Quick steps to run this Discord bot on Railway:

1. Remove any committed secrets (IMPORTANT):
   - Revoke and rotate your bot token in the Discord Developer Portal now — the token in your repo is exposed.
   - Remove the `.env` file from git history and working tree: `git rm --cached .env` and commit the change.
2. Add the repository to Railway and create a new project.
3. In Railway project settings, add environment variables:
   - `TOKEN` (your bot token)
   - `CLIENT_ID` and `CLIENT_SECRET` (if needed for other flows)
   - `GUILD_ID` (optional, for instant command testing in a specific server)
   - Optionally `PORT` (Railway sets it automatically normally)
4. Railway will run `npm start` by default using the `start` script in `package.json`.
5. Confirm the health endpoint is reachable: `https://<your-service>.railway.app/health` should return `OK`.

Command registration notes (important):
- The bot tries to auto-register slash commands at startup. To make commands appear instantly in your server for testing, set `GUILD_ID` to your server id; the bot will register commands to that guild and they'll be immediately available.
- If you prefer global registration (no `GUILD_ID`), note that global commands can take up to one hour to propagate.
- If auto-registration fails or you want to re-run it, you can run `npm run register-commands` in Railway's console (after setting `TOKEN` and `CLIENT_ID`).

Notes & Security
- Do NOT commit `.env` to source control. Use Railway's environment variables feature for secrets.
- Rotate the exposed token immediately and update the token in Railway secret.
- The project specifies a Node engine (>=18) in `package.json` so Railway will use a compatible Node version.

If you want, I can prepare a minimal GitHub Action or a script to remove `.env` from the repository history safely.
