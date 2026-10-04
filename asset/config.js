// Edit these before deploying.
window.CONFIG = {
  // Paste your Google Apps Script web-app URL here (see README).
  // Leave empty to run in DEMO mode (data saved in this browser only).
  API_URL: "",

  WORKSHOP_TITLE: "Build Your First AI Project in 60 Minutes",
  WORKSHOP_DATE: "2026-10-18T19:00:00+05:30", // Sun 18 Oct, 7 PM IST
  GOAL: 500,

  // Referral reward tiers (all zero-cost; cash budget goes to top ambassadors)
  REWARDS: [
    { at: 1, title: "AI Prompt Pack", desc: "50 tested prompts for projects & interviews" },
    { at: 3, title: "Priority Q&A", desc: "Your question answered live + shout-out" },
    { at: 5, title: "1:1 Project Review", desc: "Mentor reviews your deployed project" },
  ],

  // Demo-only admin key. With a real backend the key is checked server-side.
  ADMIN_KEY: "nxt-admin",
};
