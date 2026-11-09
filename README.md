# 반반 Banban

A co-op game for two language partners. Each of you holds half of what's needed, and the only way to share it is to say it out loud in the language you're learning. The listener is a native speaker of that language, so they understand you and can help.

**Phase 1 (this version): the playable core**

- Rooms with 4-letter codes; each of you plays on your own phone, together or apart (talk on your own phone or KakaoTalk call when apart).
- Each player picks the language they practise (한국어 or English) and their own level, 1–5:
  1 read aloud · 2 sentence frame · 3 keywords · 4 picture only · 5 picture only with banned words.
- Menus can be English or 한국어 on each phone (EN / 한국어 at the top). They default to the language you already know.
- Mission **Dinner for two** (quick, 4 stages, new random stages every game):
  - *Put* stages: the speaker says e.g. "Put two onions in the pot" / "냄비에 양파 두 개를 넣으세요"; the listener picks the matching picture out of four near misses.
  - *Order* stage: the speaker says three cooking steps; the listener taps them in order.
- Speakers take turns each stage. Tap any word on your card to peek at it in your own language.
- Score: +10 per stage, −1 per wrong answer, −1 per peek. The room keeps a short history of games.

Later phases (see the design doc): Google sign-in and partner links, all six missions and lengths, async voice-clip turns, a main-screen TV mode, illustrations and built-in voice.

## How it works

- `public/` is a static site (no build step). `public/js/engine.js` holds the rules and is used by both the server and the browser; `content.js` writes each card in both languages at every level; `art.js` draws the pictures.
- `src/worker.js` runs only for `/api/*`. Each room code is one Durable Object (`Room`) that holds the game and talks to the phones over WebSockets. The speaker's phone gets the target; the listener's phone gets only the choices. Rooms are deleted 3 days after their last action.

## Deploy (Cloudflare Workers)

1. In the Cloudflare dashboard: **Workers & Pages → Create → Import a repository**, pick **banban**, keep the defaults and deploy. The first deploy creates the Durable Object (free plan is fine).
2. Open the Worker's address on two phones: one creates a room, the other joins with the code.

Local: `npm install` then `npm run dev`.
