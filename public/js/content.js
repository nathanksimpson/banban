// Card wording for each stage, in English and Korean, at levels 1–5.
//   1 Read aloud      — a full sentence (+ picture)
//   2 Sentence frame  — blanks and a word bank (+ picture)
//   3 Keywords        — key words only (+ picture)
//   4 Picture only
//   5 Challenge       — picture only, and some words you may not say
// Every word in the text is a token the speaker can tap to "peek" at it in the other language.

export const ITEM = {
  onion: { en: 'onion', pl: 'onions', ko: '양파' },
  carrot: { en: 'carrot', pl: 'carrots', ko: '당근' },
  potato: { en: 'potato', pl: 'potatoes', ko: '감자' },
  egg: { en: 'egg', pl: 'eggs', ko: '계란' },
  tomato: { en: 'tomato', pl: 'tomatoes', ko: '토마토' },
  mushroom: { en: 'mushroom', pl: 'mushrooms', ko: '버섯' },
};
export const COUNT = { 1: { en: 'one', ko: '한 개' }, 2: { en: 'two', ko: '두 개' }, 3: { en: 'three', ko: '세 개' } };
export const CONTAINER = { pot: { en: 'pot', ko: '냄비' }, pan: { en: 'pan', ko: '프라이팬' }, bowl: { en: 'bowl', ko: '그릇' } };
export const VERB = {
  wash: { en: 'wash', ko: '씻다', go: '씻고', imp: '씻으세요', noun: '씻기' },
  chop: { en: 'chop', ko: '썰다', go: '썰고', imp: '써세요', noun: '썰기' },
  fry: { en: 'fry', ko: '볶다', go: '볶고', imp: '볶으세요', noun: '볶기' },
  boil: { en: 'boil', ko: '삶다', go: '삶고', imp: '삶으세요', noun: '삶기' },
};

/** Korean object particle: 을 after a final consonant, otherwise 를. */
const obj = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 ? '을' : '를'; };

// a word token: shown text + what a peek reveals
const w = (text, peek) => ({ w: text, peek });
const t = (text) => ({ t: text });
const B = { blank: true };
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const others = (obj, key) => Object.keys(obj).filter((k) => String(k) !== String(key));
const one = (a) => a[Math.floor(Math.random() * a.length)];

function itemWord(lang, item, count) {
  const v = ITEM[item];
  return lang === 'en' ? w(count === 1 ? v.en : v.pl, v.ko) : w(v.ko, count === 1 ? v.en : v.pl);
}
const countWord = (lang, n) => (lang === 'en' ? w(COUNT[n].en, COUNT[n].ko) : w(COUNT[n].ko, COUNT[n].en));
const boxWord = (lang, c) => (lang === 'en' ? w(CONTAINER[c].en, CONTAINER[c].ko) : w(CONTAINER[c].ko, CONTAINER[c].en));

/**
 * The speaker's card for a stage: { text: tokens[] | null, bank: tokens[] | null, banned: tokens[] | null, picture: true }.
 * `stage` is what the server sends the speaker (kind + target or steps).
 */
export function cardFor(stage, lang, level) {
  return stage.kind === 'put' ? putCard(stage.target, lang, level) : orderCard(stage.steps, lang, level);
}

function putCard({ item, count, container }, lang, level) {
  const it = itemWord(lang, item, count); const n = countWord(lang, count); const box = boxWord(lang, container);
  const extra = [countWord(lang, +one(others(COUNT, count))), itemWord(lang, one(others(ITEM, item)), count), boxWord(lang, one(others(CONTAINER, container)))];
  if (lang === 'en') {
    if (level === 1) return { text: [t('Put '), n, t(' '), it, t(' in the '), box, t('.')] };
    if (level === 2) return { text: [t('Put '), B, t(' '), B, t(' in the '), B, t('.')], bank: shuffle([n, it, box, ...extra]) };
    if (level === 3) return { keywords: [n, it, box] };
    if (level === 5) return { banned: [it, box] };
    return {};
  }
  if (level === 1) return { text: [box, t('에 '), it, t(' '), n, t('를 넣으세요.')] };
  if (level === 2) return { text: [B, t('에 '), B, t(' '), B, t('를 넣으세요.')], bank: shuffle([box, it, n, ...extra]) };
  if (level === 3) return { keywords: [it, n, box] };
  if (level === 5) return { banned: [it, box] };
  return {};
}

function orderCard(steps, lang, level) {
  const vb = (s, form) => (lang === 'en' ? w(VERB[s.verb].en, VERB[s.verb].ko) : w(VERB[s.verb][form], VERB[s.verb].en));
  const it = (s) => itemWord(lang, s.item, 1);
  const [a, b, c] = steps;
  const unused = Object.keys(VERB).find((v) => !steps.some((s) => s.verb === v));
  const spareItem = Object.keys(ITEM).find((x) => !steps.some((s) => s.item === x));
  if (lang === 'en') {
    if (level === 1) return { text: [t('First '), vb(a), t(' the '), it(a), t(', then '), vb(b), t(' the '), it(b), t(', then '), vb(c), t(' the '), it(c), t('.')] };
    if (level === 2) return { text: [t('First '), B, t(' the '), B, t(', then '), B, t(' the '), B, t(', then '), B, t(' the '), B, t('.')],
      bank: shuffle([vb(a), it(a), vb(b), it(b), vb(c), it(c), w(VERB[unused].en, VERB[unused].ko), itemWord('en', spareItem, 1)]) };
    if (level === 3) return { keywords: [vb(a), it(a), t('→'), vb(b), it(b), t('→'), vb(c), it(c)] };
    if (level === 5) return { banned: [vb(a), vb(b), vb(c)] };
    return {};
  }
  const p = (s) => t(obj(ITEM[s.item].ko) + ' ');
  if (level === 1) return { text: [t('먼저 '), it(a), p(a), vb(a, 'go'), t(', 그다음 '), it(b), p(b), vb(b, 'go'), t(', 마지막으로 '), it(c), p(c), vb(c, 'imp'), t('.')] };
  if (level === 2) return { text: [t('먼저 '), B, t('을/를 '), B, t(', 그다음 '), B, t('을/를 '), B, t(', 마지막으로 '), B, t('을/를 '), B, t('.')],
    bank: shuffle([it(a), vb(a, 'go'), it(b), vb(b, 'go'), it(c), vb(c, 'imp'), w(VERB[unused].go, VERB[unused].en), itemWord('ko', spareItem, 1)]) };
  if (level === 3) return { keywords: [it(a), vb(a, 'noun'), t('→'), it(b), vb(b, 'noun'), t('→'), it(c), vb(c, 'noun')] };
  if (level === 5) return { banned: [vb(a, 'ko'), vb(b, 'ko'), vb(c, 'ko')] };
  return {};
}

/** Words from a finished mission, for the results screen: [{ en, ko }]. */
export function missionWords(stages) {
  const seen = new Map();
  const add = (en, ko) => seen.set(en, { en, ko });
  for (const s of stages) {
    if (s.kind === 'put') {
      add(ITEM[s.target.item].en, ITEM[s.target.item].ko);
      add(CONTAINER[s.target.container].en, CONTAINER[s.target.container].ko);
      add(COUNT[s.target.count].en, COUNT[s.target.count].ko);
    } else {
      s.steps.forEach((x) => { add(VERB[x.verb].en, VERB[x.verb].ko); add(ITEM[x.item].en, ITEM[x.item].ko); });
    }
  }
  return [...seen.values()];
}
