# 2048 Mobile Roadmap (Simple-First)

## Core Principle
- Keep UX simple, fast, and satisfying.
- No complex systems unless they directly improve retention.
- Ship in small phases and measure impact before adding more.

## Phase 1 - Make Core Loop 10/10 (Highest Priority)
Goal: improve addictiveness without adding user-facing complexity.

1. First-session hook
- Add a short guided first game moment (quick combo + instant reward).
- Show one clear objective only.

2. Reward pacing
- Guarantee a meaningful unlock/reward every few runs early game.
- Reduce early grind feeling for themes/backgrounds/powerups.

3. Better merge "juice"
- Stronger visual feedback for higher merges (flash, scale pop, better SFX/haptic tiers).
- Keep effects clear and not noisy.

4. Faster replay loop
- One-tap quick restart from game over.
- Minimize waiting between runs.

5. Fair economy feel
- Early customization should feel reachable.
- Avoid hard paywall feel in first sessions.

## Phase 2 - Async Competition: Daily Seeded Run + Daily Leaderboard (Complexity: 3/10)
Goal: social competition at low backend cost.

1. Daily seeded mode
- One deterministic seed per day for all players.
- Same block sequence/rules for everyone.

2. Daily leaderboard
- 24h board reset.
- Store only run-level data (start/end), not per-move logs.

3. Low-cost guardrails
- Basic score sanity checks server-side.
- Cache leaderboard fetches (30-60s).

## Phase 3 - Weekly Leagues from Daily Points (Complexity: 5/10)
Goal: medium-term retention with simple structure.

1. League tiers
- Bronze, Silver, Gold.

2. Weekly scoring
- Convert daily run placement/performance to league points.

3. Weekly promotion/relegation
- Top segment moves up, bottom segment moves down.

## Phase 4 - Friend Challenges (Complexity: 4/10)
Goal: viral social loop without real-time multiplayer.

1. Challenge links
- Shareable link with target score and mode.

2. 24h expiry
- Challenge valid for 24 hours only.

3. Simple result states
- Pending, completed, failed.

## Phase 5 - Monetization with Minimal Friction
Goal: increase revenue without hurting retention.

1. Rewarded ads first
- Extra retry/continue.
- Optional boost/reward.

2. Light interstitial policy
- Only between runs.
- Strict cap per day.

3. No gameplay interruption
- No banners during active play.

## Implementation Order (Approved Direction)
1. Phase 1 (core addictiveness polish)
2. Daily seeded mode + daily leaderboard reset every 24h
3. Weekly leagues using points from daily runs
4. Friend challenge links with 24h expiry
5. Rewarded ads tied to retries/boosts
