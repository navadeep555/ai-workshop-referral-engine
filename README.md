# AI Workshop Referral Engine
A growth plan and a working referral app to get **500 final-year engineering students** to register for a free workshop, *"Build Your First AI Project in 60 Minutes"*, with a **₹2,000 budget in 7 days**. Built for the NxtWave Growth Intern challenge.

- `GROWTH_PLAN.md`: the 2-page plan (target students, 3 channels, how the 500 adds up, budget, day-by-day targets)
- `SURVEY.md`: a student survey that tests the plan's assumptions with real data
- `asset/`: the working asset (static site plus a Google Sheets backend)

## What the app does
- **Registration page:** records where each sign-up came from (ambassador link, WhatsApp, a friend's invite and so on)
- **Personal invite page:** each student gets a unique link, a one-tap WhatsApp or LinkedIn share and rewards for bringing friends
- **College Challenge leaderboard:** colleges compete on how many students they bring
- **Organiser dashboard:** sign-ups against the daily plan, a split by channel, the viral ratio and CSV export

## Run locally
```
python -m http.server 5173 --directory asset
```
Open http://localhost:5173. With `API_URL` left empty, the app runs in **demo mode**: data stays in your browser and comes pre-filled with sample registrations, so the dashboard has something to show.

- Registration page: `/`
- A student's invite page: `/#/me/<CODE>`
- Referral link: `/?ref=<CODE>`. Ambassador link: `/?src=amb_ravi`
- Leaderboard: `/#/leaderboard`
- Organiser dashboard: `/#/admin` (demo key `nxt-admin`)

## Make it live (about 15 minutes, free)
1. **Backend:** create a Google Sheet, then go to **Extensions → Apps Script** and paste `asset/backend/Code.gs`.
   Under **Project Settings → Script properties**, add `ADMIN_KEY` = a secret of your choice.
   Then **Deploy → New deployment → Web app**, with *Execute as: Me* and *Who has access: Anyone*. Authorise it and copy the `/exec` URL.
2. Paste that URL into `asset/config.js` as `API_URL`. Change `ADMIN_KEY` there to anything, because the real key is checked on the server.
3. **Hosting:** drag the `asset` folder onto https://app.netlify.com/drop, or push it to GitHub Pages or Vercel. You'll get a public link to submit.
4. Test it: register once, open your invite link in an incognito window, register a second test user and confirm the first user's count goes up.

Leave the hosted copy in demo mode if you want reviewers to see a populated dashboard straight away. Each visitor gets their own sample data, and the banner says so.
