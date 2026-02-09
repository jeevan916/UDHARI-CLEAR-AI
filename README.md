<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/15WC_yp3bBDWcQmUEp45r8KzCOb7o50Qa

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env` file (copy from `.env.example`) and set:
   - `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `DB_HOST` and `DB_PORT` (optional; defaults to `127.0.0.1:3306`)
   - `API_KEY` (Gemini API key)
3. Create the MySQL schema:
   - `mysql -u <user> -p < database.sql`
4. Run the app:
   `npm run dev`
