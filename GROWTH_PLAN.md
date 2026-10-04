# 500 Registrations in 7 Days on ₹2,000
**Workshop:** "Build Your First AI Project in 60 Minutes" (free, live) · **Live asset:** https://ai-workshop-referral-engine.vercel.app/

**Core bet:** ₹2,000 can't buy 500 students, so students have to bring each other. Every part of this plan feeds that loop.

## 1. The student
- **Who:** final-year B.Tech students (2027 batch) in **Tamil Nadu, Telangana and Andhra Pradesh**, mainly CSE, IT, AI/ML and ECE. I start at my own college, **Amrita Coimbatore**, then nearby colleges (PSG, Kumaraguru, CIT) through people I know. That's a free first ambassador on Day 1.
- **Why they care now:** it's placement season, and interviewers ask *"Have you built anything with AI?"* Most haven't. AI courses look long, paid or theory-heavy.
- **What makes them register:** a **concrete outcome** (a deployed AI Resume Reviewer, a GitHub link and a resume line, in 60 minutes), **zero risk** (free, one evening, no AI experience needed) and **peer proof** ("37 students from your college registered").

## 2. The campaign: 3 channels, in order of priority
| # | Channel | What I do | Why it works | Regs |
|---|---|---|---|---|
| 1 | **Campus ambassadors** | Recruit 25 club leads and class reps in about 20 colleges. Each gets a tracked link, a WhatsApp message, a poster and a reel. | Class WhatsApp groups beat any ad, and a classmate is a trusted sender. | 5,000 reached × 5% ≈ **260** |
| 2 | **Referral loop** (my asset) | Every registrant gets an invite link, a 3-person squad and rewards for 1/3/5 friends, plus a college leaderboard. | People share right after they sign up, when their intent is highest, and college pride adds a reason. | ~300 × 0.45 ≈ **140** |
| 3 | **Organic social** | 2 LinkedIn posts and 1 reel showing the finished project, reshared by ambassadors. | Gives ambassadors proof to point to. | ≈ **100** |
| | | | **Total (target 550 to cover duplicates)** | **≈ 500** |

**Not doing:** paid ads (₹2,000 ≈ 40 sign-ups), cold emails to TPOs (too slow) or a long list of extra channels.

**Budget:** ₹1,000 top-5 ambassador vouchers (**paid only on results**) · ₹600 lucky draw for students with 3+ referrals · ₹400 boost on Day 5 **only if behind plan**. All other rewards cost nothing.

**Daily targets:** 40 · 60 · 70 · 80 · 90 · 90 · 70 (= 500). Day 1: seed in my Amrita groups to test the message. Day 3: launch the College Challenge. Day 4: review the numbers and move effort to the best channel. Day 5: social-proof push. Day 7: "closes tonight".
**Attendance:** WhatsApp and email reminders 1 day, 1 hour and 10 minutes before. A registration only counts if the student shows up.

## 3. Experiments: my five hypotheses, all built in
500 sign-ups can't be split five ways (about 50 per version is too few to trust), so each idea is measured the way that suits it.

| # | Idea | Hypothesis | What students see | Metric |
|---|---|---|---|---|
| 1 | **Project Curiosity** | Seeing a project they want to build makes students register. | 4 project cards and project pages before sign-up. Only the Resume Reviewer is built Sunday; the rest are votes, so nothing is over-promised. | Click rate → sign-up per project |
| 2+5 | **Squad Challenge** (live for all) | Students share more when it's a challenge and a card that represents them. | A 3-person AI squad and a personal share card. Friends fill the inviter's squad. | Share rate, squads completed |
| 3 | **Campus Identity** (A/B) | Campus identity beats a national online workshop. | A: standard page. B: "[College] AI Project Sprint" with the campus count and rank. | Visit → sign-up |
| 4 | **Instant Reward** (A/B) | A useful reward right after sign-up reduces drop-off. | A: confirmation only. B: an AI Project Passport (recommendation, prep checklist, download). | Return rate |

The two A/B tests split **different groups** (visitors vs registrants), run on Days 1–3, then everyone gets the winner. The dashboard calls a winner at 95% confidence. I launched squads for everyone because squads only work if friends see the same page. **Guardrail:** show-up rate on the day.

## 4. What I built: the Referral Engine
- **The student journey:** project pages → a 2-step sign-up → an invite page with a squad, a share card and WhatsApp, Discord and LinkedIn sharing. The site remembers who's registered.
- **Organiser dashboard:** sign-ups vs the daily plan, by channel and college, the viral ratio, all 4 experiment panels and CSV export.
- **Campaign Simulator:** the plan as a live model. It reaches **519 by Day 7**, and only **394 without the referral loop**, which is why the loop is the core bet.
- **Stack:** Vercel serverless and MongoDB Atlas, free to run. Unique indexes block duplicate sign-ups.

**Every morning it answers:** *Are we on plan, and which channel or college gets our effort today?*
