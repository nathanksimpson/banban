// Banban client: join → lobby → stages (speaker / listener) → results.
import { speakerOf, POINTS } from './engine.js';
import { cardFor, missionWords } from './content.js';
import { putPicture, stepPicture, mascot, container as boxArt } from './art.js';

const $ = (s) => document.querySelector(s);
const app = $('#app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off */ } };

/* ---------------- words on screen ---------------- */
const S = {
  en: {
    tagline: 'Half the clues each. All of the talking.', name: 'Your name', practise: "I'm practising",
    practiseNote: "You'll speak this language. Your partner listens and helps.", korean: 'Korean', english: 'English',
    create: 'Create a room', join: 'Join', code: 'Room code', needName: 'Type your name first.', needCode: 'Type the 4-letter room code.',
    rejoin: 'Rejoin as {name}', newPlayer: 'Join as a new player', room: 'Room', copy: 'Copy invite link', copied: 'Link copied!',
    leave: 'Leave room', players: 'Players', you: 'you', offline: 'offline', remove: 'Remove', speaks: 'speaks {lang}',
    lv: { 1: 'Read aloud', 2: 'Sentence frame', 3: 'Keywords', 4: 'Picture only', 5: 'Challenge' }, level: 'Level {n} · {name}',
    mission: 'Mission', dinner: 'Dinner for two', dinnerSub: 'Quick · 4 stages', scoring: 'Stage +10 · retry −1 · peek −1',
    start: "Let's cook!", needTwo: 'Share the room code — you need 2 players.',
    youSpeak: 'You speak · in {lang}', listen: 'Listen and choose!', listenOrder: 'Listen, then tap the steps in order!',
    sayIt: "Say it out loud. No peeking at each other's screens!", describe: 'Describe the picture in {lang}.', describeSteps: 'Describe the three steps in {lang}.',
    dontSay: "Don't say these words:", peekHint: 'Tap a word to peek at its meaning (−1 point).',
    waiting: '{name} is choosing…', speakerIs: '{name} is describing in {lang}', askAgain: 'You can ask questions too!',
    confirm: 'This one!', confirmOrder: 'That order!', clear: 'Clear', retries: 'Retries: {n}', peeks: 'Peeks: {n}',
    nice: 'Nice!', tryAgain: 'Not quite — ask again!', endMission: 'End mission', endAsk: 'End this mission for everyone?',
    served: 'Dinner is served!', score: 'Score', stages: 'Stages', time: 'Time', retriesL: 'Retries', peeksL: 'Peeks',
    keyWords: 'Key words from this mission', again: 'Play again', history: 'Recent games',
    connecting: 'Connecting…', reconnecting: 'Reconnecting…', full: 'That room is full.',
    langName: { ko: 'Korean', en: 'English' },
  },
  ko: {
    tagline: '단서는 반반, 말은 전부!', name: '내 이름', practise: '내가 연습할 언어',
    practiseNote: '이 언어로 말해요. 상대방은 듣고 도와줘요.', korean: '한국어', english: '영어',
    create: '방 만들기', join: '입장', code: '방 코드', needName: '먼저 이름을 입력하세요.', needCode: '4글자 방 코드를 입력하세요.',
    rejoin: '{name}(으)로 다시 입장', newPlayer: '새 플레이어로 입장', room: '방', copy: '초대 링크 복사', copied: '링크를 복사했어요!',
    leave: '방 나가기', players: '플레이어', you: '나', offline: '오프라인', remove: '내보내기', speaks: '{lang}로 말해요',
    lv: { 1: '소리 내어 읽기', 2: '빈칸 채우기', 3: '핵심 단어', 4: '그림만', 5: '도전' }, level: '레벨 {n} · {name}',
    mission: '미션', dinner: '둘이서 저녁 만들기', dinnerSub: '빠른 게임 · 4단계', scoring: '단계 +10 · 다시 하기 −1 · 뜻 보기 −1',
    start: '요리 시작!', needTwo: '방 코드를 공유하세요. 2명이 필요해요.',
    youSpeak: '내가 말해요 · {lang}로', listen: '잘 듣고 고르세요!', listenOrder: '잘 듣고 순서대로 누르세요!',
    sayIt: '소리 내어 말하세요. 서로 화면은 보지 마세요!', describe: '그림을 {lang}로 설명하세요.', describeSteps: '세 단계를 {lang}로 설명하세요.',
    dontSay: '이 말은 하지 마세요:', peekHint: '단어를 누르면 뜻을 볼 수 있어요 (−1점).',
    waiting: '{name} 님이 고르는 중…', speakerIs: '{name} 님이 {lang}로 설명하는 중', askAgain: '궁금하면 물어봐도 돼요!',
    confirm: '이걸로 할게요!', confirmOrder: '이 순서예요!', clear: '다시 고르기', retries: '다시 하기: {n}', peeks: '뜻 보기: {n}',
    nice: '정답!', tryAgain: '아쉬워요 — 다시 물어보세요!', endMission: '미션 끝내기', endAsk: '모두의 미션을 끝낼까요?',
    served: '저녁 완성!', score: '점수', stages: '단계', time: '시간', retriesL: '다시 하기', peeksL: '뜻 보기',
    keyWords: '이번 미션의 핵심 단어', again: '다시 하기', history: '최근 게임',
    connecting: '연결 중…', reconnecting: '다시 연결 중…', full: '방이 꽉 찼어요.',
    langName: { ko: '한국어', en: '영어' },
  },
};

const profile = load('banban.profile', { name: '', lang: (navigator.language || '').startsWith('ko') ? 'en' : 'ko' });
// menus default to the language you already know (the one you're not practising)
let ui = load('banban.ui', profile.lang === 'ko' ? 'en' : 'ko');
const t = (k, v = {}) => { const s = S[ui][k] ?? S.en[k] ?? k; return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '') : s; };
const langName = (l) => S[ui].langName[l];

/* ---------------- sound ---------------- */
let actx = null;
function tone(f, d, type = 'triangle', v = 0.18, delay = 0) {
  try {
    actx ||= new AudioContext();
    const o = actx.createOscillator(); const g = actx.createGain();
    o.type = type; o.frequency.value = f; o.connect(g); g.connect(actx.destination);
    const t0 = actx.currentTime + delay;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.start(t0); o.stop(t0 + d);
  } catch { /* no audio */ }
}
const sfx = { good: () => { tone(660, 0.12); tone(990, 0.25, 'triangle', 0.18, 0.1); }, bad: () => tone(160, 0.4, 'sawtooth', 0.16), done: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.16, i * 0.12)) };

/* ---------------- connection ---------------- */
let code = null; let pid = null; let ws = null; let state = null; let online = new Set(); let retry = 0; let leaving = false;
let joinErr = '';
const randId = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
const send = (a) => { if (ws?.readyState === 1) ws.send(JSON.stringify(a)); };

function connect() {
  leaving = false;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/api/room/${code}/ws?pid=${pid}`);
  setConn(retry ? t('reconnecting') : t('connecting'));
  ws.onopen = () => { retry = 0; send({ type: 'hello', name: profile.name, lang: profile.lang }); };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'state') { online = new Set(msg.online); setConn(''); onState(msg.state); }
    if (msg.type === 'error' && msg.error === 'full') { joinErr = t('full'); leaveRoom(); }
  };
  ws.onclose = () => { if (leaving) return; setConn(t('reconnecting')); retry += 1; setTimeout(connect, Math.min(8000, 500 * 2 ** retry)); };
}
function setConn(text) {
  let el = $('.conn');
  if (!text) { el?.remove(); return; }
  if (!el) { el = document.createElement('div'); el.className = 'conn'; document.body.append(el); }
  el.textContent = text;
}
function enterRoom(c, existing) {
  code = c; pid = existing || randId(16);
  save(`banban.pid.${code}`, { pid, name: profile.name });
  try { sessionStorage.setItem('banban.room', JSON.stringify({ code, pid })); } catch { /* ignore */ }
  history.replaceState(null, '', `?room=${code}`);
  connect();
}
function leaveRoom() {
  leaving = true; ws?.close(); ws = null; state = null; code = null;
  try { sessionStorage.removeItem('banban.room'); } catch { /* ignore */ }
  history.replaceState(null, '', location.pathname);
  render();
}
setInterval(() => send({ type: 'ping' }), 25000);

/* ---------------- state changes ---------------- */
let seenFlash = 0;
let sel = null;      // listener: chosen picture index
let seq = [];        // listener: steps tapped in order
let lastStage = -1;
function onState(s) {
  const prevPhase = state?.phase;
  state = s;
  const m = s.mission;
  if (m && m.idx !== lastStage) { sel = null; seq = []; lastStage = m.idx; }
  render();
  if (m?.flash && m.flash.at > seenFlash) {
    const fresh = seenFlash !== 0 || Date.now() - m.flash.at < 4000;
    seenFlash = m.flash.at;
    if (fresh) flash(m.flash.type === 'cleared');
  }
  if (prevPhase === 'playing' && s.phase === 'done') sfx.done();
}
function flash(good) {
  (good ? sfx.good : sfx.bad)();
  const el = document.createElement('div');
  el.className = 'flash';
  el.innerHTML = `<div class="${good ? 'good' : 'bad'}">${esc(good ? t('nice') : t('tryAgain'))}</div>`;
  document.body.append(el);
  setTimeout(() => el.remove(), 1200);
  if (!good) { sel = null; seq = []; render(); $('.choices')?.classList.add('shake'); }
}

/* ---------------- screens ---------------- */
function bar(inner = '') {
  return `<header class="bar"><div class="bar-row">
    <a class="brand" href="./">${mascot(44)}<span>반반</span></a>${inner}
    <div class="ui-lang" role="group" aria-label="Language"><button data-ui="en" class="${ui === 'en' ? 'on' : ''}">EN</button><button data-ui="ko" class="${ui === 'ko' ? 'on' : ''}">한국어</button></div>
  </div>${state?.phase === 'playing' ? pips() : ''}</header>`;
}
function pips() {
  const m = state.mission;
  return `<div class="pips">${Array.from({ length: m.total }, (_, i) => `<span class="${i < m.idx ? 'done' : i === m.idx ? 'now' : ''}"></span>`).join('')}</div>`;
}

function render() {
  document.documentElement.lang = ui;
  if (!state) return renderJoin();
  if (state.phase === 'lobby') return renderLobby();
  if (state.phase === 'playing') return renderStage();
  return renderDone();
}

function renderJoin() {
  const c = (new URLSearchParams(location.search).get('room') || '').toUpperCase();
  app.innerHTML = `${bar()}<main>
    <div class="hero">${mascot(200)}<h1 class="logo">반반</h1><p class="tagline">${esc(t('tagline'))}</p></div>
    <section class="panel">
      <label class="field">${esc(t('name'))}<input class="text" id="name" maxlength="20" autocomplete="nickname" value="${esc(profile.name)}"></label>
      <div class="field"><span>${esc(t('practise'))}</span>
        <div class="seg2" id="practise"><button data-lang="ko" class="ko ${profile.lang === 'ko' ? 'on' : ''}">${esc(t('korean'))}</button><button data-lang="en" class="en ${profile.lang === 'en' ? 'on' : ''}">${esc(t('english'))}</button></div>
        <p class="hint">${esc(t('practiseNote'))}</p>
      </div>
      <button class="btn big ko" id="create">${esc(t('create'))}</button>
      <div class="row"><input class="text code-in" id="code" maxlength="4" placeholder="ABCD" autocomplete="off" autocapitalize="characters" value="${esc(/^[A-Z]{4}$/.test(c) ? c : '')}" aria-label="${esc(t('code'))}"><button class="btn en" id="join">${esc(t('join'))}</button></div>
      <div id="rejoin"></div>
      <p class="err" id="err">${esc(joinErr)}</p>
    </section></main>`;
  renderRejoin();
}
function renderRejoin() {
  const c = ($('#code')?.value || '').toUpperCase();
  const prev = /^[A-Z]{4}$/.test(c) ? load(`banban.pid.${c}`, null) : null;
  const el = $('#rejoin'); if (!el) return;
  el.innerHTML = prev ? `<div class="row"><button class="btn yellow" data-rejoin>${esc(t('rejoin', { name: prev.name || '?' }))}</button><button class="link" data-newplayer>${esc(t('newPlayer'))}</button></div>` : '';
}
function joinCheck(needCode) {
  profile.name = ($('#name').value || '').trim().slice(0, 20); save('banban.profile', profile);
  if (!profile.name) { $('#err').textContent = t('needName'); $('#name').focus(); return null; }
  const c = ($('#code').value || '').trim().toUpperCase();
  if (needCode && !/^[A-Z]{4}$/.test(c)) { $('#err').textContent = t('needCode'); $('#code').focus(); return null; }
  joinErr = '';
  return c;
}

function renderLobby() {
  const s = state;
  const me = s.players[pid];
  const players = s.order.map((p) => {
    const pl = s.players[p]; const mine = p === pid; const on = online.has(p);
    return `<div class="player ${pl.lang}">
      <div class="player-top"><span class="dot ${on ? 'on' : ''}"></span><span class="player-name">${esc(pl.name)}${mine ? ` <span class="muted">(${esc(t('you'))})</span>` : ''}</span>
        <span class="tag ${pl.lang}">${esc(t('speaks', { lang: langName(pl.lang) }))}</span>
        ${!mine && !on ? `<button class="link" data-remove="${p}">${esc(t('remove'))}</button>` : ''}</div>
      ${mine ? `<div class="seg2"><button data-mylang="ko" class="ko ${pl.lang === 'ko' ? 'on' : ''}">${esc(t('korean'))}</button><button data-mylang="en" class="en ${pl.lang === 'en' ? 'on' : ''}">${esc(t('english'))}</button></div>` : ''}
      <div class="levels">${[1, 2, 3, 4, 5].map((n) => `<button ${mine ? `data-level="${n}"` : 'disabled'} class="${pl.level === n ? 'on' : ''}">${n}</button>`).join('')}</div>
      <p class="level-name">${esc(t('level', { n: pl.level, name: S[ui].lv[pl.level] }))}</p>
    </div>`;
  }).join('');
  app.innerHTML = `${bar()}<main>
    <section class="panel">
      <div class="code-tiles" aria-label="${esc(t('code'))} ${s.code}">${s.code.split('').map((ch) => `<span>${ch}</span>`).join('')}</div>
      <div class="row" style="justify-content:center"><button class="btn" id="copy">${esc(t('copy'))}</button><button class="link" id="leave">${esc(t('leave'))}</button></div>
    </section>
    <section class="panel"><h2>${esc(t('players'))}</h2><div class="players">${players}</div></section>
    <section class="panel">
      <h2>${esc(t('mission'))}</h2>
      <div class="mission-tile"><div class="icon"><svg viewBox="0 0 180 64" width="48">${boxArt('pot', 0, 0)}</svg></div><div><b>${esc(t('dinner'))}</b><span class="hint">${esc(t('dinnerSub'))} · ${esc(t('scoring'))}</span></div></div>
    </section>
    <p class="err">${s.order.length < 2 ? esc(t('needTwo')) : ''}</p>
    <button class="btn big go" id="start" ${s.order.length < 2 || !me ? 'disabled' : ''}>${esc(t('start'))}</button>
    ${s.history?.length ? historyHtml() : ''}
  </main>`;
}
const historyHtml = () => `<section class="panel"><h2>${esc(t('history'))}</h2><ul class="history">${state.history.slice(0, 5).map((h) => `<li><span>${esc(new Date(h.at).toLocaleDateString(ui === 'ko' ? 'ko-KR' : 'en-GB', { month: 'short', day: 'numeric' }))} · ${esc(t('dinner'))}</span><span>${h.score} · ${fmtTime(h.seconds)}</span></li>`).join('')}</ul></section>`;
const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/* the speaker's card is built once per stage, so a word bank doesn't reshuffle on every update */
let cardKey = ''; let card = null; let tokens = [];
function speakerCard(stage, lang, level) {
  const key = `${state.mission.startedAt}:${state.mission.idx}:${lang}:${level}`;
  if (key !== cardKey) { cardKey = key; card = cardFor(stage, lang, level); }
  return card;
}
function tok(x, peeked) {
  if (x.t) return esc(x.t);
  if (x.blank) return '<span class="blank"></span>';
  tokens.push(x);
  return `<button class="tok ${peeked.includes(x.w) ? 'peeked' : ''}" data-tok="${tokens.length - 1}">${esc(x.w)}</button>`;
}

function renderStage() {
  const s = state; const m = s.mission; const st = m.stage;
  const speaker = speakerOf(s);
  const sp = s.players[speaker] || { name: '?', lang: 'ko', level: 1 };
  const head = bar(`<span class="chip">${m.idx + 1}/${m.total} · ${m.score}</span>`);
  tokens = [];
  if (speaker === pid && st) {
    const c = speakerCard(st, sp.lang, sp.level);
    const peeked = st.peeked || [];
    const pic = st.kind === 'put'
      ? `<div class="pic ${sp.lang}">${putPicture(st.target)}</div>`
      : `<div class="pic ${sp.lang}"><div class="steps">${st.steps.map((x, i) => `<div class="step"><span class="n">${i + 1}</span>${stepPicture(x)}</div>`).join('')}</div></div>`;
    let words = '';
    if (c.text) words += `<p class="say" lang="${sp.lang}">${c.text.map((x) => tok(x, peeked)).join('')}</p>`;
    if (c.bank) words += `<div class="bank" lang="${sp.lang}">${c.bank.map((x) => tok(x, peeked)).join('')}</div>`;
    if (c.keywords) words += `<div class="kw" lang="${sp.lang}">${c.keywords.map((x) => (x.t ? `<span class="arrow">${esc(x.t)}</span>` : tok(x, peeked))).join('')}</div>`;
    if (sp.level >= 4) words += `<p class="describe">${esc(st.kind === 'put' ? t('describe', { lang: langName(sp.lang) }) : t('describeSteps', { lang: langName(sp.lang) }))}</p>`;
    if (c.banned) words += `<p class="banned-head">${esc(t('dontSay'))}</p><div class="banned" lang="${sp.lang}">${c.banned.map((x) => tok(x, peeked)).join('')}</div>`;
    const listener = s.order.find((p) => p !== pid);
    app.innerHTML = `${head}<main>
      <div class="role ${sp.lang}">🎤 ${esc(t('youSpeak', { lang: langName(sp.lang) }))}<span class="chip">Lv ${sp.level}</span></div>
      <div class="card">${pic}${words}</div>
      <p class="hint" style="text-align:center">${esc(t('sayIt'))}${tokens.length ? `<br>${esc(t('peekHint'))}` : ''}</p>
      <div class="status">${mascot(52, 'smile', 'smile')}<span>${esc(t('waiting', { name: s.players[listener]?.name || '?' }))}</span><span class="right">${esc(t('retries', { n: m.retries }))} · ${esc(t('peeks', { n: m.peeks }))}</span></div>
      <button class="link" id="end">${esc(t('endMission'))}</button>
    </main>`;
    return;
  }
  // listener
  let body = '';
  if (st?.kind === 'put') {
    body = `<div class="choices">${st.choices.map((ch, i) => `<button class="choice ${sel === i ? 'sel' : ''}" data-pick="${i}" aria-label="${i + 1}">${sel === i ? '<span class="badge">✓</span>' : ''}${putPicture(ch)}</button>`).join('')}</div>
      <button class="btn big en" id="confirm" ${sel === null ? 'disabled' : ''}>${esc(t('confirm'))}</button>`;
  } else if (st?.kind === 'order') {
    body = `<div class="choices order">${st.choices.map((ch, i) => { const n = seq.indexOf(i); return `<button class="choice ${n >= 0 ? 'sel' : ''}" data-step="${i}">${n >= 0 ? `<span class="badge">${n + 1}</span>` : ''}${stepPicture(ch)}</button>`; }).join('')}</div>
      <div class="row"><button class="btn" id="clear" ${seq.length ? '' : 'disabled'}>${esc(t('clear'))}</button><button class="btn big en" id="confirm" style="flex:1" ${seq.length === st.choices.length ? '' : 'disabled'}>${esc(t('confirmOrder'))}</button></div>`;
  }
  app.innerHTML = `${head}<main>
    <div class="role listen">👂 ${esc(st?.kind === 'order' ? t('listenOrder') : t('listen'))}</div>
    <p class="hint" style="text-align:center"><span class="tag ${sp.lang}">${esc(langName(sp.lang))}</span> ${esc(t('speakerIs', { name: sp.name, lang: langName(sp.lang) }))} · ${esc(t('askAgain'))}</p>
    ${body}
    <p class="hint" style="text-align:center">${esc(t('retries', { n: m.retries }))} · ${esc(t('peeks', { n: m.peeks }))}</p>
    <button class="link" id="end">${esc(t('endMission'))}</button>
  </main>`;
}

function renderDone() {
  const m = state.mission;
  const words = missionWords(m.stages || []);
  const secs = Math.round((m.finishedAt - m.startedAt) / 1000);
  app.innerHTML = `${bar()}<main>
    <div class="hero">${mascot(220, 'open', 'open')}<h1 class="done-title">${esc(t('served'))}</h1></div>
    <div class="stats">
      <div class="stat score"><b>${m.score}</b><span>${esc(t('score'))}</span></div>
      <div class="stat"><b>${m.idx}/${m.total}</b><span>${esc(t('stages'))}</span></div>
      <div class="stat"><b>${fmtTime(secs)}</b><span>${esc(t('time'))}</span></div>
      <div class="stat"><b>${m.retries}</b><span>${esc(t('retriesL'))} (${POINTS.retry * m.retries})</span></div>
      <div class="stat"><b>${m.peeks}</b><span>${esc(t('peeksL'))} (${POINTS.peek * m.peeks})</span></div>
    </div>
    <section class="panel"><h2>${esc(t('keyWords'))}</h2><div class="words">${words.map((x) => `<span class="k" lang="ko">${esc(x.ko)}</span><span class="e" lang="en">${esc(x.en)}</span>`).join('')}</div></section>
    <button class="btn big go" id="again">${esc(t('again'))}</button>
    ${state.history?.length ? historyHtml() : ''}
  </main>`;
}

/* ---------------- events ---------------- */
let peekEl = null;
app.addEventListener('click', async (e) => {
  const b = (sel_) => e.target.closest(sel_);
  if (b('[data-ui]')) { if ($('#name')) profile.name = $('#name').value.trim(); ui = b('[data-ui]').dataset.ui; save('banban.ui', ui); render(); return; }
  if (b('#practise [data-lang]')) {
    profile.name = ($('#name')?.value || profile.name).trim();
    profile.lang = b('[data-lang]').dataset.lang; save('banban.profile', profile); render(); return;
  }
  if (b('#create')) {
    if (joinCheck(false) === null) return;
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    enterRoom(Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => L[x % L.length]).join('')); return;
  }
  if (b('#join')) { const c = joinCheck(true); if (c) enterRoom(c, load(`banban.pid.${c}`, null)?.pid); return; }
  if (b('[data-rejoin]')) { const c = joinCheck(true); if (c) enterRoom(c, load(`banban.pid.${c}`, null)?.pid); return; }
  if (b('[data-newplayer]')) { const c = joinCheck(true); if (c) enterRoom(c); return; }
  if (b('#copy')) {
    const link = `${location.origin}${location.pathname}?room=${state.code}`;
    try { await navigator.clipboard.writeText(link); b('#copy').textContent = t('copied'); } catch { prompt(t('copy'), link); }
    return;
  }
  if (b('#leave')) { leaveRoom(); return; }
  if (b('[data-mylang]')) { const l = b('[data-mylang]').dataset.mylang; profile.lang = l; save('banban.profile', profile); send({ type: 'profile', lang: l }); return; }
  if (b('[data-level]')) { send({ type: 'profile', level: +b('[data-level]').dataset.level }); return; }
  if (b('[data-remove]')) { send({ type: 'remove', pid: b('[data-remove]').dataset.remove }); return; }
  if (b('#start')) { send({ type: 'start', length: 'quick' }); return; }
  if (b('#end')) { if (confirm(t('endAsk'))) send({ type: 'again' }); return; }
  if (b('#again')) { send({ type: 'again' }); return; }
  if (b('[data-tok]')) {
    const x = tokens[+b('[data-tok]').dataset.tok]; if (!x) return;
    send({ type: 'peek', word: x.w });
    const r = b('[data-tok]').getBoundingClientRect();
    peekEl?.remove();
    peekEl = document.createElement('div'); peekEl.className = 'peek';
    peekEl.innerHTML = `${esc(x.peek)}<small>−1</small>`;
    peekEl.style.left = `${r.left + r.width / 2}px`; peekEl.style.top = `${r.top}px`;
    document.body.append(peekEl);
    const el = peekEl; setTimeout(() => el.remove(), 1800);
    return;
  }
  if (b('[data-pick]')) { sel = +b('[data-pick]').dataset.pick; render(); return; }
  if (b('[data-step]')) {
    const i = +b('[data-step]').dataset.step;
    seq = seq.includes(i) ? seq.filter((x) => x !== i) : [...seq, i];
    render(); return;
  }
  if (b('#clear')) { seq = []; render(); return; }
  if (b('#confirm')) {
    const st = state.mission.stage;
    if (st.kind === 'put' && sel !== null) send({ type: 'answer', choice: sel });
    if (st.kind === 'order' && seq.length === st.choices.length) send({ type: 'answer', order: seq });
  }
});
app.addEventListener('input', (e) => {
  if (e.target.id === 'code') { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); renderRejoin(); }
});
app.addEventListener('keydown', (e) => { if (e.target.id === 'code' && e.key === 'Enter') $('#join').click(); });

/* ---------------- start ---------------- */
let resumed = null;
try { resumed = JSON.parse(sessionStorage.getItem('banban.room') || 'null'); } catch { /* ignore */ }
const urlRoom = (new URLSearchParams(location.search).get('room') || '').toUpperCase();
if (resumed && profile.name && (!urlRoom || urlRoom === resumed.code)) enterRoom(resumed.code, resumed.pid);
else render();
