# 500 Registrations in 7 Days on ₹2,000
**Workshop:** "Build Your First AI Project in 60 Minutes" (free, live)
**Core bet:** We can't buy 500 students with ₹2,000, so students have to bring each other. Everything below pushes that one loop.

---

## 1. The student

**Who:** Final-year B.Tech students (2027 batch) at engineering colleges in **Tamil Nadu, Telangana and Andhra Pradesh**, mainly CSE, IT, AI/ML and ECE.
- **Telangana and AP:** NxtWave already has brand recall here, so it's the cheapest place to start.
- **Tamil Nadu:** I'm a student at Amrita Vishwa Vidyapeetham, Coimbatore, so I can start the first wave myself through my own batch groups and clubs, then spread to nearby colleges (PSG, Kumaraguru, CIT, SKCET) through people I know. That gives the campaign an ambassador on Day 1 without spending anything.

**Why they'd care right now:** It's October, the middle of placement season. Interviewers and resume screeners now ask, *"Have you built anything with AI?"* Most of these students haven't. Their resumes list the same three college projects. They feel behind, and the AI courses they see are long, paid or full of theory.

**What makes them register:**
1. **A concrete outcome, not "learning":** a *deployed* AI Resume Reviewer, a GitHub link and a ready resume line, all in 60 minutes.
2. **Zero risk:** it's free, needs only a laptop, takes one evening (7 PM) and assumes no prior AI.
3. **Peer proof:** "37 students from *your* college registered" persuades more than any ad.

---

## 2. The campaign: three channels, in order of priority

| # | Channel | What we do | Why it works | Expected regs |
|---|---|---|---|---|
| 1 | **Campus ambassadors** (coding-club leads and class reps) | Day 1: DM about 60 club leads and CRs on LinkedIn and Instagram, aiming for **25 ambassadors in about 20 colleges across TN, Telangana and AP**. I'm the first ambassador, at Amrita. Each one gets a personal tracked link (`?src=amb_name`) and a ready-to-forward WhatsApp message, poster and 30-second reel. | Class WhatsApp groups get far more attention than any ad, and a classmate is a trusted sender. | 25 ambassadors × ~3 groups × ~70 students ≈ 5,000 reached × 5% ≈ **260** |
| 2 | **Built-in referral loop** (the asset I built) | Every registrant immediately gets a personal invite link, a one-tap WhatsApp share and reward tiers (1 friend → prompt pack, 3 → priority Q&A, 5 → 1:1 project review). A public **College Challenge leaderboard** turns it into campus rivalry. | Students share at the moment their intent is highest, right after they sign up. College pride gives them a reason to share beyond self-interest. | ~300 seeded × 0.45 viral ratio ≈ **140** |
| 3 | **Organic social** (LinkedIn and Instagram) | 2 LinkedIn posts and 1 reel that show the finished project. Ask ambassadors to reshare. | Gives ambassadors something credible to point to, and reaches students outside the groups. | ≈ **100** |
| | | | **Total** | **≈ 500** (aiming for 550 to allow for duplicates) |

**What I'm deliberately not doing:** paid ads (₹2,000 gets maybe 40 sign-ups), cold emails to TPOs (too slow for 7 days) or 10 more channels (spreading thin kills follow-through).

### Budget (₹2,000)

| Item | ₹ | Rule |
|---|---|---|
| Top-5 ambassador rewards (vouchers) | 1,000 | Paid **only on results**: ₹400, ₹250, ₹150, ₹100, ₹100 |
| Lucky draw among students with 3+ referrals | 600 | 3 × ₹200 vouchers, which keeps sharing going in the second half |
| Contingency boost | 400 | Spent on Day 5 **only if we're behind plan**, to boost whichever post converts best |

Every other reward (prompt pack, priority Q&A, 1:1 review, leaderboard shout-outs) costs nothing.

### Day-by-day (the dashboard tracks against these targets)

| Day | Target | Action |
|---|---|---|
| 1 | 40 | Launch the page and seed it in my own Amrita groups first, to test the message. Recruit ambassadors and hand out the content kit. |
| 2 | 60 | Ambassadors post in groups; the first wave starts sharing |
| 3 | 70 | Announce the College Challenge: "First college to 50 gets a shout-out and a campus session" |
| 4 | 80 | **Mid-campaign review:** move effort to the best-converting channel and colleges |
| 5 | 90 | Social-proof push ("300+ students, 18 colleges"); use the ₹400 boost if behind |
| 6 | 90 | Name the top inviters publicly; open the lucky draw |
| 7 | 70 | "Registration closes tonight" message through all ambassadors |

**Turning registrations into attendance:** reminders on WhatsApp and email the day before, one hour before and ten minutes before the session. A registration only counts if the student shows up.

---

## 3. Experiments: testing my own hypotheses

I wrote five hypotheses and built all five into the app. With about 500 sign-ups in 7 days, I can't split traffic five ways (that's about 50 students per version, too few to trust), so each idea is measured in the way that suits it:
- **Two real A/B tests**, each splitting a *different* group so they don't compete for the same students: **Campus Identity** splits *visitors* by college, and **Instant Reward** splits *registrants*. Both run on Days 1–3, then everyone switches to the winner. The dashboard checks for a winner at 95% confidence.
- **Project Curiosity is measured, not split.** Every visitor sees all four project cards, and I compare clicks and sign-ups per project.
- **Squad Challenge is live for everyone**, because squads only work if friends see the same page. I track how well it spreads instead.

| # | Idea | Hypothesis | What students see | Metric |
|---|---|---|---|---|
| 1 | **Project Curiosity** | Students register more when they first see a project they want to build. | Four project cards before the sign-up button. Only the AI Resume Reviewer is built on Sunday; the other three are honest votes for the next workshop, so nothing is over-promised. | Card click rate, then click → sign-up rate per project |
| 2 + 5 | **Squad Challenge** ("Show your friend" + "Peer challenge"), live for everyone | Students share more when it's a challenge with friends and a card that represents them. | Every student builds a 3-person AI squad and gets a personal share card. Friends who join through a squad member's link fill that squad. | Share rate, friends per student, squads completed |
| 3 | **Campus Identity** (A/B) | Students respond more to something happening inside their own college. | A: the standard page. B: "*[College] AI Project Sprint*" with "X students from your college registered" and the campus rank. Split by college. | Visit → sign-up conversion |
| 4 | **Instant Reward** (A/B) | A useful reward right after sign-up makes registering feel worthwhile and reduces drop-off. | A: the basic confirmation. B: an **AI Project Passport**: a personal project recommendation, a 4-step prep checklist and a downloadable passport. | Return rate (A vs B), and the share of students who use the Passport |

**Guardrail:** I'll also track show-up rate on workshop day, because a version that raises sign-ups but lowers attendance isn't a win.

## 4. What I built: the Referral Engine

A working web app that runs channels 1 and 2:
- **Registration page** with validation and duplicate protection. It captures the source (`src`) and the referrer (`ref`).
- **Personal invite page:** a unique link, a one-tap WhatsApp or LinkedIn share with the message already written, and reward progress.
- **College Challenge leaderboard** (top colleges and top inviters).
- **Organiser dashboard:** registrations against the daily plan, a split by channel, the viral ratio, and how many registrations per day are still needed. It also exports a CSV.
- **Backend:** a Vercel serverless API with a MongoDB Atlas database. It's free and needs no server to manage. Unique indexes on email, phone and referral code mean the database itself blocks duplicate sign-ups, even when two arrive at the same moment.
- **All five of my experiment ideas built in**: the Project Curiosity picker, the Campus Identity and Instant Reward (AI Project Passport) A/B tests, and the Squad Challenge with a personal share card, each with its own results panel.
- **Sharing on WhatsApp, Discord and LinkedIn**, plus a downloadable squad card.
- **Campaign Simulator:** the 7-day plan as a live model with adjustable assumptions. It shows the plan reaching 500 on Day 7, and only 394 without the referral loop.

The question it answers every morning: *Are we on plan, and which channel or college should get our effort today?*
