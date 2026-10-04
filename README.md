# AI Workshop Referral Engine
A growth plan and a working referral app to get **500 final-year engineering students** to register for a free workshop, *"Build Your First AI Project in 60 Minutes"*, with a **₹2,000 budget in 7 days**. Built for the NxtWave Growth Intern challenge.

- `GROWTH_PLAN.md`: the 2-page plan (target students, 3 channels, how the 500 adds up, budget, day-by-day targets)
- `SURVEY.md`: a student survey that tests the plan's assumptions with real data
- `asset/`: the working asset (static site, plus a serverless API in `asset/api/` that stores registrations in an Upstash Redis database)

## What the app does
- **Registration page:** records where each sign-up came from (ambassador link, WhatsApp, a friend's invite and so on)
- **Personal invite page:** each student gets a unique link, a one-tap WhatsApp or LinkedIn share and rewards for bringing friends
- **College Challenge leaderboard:** colleges compete on how many students they bring
- **Organiser dashboard:** sign-ups against the daily plan, a split by channel, the viral ratio and CSV export
- **Campaign Simulator:** runs the 7-day plan as a live model (every dot is one student, lines show who invited whom). Sliders change each assumption, presets compare "My plan", "Pessimistic" and "No referral loop", and it shows which change would add the most registrations.

## Run locally
```
node dev-server.js
```
Open http://localhost:5173. Locally it uses a temporary in-memory database (admin key `local-admin`) that resets when the server stops.

- Registration page: `/`
- A student's invite page: `/#/me/<CODE>`
- Referral link: `/?ref=<CODE>`. Ambassador link: `/?src=amb_ravi`
- Leaderboard: `/#/leaderboard`
- Campaign Simulator: `/#/simulator`
- Organiser dashboard: `/#/admin`

## Deploy on Vercel (free)
1. **Import:** Vercel → Add New → Project → import this repo. Set **Framework Preset** to `Other` and **Root Directory** to `asset`, then deploy.
2. **Database:** in the Vercel project, open **Storage → Create Database → Upstash for Redis** (free plan) and **connect** it to the project. Vercel adds the connection details (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) automatically.
3. **Admin password:** go to **Settings → Environment Variables** and add `ADMIN_KEY` = a secret of your choice. This password opens `/#/admin`.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the new settings take effect.
5. **Test:** register once, open your invite link in an incognito window, register a second user and confirm the first user's invite count goes up.
