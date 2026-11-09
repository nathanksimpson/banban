// Cartoon drawings (thick outlines, little faces), built from parts so stages can vary
// the count, the ingredient and the container and still look alike.
const INK = '#2B1D14';
const face = (x, y, mood = 'smile') => `<circle cx="${x - 5}" cy="${y}" r="2.6" fill="${INK}"/><circle cx="${x + 5}" cy="${y}" r="2.6" fill="${INK}"/>${
  mood === 'open' ? `<path d="M${x - 4} ${y + 5}q4 5 8 0z" fill="#7A2E12" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
    : `<path d="M${x - 3} ${y + 5}q3 3 6 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`}`;

/** One ingredient, drawn in a 48×48 box at (x, y). */
export function item(name, x = 0, y = 0, mood) {
  const g = (body) => `<g transform="translate(${x} ${y})">${body}</g>`;
  switch (name) {
    case 'onion': return g(`<path d="M24 3C32 14 40 20 40 32a16 15 0 0 1-32 0C8 20 16 14 24 3Z" fill="#F5B860" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 3c-1 4-1 6 0 9" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><ellipse cx="15" cy="26" rx="3" ry="5" fill="#FFE2B0"/>${face(24, 33, mood)}`);
    case 'carrot': return g(`<path d="M14 6l5 6 5-7 5 7 5-6-3 10H17z" fill="#3DBE6A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M12 16h24l-9 30q-3 4-6 0z" fill="#FF8A3D" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M17 24h5M20 32h4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>${face(25, 23, mood)}`);
    case 'potato': return g(`<path d="M8 22c0-10 10-16 20-14s14 10 12 20-12 14-21 12S8 32 8 22z" fill="#D9A55F" stroke="${INK}" stroke-width="3.5"/><circle cx="14" cy="18" r="1.8" fill="#8A5A2B"/><circle cx="34" cy="34" r="1.8" fill="#8A5A2B"/>${face(24, 24, mood)}`);
    case 'egg': return g(`<ellipse cx="24" cy="26" rx="15" ry="19" fill="#FFF8EC" stroke="${INK}" stroke-width="3.5"/><ellipse cx="17" cy="18" rx="3" ry="5" fill="#FFFFFF"/>${face(24, 28, mood)}`);
    case 'tomato': return g(`<circle cx="24" cy="27" r="17" fill="#F25C54" stroke="${INK}" stroke-width="3.5"/><path d="M16 11l8 4 8-4-3 7h-10z" fill="#3DBE6A" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="15" cy="23" rx="3" ry="4" fill="#FF9086"/>${face(24, 29, mood)}`);
    case 'mushroom': return g(`<path d="M17 26h14v14a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" fill="#FFF4E0" stroke="${INK}" stroke-width="3.5"/><path d="M5 26a19 18 0 0 1 38 0z" fill="#E8574D" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="16" cy="18" r="3" fill="#FFF8EC"/><circle cx="30" cy="14" r="2.6" fill="#FFF8EC"/>${face(24, 34, mood)}`);
    default: return '';
  }
}

/** A container drawn in a 180×64 box at (x, y). */
export function container(name, x = 0, y = 0) {
  const g = (body) => `<g transform="translate(${x} ${y})">${body}</g>`;
  switch (name) {
    case 'pot': return g(`<rect x="0" y="18" width="22" height="11" rx="5" fill="#C9443B" stroke="${INK}" stroke-width="3.5"/><rect x="158" y="18" width="22" height="11" rx="5" fill="#C9443B" stroke="${INK}" stroke-width="3.5"/><path d="M20 12h140v30a20 20 0 0 1-20 20H40a20 20 0 0 1-20-20z" fill="#E8574D" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><rect x="12" y="2" width="156" height="15" rx="7" fill="#C9443B" stroke="${INK}" stroke-width="3.5"/><rect x="34" y="24" width="9" height="24" rx="4" fill="#FF9086"/>`);
    case 'pan': return g(`<rect x="132" y="22" width="48" height="12" rx="6" fill="#5C4433" stroke="${INK}" stroke-width="3.5"/><path d="M8 14h128v18a26 26 0 0 1-26 26H34A26 26 0 0 1 8 32z" fill="#4A4F5C" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><rect x="2" y="8" width="140" height="12" rx="6" fill="#6B7180" stroke="${INK}" stroke-width="3.5"/><rect x="24" y="26" width="30" height="7" rx="3.5" fill="#8A90A0"/>`);
    case 'bowl': return g(`<path d="M24 8h132a66 52 0 0 1-132 0z" fill="#5B8CFF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><rect x="18" y="2" width="144" height="12" rx="6" fill="#3E6FE6" stroke="${INK}" stroke-width="3.5"/><path d="M48 24q42 18 84 0" fill="none" stroke="#9DBBFF" stroke-width="5" stroke-linecap="round"/><rect x="70" y="54" width="40" height="8" rx="4" fill="#3E6FE6" stroke="${INK}" stroke-width="3"/>`);
    default: return '';
  }
}

/** "N items going into a container": the picture for a put stage (and its choices). */
export function putPicture({ item: it, count, container: box }) {
  const w = 52; const start = 110 - (count * w) / 2;
  const items = Array.from({ length: count }, (_, i) => item(it, start + i * w + 2, 4)).join('');
  return `<svg viewBox="0 0 220 140" role="img" aria-hidden="true">${items}
    <path d="M110 58v12" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M101 66l9 9 9-9" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    ${container(box, 20, 76)}</svg>`;
}

/** A small icon for a cooking verb, in a 64×64 box at (x, y). */
export function verbIcon(verb, x = 0, y = 0) {
  const g = (body) => `<g transform="translate(${x} ${y})">${body}</g>`;
  switch (verb) {
    case 'wash': return g(`<rect x="4" y="6" width="22" height="9" rx="4" fill="#9DBBFF" stroke="${INK}" stroke-width="3"/><path d="M12 15v6h22a8 8 0 0 1 8 8v4" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15v6h22a8 8 0 0 1 8 8v4" fill="none" stroke="#B8BECB" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 40c-4 6-6 8-6 11a6 6 0 0 0 12 0c0-3-2-5-6-11z" fill="#5B8CFF" stroke="${INK}" stroke-width="3"/><path d="M56 48c-3 4-4 6-4 7.5a4 4 0 0 0 8 0c0-1.5-1-3.5-4-7.5z" fill="#9DBBFF" stroke="${INK}" stroke-width="2.5"/><circle cx="26" cy="50" r="4" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/><circle cx="18" cy="56" r="3" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>`);
    case 'chop': return g(`<path d="M8 40L44 8l10 10-30 30z" fill="#DDE2EA" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><rect x="2" y="42" width="22" height="12" rx="5" transform="rotate(-42 13 48)" fill="#8A5A2B" stroke="${INK}" stroke-width="3.5"/><path d="M40 52h18" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`);
    case 'fry': return g(`<path d="M4 26h40v6a14 14 0 0 1-14 14H18A14 14 0 0 1 4 32z" fill="#4A4F5C" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><rect x="42" y="28" width="20" height="8" rx="4" fill="#5C4433" stroke="${INK}" stroke-width="3"/><path d="M14 54c0-4 4-4 4-8 0 4 4 4 4 8M26 56c0-4 4-4 4-8 0 4 4 4 4 8" fill="#FF8A3D" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 18c0-4 4-4 4-8M28 18c0-4 4-4 4-8" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`);
    case 'boil': return g(`<path d="M8 26h48v18a12 12 0 0 1-12 12H20A12 12 0 0 1 8 44z" fill="#E8574D" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><rect x="4" y="20" width="56" height="9" rx="4.5" fill="#C9443B" stroke="${INK}" stroke-width="3.5"/><circle cx="22" cy="12" r="4" fill="#9DBBFF" stroke="${INK}" stroke-width="2.5"/><circle cx="36" cy="8" r="3" fill="#9DBBFF" stroke="${INK}" stroke-width="2.5"/><circle cx="44" cy="15" r="2.5" fill="#9DBBFF" stroke="${INK}" stroke-width="2"/>`);
    default: return '';
  }
}

/** One cooking step: the action icon next to the ingredient. */
export function stepPicture({ verb, item: it }) {
  return `<svg viewBox="0 0 130 70" role="img" aria-hidden="true">${verbIcon(verb, 4, 3)}${item(it, 74, 10)}</svg>`;
}

/** The two-halves mascot: blue (Korean) and orange (English). */
export function mascot(size = 120, moodL = 'smile', moodR = 'open') {
  return `<svg width="${size}" height="${size * 0.5}" viewBox="0 0 176 88" aria-hidden="true">
    <path d="M6 86 A41 41 0 0 1 88 86 Z" fill="#5B8CFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M88 86 A41 41 0 0 1 170 86 Z" fill="#FF8A3D" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    ${face(47, 66, moodL)}${face(129, 66, moodR)}
    <ellipse cx="30" cy="76" rx="6" ry="3.5" fill="#FF9DB0"/><ellipse cx="64" cy="76" rx="6" ry="3.5" fill="#FF9DB0"/>
    <ellipse cx="112" cy="76" rx="6" ry="3.5" fill="#FF6F7F"/><ellipse cx="146" cy="76" rx="6" ry="3.5" fill="#FF6F7F"/></svg>`;
}
