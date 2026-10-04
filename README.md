# AI Workshop Referral Engine
A growth plan and a working referral app to get **500 final-year engineering students** to register for a free workshop, *"Build Your First AI Project in 60 Minutes"*, with a **₹2,000 budget in 7 days**. Built for the NxtWave Growth Intern challenge.

- `GROWTH_PLAN.md`: the 2-page plan (target students, 3 channels, how the 500 adds up, budget, day-by-day targets)
- `SURVEY.md`: a student survey that tests the plan's assumptions with real data
- `asset/`: the working asset (static site, plus a serverless API in `asset/api/` that stores registrations in MongoDB)

## What the app does
- **Registration page:** records where each sign-up came from (ambassador link, WhatsApp, a friend's invite and so on)
- **Personal invite page:** each student gets a unique link, a one-tap WhatsApp or LinkedIn share and rewards for bringing friends
- **College Challenge leaderboard:** colleges compete on how many students they bring
- **Organiser dashboard:** sign-ups against the daily plan, a split by channel, the viral ratio and CSV export
- **Campus Identity A/B test:** standard page vs "[College] AI Project Sprint". The dashboard shows the results and a 95% confidence verdict.
- **Project Curiosity:** four project cards before sign-up. The dashboard shows click rate and sign-ups per project.
- **Instant Reward A/B test:** basic confirmation vs an AI Project Passport (recommendation, prep checklist, downloadable passport). The dashboard compares return rates.
- **Squad Challenge (live for everyone):** each student builds a 3-person AI squad with a shareable card. Friends who join through a squad member's link fill that squad.
- **Sharing:** WhatsApp, Discord (copies the message and opens Discord) and LinkedIn. Set `DISCORD_INVITE` in `asset/config.js` to show a "Join the workshop Discord" button.
- **Campaign Simulator:** runs the 7-day plan as a live model (every dot is one student, lines show who invited whom). Sliders change each assumption, presets compare "My plan", "Pessimistic" and "No referral loop", and it shows which change would add the most registrations.

## Run locally
1. `cd asset && npm install`
2. Create `.env.local` in the repo root (it's git-ignored):
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/
   ADMIN_KEY=choose-a-secret
   ```
3. `node dev-server.js`, then open http://localhost:5173

- Registration page: `/`
- A student's invite page: `/#/me/<CODE>`
- Referral link: `/?ref=<CODE>`. Ambassador link: `/?src=amb_ravi&college=amrita-coimbatore` (the `college` part enters visitors into the Campus Identity test)
- Preview a test version without it being counted: add `?v_campus=B` or `?v_passport=B` (use `=off` to stop previewing)
- Leaderboard: `/#/leaderboard`
- Campaign Simulator: `/#/simulator`
- Organiser dashboard: `/#/admin`

## Deploy on Vercel (free)
1. **Import:** Vercel → Add New → Project → import this repo. Set **Framework Preset** to `Other` and **Root Directory** to `asset`, then deploy.
2. **Database:** create a free **MongoDB Atlas** cluster (M0) and connect it in one of two ways:
   - Vercel **Integrations → MongoDB Atlas → Add**, which adds `MONGODB_URI` to the project automatically, **or**
   - in Atlas, click **Connect → Drivers**, copy the connection string, and add it in Vercel → **Settings → Environment Variables** as `MONGODB_URI`. In Atlas → **Network Access**, allow `0.0.0.0/0`, because Vercel's servers don't have fixed IP addresses.
3. **Admin password:** add `ADMIN_KEY` = a secret of your choice in the same Environment Variables page. It opens `/#/admin`.
4. **Redeploy** (Deployments → ⋯ → Redeploy).
5. **Test:** register once, open your invite link in an incognito window, register a second user and confirm the first user's invite count goes up. The data appears in Atlas under the `ai_workshop` database, in the `registrations` collection.
