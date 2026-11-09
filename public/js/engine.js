// Banban game rules, shared by the room server (src/worker.js) and the browser.
// Pure functions: the server applies every action, then sends each player only what they may see.
//
// A mission is a chain of stages. In each stage one player (the speaker) sees a card and says it
// out loud in the language they're practising; the others (listeners) see only the choices and act.

export const MAX_PLAYERS = 6;
export const ITEMS = ['onion', 'carrot', 'potato', 'egg', 'tomato', 'mushroom'];
export const CONTAINERS = ['pot', 'pan', 'bowl'];
export const VERBS = ['wash', 'chop', 'fry', 'boil'];
export const LENGTHS = { quick: { put: 3, order: 1 } };
export const POINTS = { stage: 10, retry: -1, peek: -1 };

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const same = (a, b) => a.item === b.item && a.count === b.count && a.container === b.container;

/** "Put two onions in the pot": the answer plus three near misses (count, item or container changed). */
function putStage() {
  const target = { item: pick(ITEMS), count: 1 + Math.floor(Math.random() * 3), container: pick(CONTAINERS) };
  const misses = [
    { ...target, count: pick([1, 2, 3].filter((n) => n !== target.count)) },
    { ...target, item: pick(ITEMS.filter((x) => x !== target.item)) },
    { ...target, container: pick(CONTAINERS.filter((x) => x !== target.container)) },
  ];
  const choices = shuffle([target, ...misses]);
  return { kind: 'put', target, choices, answer: choices.findIndex((c) => same(c, target)) };
}

/** "First wash the potato, then chop the carrot, then fry the mushroom": tap the steps in order. */
function orderStage() {
  const items = shuffle(ITEMS).slice(0, 3);
  const verbs = shuffle(VERBS).slice(0, 3);
  const steps = items.map((item, i) => ({ verb: verbs[i], item }));
  const choices = shuffle(steps.map((_, i) => i));
  // choices[k] = index into steps; the answer is the choice positions in step order
  return { kind: 'order', steps, choices: choices.map((i) => steps[i]), answer: steps.map((_, i) => choices.indexOf(i)) };
}

export function newMission(length = 'quick') {
  const plan = LENGTHS[length] || LENGTHS.quick;
  const stages = [];
  for (let i = 0; i < plan.put; i++) stages.push(putStage());
  stages.splice(1 + Math.floor(Math.random() * stages.length), 0, ...Array.from({ length: plan.order }, orderStage));
  return { id: 'dinner', length, stages, idx: 0, retries: 0, peeks: 0, score: 0, startedAt: 0, finishedAt: 0, peeked: [], flash: null };
}

export function newRoom(code) {
  return { code, players: {}, order: [], phase: 'lobby', mission: null, history: [] };
}

const clampInt = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const cleanStr = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);

/** Who speaks in stage i: the players take turns in join order. */
export const speakerOf = (s, i = s.mission?.idx ?? 0) => (s.order.length ? s.order[i % s.order.length] : null);

/** Apply one action from player `pid` at time `now`. Returns an error string (nothing changed) or null. */
export function apply(s, pid, a, now) {
  const me = s.players[pid];
  const m = s.mission;
  switch (a.type) {
    case 'hello': {
      if (!me) {
        if (s.order.length >= MAX_PLAYERS) return 'full';
        s.players[pid] = { name: cleanStr(a.name, 20) || 'Player', lang: a.lang === 'en' ? 'en' : 'ko', level: 1 };
        s.order.push(pid);
      } else if (a.name) me.name = cleanStr(a.name, 20) || me.name;
      if (me && a.lang) me.lang = a.lang === 'en' ? 'en' : 'ko';
      return null;
    }
    case 'profile': {
      if (!me) return 'no';
      if (a.name !== undefined) me.name = cleanStr(a.name, 20) || me.name;
      if (a.lang !== undefined) me.lang = a.lang === 'en' ? 'en' : 'ko';
      if (a.level !== undefined) me.level = clampInt(a.level, 1, 5, 1);
      return null;
    }
    case 'remove': {
      if (!me || s.phase !== 'lobby' || !s.players[a.pid] || a.pid === pid) return 'no';
      delete s.players[a.pid];
      s.order = s.order.filter((p) => p !== a.pid);
      return null;
    }
    case 'start': {
      if (!me || s.phase !== 'lobby') return 'no';
      if (s.order.length < 2) return 'need-two';
      s.mission = newMission(a.length);
      s.mission.startedAt = now;
      s.phase = 'playing';
      return null;
    }
    case 'peek': {
      // the speaker taps a word on their card to see it in their own language: −1 point, once per word per stage
      if (s.phase !== 'playing' || speakerOf(s) !== pid) return 'no';
      const key = `${m.idx}:${cleanStr(a.word, 40)}`;
      if (m.peeked.includes(key)) return null;
      m.peeked.push(key);
      m.peeks += 1;
      return null;
    }
    case 'answer': {
      if (s.phase !== 'playing' || !me || speakerOf(s) === pid) return 'no';
      const st = m.stages[m.idx];
      let right = false;
      if (st.kind === 'put') right = a.choice === st.answer;
      if (st.kind === 'order') right = Array.isArray(a.order) && a.order.length === st.answer.length && a.order.every((v, i) => v === st.answer[i]);
      if (!right) {
        m.retries += 1;
        m.flash = { type: 'wrong', stage: m.idx, at: now, by: pid };
        return null;
      }
      m.flash = { type: 'cleared', stage: m.idx, at: now, by: pid };
      m.idx += 1;
      if (m.idx >= m.stages.length) finish(s, now);
      return null;
    }
    case 'again': {
      if (!me || (s.phase !== 'done' && s.phase !== 'playing')) return 'no';
      s.phase = 'lobby';
      s.mission = null;
      return null;
    }
    default:
      return 'unknown';
  }
}

export function scoreOf(m) {
  const cleared = Math.min(m.idx, m.stages.length);
  return cleared * POINTS.stage + m.retries * POINTS.retry + m.peeks * POINTS.peek;
}

function finish(s, now) {
  const m = s.mission;
  m.finishedAt = now;
  m.score = scoreOf(m);
  s.phase = 'done';
  s.history.unshift({
    at: now, mission: m.id, length: m.length, score: m.score, seconds: Math.round((now - m.startedAt) / 1000),
    retries: m.retries, peeks: m.peeks, players: s.order.map((p) => s.players[p]?.name || '?'),
  });
  s.history = s.history.slice(0, 20);
}

/**
 * What one player may see. The speaker gets the stage's target; listeners get only the choices
 * (no answer). Once the mission is done, everyone sees everything.
 */
export function viewFor(s, pid) {
  const v = { ...s, you: pid, mission: null };
  const m = s.mission;
  if (!m) return v;
  const done = s.phase === 'done';
  v.mission = {
    id: m.id, length: m.length, idx: m.idx, total: m.stages.length, retries: m.retries, peeks: m.peeks,
    score: done ? m.score : scoreOf(m), startedAt: m.startedAt, finishedAt: m.finishedAt, flash: m.flash,
    speaker: speakerOf(s), stage: null,
    stages: done ? m.stages.map(({ kind, target, steps }) => ({ kind, target, steps })) : null,
  };
  const st = m.stages[m.idx];
  if (st && !done) {
    v.mission.stage = speakerOf(s) === pid
      ? { kind: st.kind, target: st.target, steps: st.steps, peeked: m.peeked.filter((k) => k.startsWith(`${m.idx}:`)).map((k) => k.slice(k.indexOf(':') + 1)) }
      : { kind: st.kind, choices: st.choices };
  }
  return v;
}
