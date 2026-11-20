'use strict';
// Round 4 tests. Each test name starts with the requirement ID (see spec.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, startRun, clearBoard, dummy, HTML } = require('./harness');

const rgb = hex => { const n = parseInt(String(hex).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lum = hex => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const ELEMENTS = ['fire', 'ice', 'lightning', 'earth', 'wind', 'nature', 'poison', 'arcane', 'light', 'sun', 'moon', 'darkness', 'tech', 'hyper', 'mind'];
const NEW_GM = ['doom', 'slumber', 'nightfog', 'calamity', 'hellfire', 'excalibur'];

function arena(seed, weapon) {
  const g = startRun(loadGame({ seed }), weapon || 'sword');
  clearBoard(g);
  g.run('P.hp=P.maxHp=1e9;P.iframes=1e9;P.crit=0;');
  return g;
}
function cast(g, id, x, y) {
  g.run(`P.spells[0]={id:'${id}',lvl:1,cd:0,cdMax:1};`);
  g.aimAt(x, y);
  g.run('castSpell(0);');
}
// Record every drawFigure / drawPiece call made by one render().
function figures(g) {
  g.run(`var __figs=[];{const f=drawFigure,p=drawPiece;
    drawFigure=(k,x,y,s,o)=>{__figs.push({fig:k,s,o:o||{}});return f(k,x,y,s,o);};
    drawPiece=(k,x,y,s,o)=>{__figs.push({piece:k,s,fill:o&&o.fill});return p(k,x,y,s,o);};
    cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();drawFigure=f;drawPiece=p;}`);
  return JSON.parse(g.run('JSON.stringify(__figs.map(c=>({fig:c.fig,piece:c.piece,s:c.s,fill:typeof c.fill==="string"?c.fill:null})))'));
}

/* ---------- R55 - R62 fantasy theme ---------- */

test('R55 R62 the fantasy theme is the default and the chess theme is a saved option', () => {
  const g = loadGame();
  assert.equal(g.run('LOOK'), 'fantasy');
  g.run("setLook('chess')");
  assert.equal(g.run('LOOK'), 'chess');
  assert.equal(g.storage.get('slaughtermate_look'), 'chess', 'the choice is saved');
  const g2 = loadGame({ storage: { slaughtermate_look: 'chess' } });
  assert.equal(g2.run('LOOK'), 'chess', 'and remembered next session');
  g2.run("setLook('fantasy')");
  assert.equal(g2.storage.get('slaughtermate_look'), 'fantasy');
});

test('R62 a start-screen button switches between the fantasy and chess themes', () => {
  assert.match(HTML, /id="lookBtn"/, 'menu has a theme button');
  const g = loadGame();
  g.run('showMenu();');
  assert.match(g.elements('lookBtn').textContent, /chess/i, 'offers the chess theme');
  g.elements('lookBtn').onclick();
  assert.equal(g.run('LOOK'), 'chess');
  assert.equal(g.run('G.state'), 'menu', 'still on the start screen');
  assert.match(g.elements('lookBtn').textContent, /fantasy/i, 'offers the way back');
  g.elements('lookBtn').onclick();
  assert.equal(g.run('LOOK'), 'fantasy');
});

test('R55 enemy behaviour is identical in both themes', () => {
  const run = look => {
    const g = loadGame({ seed: 555, storage: { slaughtermate_look: look } });
    startRun(g, 'sword');
    g.run('P.iframes=1e9;');
    g.step(3);
    return g.run('JSON.stringify(G.enemies.map(e=>[e.type,Math.round(e.x),Math.round(e.y),e.st]))');
  };
  assert.equal(run('fantasy'), run('chess'));
});

test('R56 the player is a knight, wizard or archer depending on the weapon', () => {
  const want = { sword: 'knight', hammer: 'knight', shield: 'knight', club: 'knight', scythe: 'knight', tome: 'wizard', staff: 'wizard', bow: 'archer' };
  for (const [w, cls] of Object.entries(want)) {
    const g = arena(56, w);
    assert.equal(g.run('playerClass()'), cls, w);
    const figs = figures(g);
    assert.ok(figs.some(f => f.fig === cls), w + ' is drawn as a ' + cls);
    assert.ok(!figs.some(f => f.piece), 'no chess pieces in the fantasy theme');
  }
});

test('R56 R6 promotion gives a class rank title with the same bonuses and a visual upgrade', () => {
  const g = arena(561, 'staff');
  const names = [];
  for (let f = 1; f <= 5; f++) {
    g.run('spawnBoss();hitEnemy(G.boss,1e13);');
    names.push(g.run('rankName()'));
    assert.ok(g.run('G.banner.text').includes(g.run('rankName()')), 'banner names the new rank');
    assert.doesNotMatch(g.run('G.banner.text'), /Pawn|Knight|Bishop|Rook|Queen|King/, 'no chess piece names');
    g.run('G.floor++;startFloor();G.state="play";');
  }
  assert.equal(new Set(names).size, 5, 'five different ranks');
  assert.equal(g.run('RANKS.wizard.length'), 6);
  assert.equal(g.run('RANKS.knight[0]'), 'Squire');
  assert.equal(g.run('RANKS.knight[5]'), 'Champion');
  assert.equal(g.run('P.form'), 5, 'same promotion counter, so the same bonuses apply');
  // the rank changes the drawing: more parts are drawn at a higher rank
  const count = form => {
    const h = loadGame({ seed: 562, recordCtx: true });
    startRun(h, 'sword'); clearBoard(h);
    h.run(`P.form=${form};cam.x=P.x-VW/2;cam.y=P.y-VH/2;`);
    h.ctxCalls.length = 0; h.run('drawPlayer();');
    return h.ctxCalls.length;
  };
  assert.ok(count(5) > count(0) + 10, 'a higher rank adds visual upgrades');
});

test('R57 enemies are goblins, skeletons, apprentice mages, minotaurs, witches and royal guards', () => {
  const g = arena(57);
  assert.equal(g.run('JSON.stringify(ENEMY_LOOK)'),
    JSON.stringify({ pawn: 'goblin', knight: 'skeleton', bishop: 'apprentice', rook: 'minotaur', queen: 'witch', king: 'guard' }));
  let x = 0;
  for (const t of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) { g.run(`spawnEnemy('${t}',P.x-300+${x},P.y+150)`); x += 100; }
  const figs = figures(g).map(f => f.fig);
  for (const k of ['goblin', 'skeleton', 'apprentice', 'minotaur', 'witch', 'guard']) assert.ok(figs.includes(k), k + ' drawn');
  assert.equal(g.run('Object.keys(AI).join()'), 'pawn,knight,bishop,rook,queen,watchtower,king', 'same AI as before');
});

test('R58 the six bosses have fantasy names and looks', () => {
  const g = arena(58);
  assert.equal(g.run('BOSSES.map(b=>b.fname).join("|")'),
    'Goblin Chief|Evil Prince|Red Mage|Red Dragon|Witch Queen|Tyrant King');
  const looks = ['goblinChief', 'evilPrince', 'redMage', 'redDragon', 'witchQueen', 'tyrantKing'];
  for (let f = 1; f <= 6; f++) {
    g.run(`G.floor=${f};G.enemies=[];spawnBoss();G.boss.x=P.x+200;G.boss.y=P.y;`);
    assert.equal(g.run('G.boss.name'), g.run(`BOSSES[${f - 1}].fname`));
    assert.match(g.run('G.banner.text'), new RegExp(g.run(`BOSSES[${f - 1}].fname`)));
    assert.ok(figures(g).some(c => c.fig === looks[f - 1]), looks[f - 1] + ' drawn');
  }
  const c = loadGame({ storage: { slaughtermate_look: 'chess' } });
  startRun(c, 'sword');
  c.run('spawnBoss();');
  assert.equal(c.run('G.boss.name'), 'Iron Pawn', 'the chess theme keeps the chess names');
});

test('R59 the six fantasy floors and their names', () => {
  const g = startRun(loadGame({ seed: 59 }), 'sword');
  const names = ['The Great Plains', 'The Old Village', 'The Magic School', 'The Dragon Ruins', 'The Royal Witch Swamp', "The Evil King's Castle"];
  assert.equal(g.run('FANTASY_FLOORS.map(t=>t.name).join("|")'), names.join('|'));
  for (let f = 1; f <= 6; f++) {
    g.run(`G.floor=${f};startFloor();G.state='play';`);
    assert.equal(g.run('G.theme.name'), names[f - 1]);
    assert.ok(g.run('G.banner.text').includes(names[f - 1]), 'banner shows the floor name');
  }
});

test('R59 each fantasy floor has its own ground, structures and decorations, and no chess board', () => {
  const T = i => loadGame().run(`FANTASY_FLOORS[${i}]`);
  const green = c => { const [r, gg, b] = rgb(c); return gg > r && gg > b; };
  assert.ok(green(T(0).tileA) && green(T(1).tileA), 'plains and village are grassy');
  { const [r, gg, b] = rgb(T(2).tileA); assert.ok(b > r && b > gg, 'magic school is azure'); }
  { const [r, gg, b] = rgb(T(3).tileA); assert.ok(Math.max(r, gg, b) - Math.min(r, gg, b) < 40, 'dragon ruins are grey stone'); }
  assert.ok(green(T(4).tileA) && lum(T(4).tileA) < lum(T(0).tileA), 'swamp is a darker green');
  { const t = T(5); assert.ok(lum(t.tileA) < 0.2, 'castle floor is black'); const [r, gg, b] = rgb(t.carpet); assert.ok(r > 120 && gg < 60 && b < 60, 'red carpet'); const [ar, ag, ab] = rgb(t.gold); assert.ok(ar > 180 && ag > 130 && ab < 120, 'gold trim'); }
  const deco = { 1: ['tree', 'gnome'], 2: ['tree', 'well'], 3: ['shelf', 'desk'], 4: ['ruin', 'gem'], 5: ['reeds', 'pool'], 6: ['statue', 'banner'] };
  for (let f = 1; f <= 6; f++) {
    const g = startRun(loadGame({ seed: 590 + f }), 'sword');
    g.run(`G.floor=${f};startFloor();G.state='play';`);
    const kinds = new Set(g.run('G.decor.map(d=>d.k)'));
    for (const k of deco[f]) assert.ok(kinds.has(k), `floor ${f} has ${k} decorations`);
    // the ground is not a checkerboard: drawGround never fills grid tiles in alternating colours
    const h = loadGame({ seed: 5900 + f, recordCtx: true });
    startRun(h, 'sword');
    h.run(`G.floor=${f};startFloor();G.state='play';cam.x=P.x-VW/2;cam.y=P.y-VH/2;`);
    h.ctxCalls.length = 0; h.run('drawGround();');
    const rects = h.ctxCalls.filter(([k, a]) => k === 'fillRect' && a[2] === 100 && a[3] === 100).length;
    assert.ok(rects < 10, `floor ${f} ground is not drawn as board squares (${rects})`);
    h.run('render();');
  }
});

test('R59 R24 R25 the swamp keeps its witch towers and the castle keeps its maze of halls', () => {
  const g = startRun(loadGame({ seed: 5925 }), 'sword');
  g.run("G.floor=5;startFloor();G.state='play';");
  assert.equal(g.run("G.enemies.filter(e=>e.type==='watchtower').length"), g.run('FANTASY_FLOORS[4].hostile'));
  assert.ok(g.run('FANTASY_FLOORS[4].hostile') >= 3);
  g.run("G.floor=6;startFloor();G.state='play';");
  assert.ok(g.run("G.structs.filter(s=>s.k==='maze').length") >= 20, 'castle halls');
  for (let f = 1; f <= 6; f++) {
    const t = g.run(`[FANTASY_FLOORS[${f - 1}],FLOOR_THEMES[${f - 1}]]`);
    for (const k of ['castles', 'towns', 'hostile', 'maze']) assert.equal(String(t[0][k]), String(t[1][k]), `floor ${f} ${k} unchanged`);
  }
});

test('R60 the game is called Magic Rush with fantasy text; the chess theme restores Slaughtermate', () => {
  assert.match(HTML, /<title>Magic Rush<\/title>/);
  const g = loadGame();
  g.run('showMenu();');
  assert.match(g.elements('gameTitle').textContent, /MAGIC RUSH/);
  assert.equal(g.run('document.title'), 'Magic Rush');
  const menuText = ['gameSub', 'hallTitle', 'menuHint', 'pauseSub', 'quitBtn'].map(id => g.elements(id).textContent).join(' ');
  assert.doesNotMatch(menuText, /board|pawn|checkmate|chess/i, 'no chess wording: ' + menuText);
  // end screens
  startRun(g, 'sword');
  g.run('endRun(true);');
  const win = g.elements('end').innerHTML;
  assert.doesNotMatch(win, /checkmate|pawn|board/i);
  assert.match(win, /victory/i);
  const g2 = startRun(loadGame(), 'bow');
  g2.run('endRun(false);');
  assert.doesNotMatch(g2.elements('end').innerHTML, /checkmate|board/i);
  // shop and HUD text
  g2.run('G.state="play";P.gold=999;openShop();');
  assert.doesNotMatch(g2.elements('shop').innerHTML, /pawn|board|fragment/i);
  const c = loadGame({ storage: { slaughtermate_look: 'chess' } });
  c.run('showMenu();');
  assert.match(c.elements('gameTitle').textContent, /SLAUGHTERMATE/);
  assert.equal(c.run('document.title'), 'Slaughtermate');
  startRun(c, 'sword');
  c.run('endRun(true);');
  assert.match(c.elements('end').innerHTML, /CHECKMATE/);
});

test('R60 the Windows build is named MagicRush.exe', () => {
  const fs = require('node:fs');
  const ps = fs.readFileSync(require('node:path').join(__dirname, '..', 'desktop', 'build.ps1'), 'utf8');
  assert.match(ps, /MagicRush\.exe/);
});

test('R61 merchants stand beside the cart (pawns in the chess theme)', () => {
  const g = arena(61);
  g.run('spawnBoss();hitEnemy(G.boss,1e13);P.x=WORLD/2+900;P.y=WORLD/2;');
  g.step(2);
  g.run('P.x=WORLD/2+200;');
  const figs = figures(g);
  assert.equal(figs.filter(f => f.fig === 'merchant').length, 3, 'three merchants');
  assert.ok(!figs.some(f => f.piece === 'pawn'), 'no pawns');
  const c = loadGame({ seed: 61, storage: { slaughtermate_look: 'chess' } });
  startRun(c, 'sword'); clearBoard(c);
  c.run('P.iframes=1e9;spawnBoss();hitEnemy(G.boss,1e13);P.x=WORLD/2+200;P.y=WORLD/2;');
  c.step(2);
  assert.equal(figures(c).filter(f => f.piece === 'pawn' && f.fill && lum(f.fill) > 0.8).length, 3, 'three white pawns in chess');
});

/* ---------- R63 death animations ---------- */

test('R63 enemies fall over and vanish in a puff', () => {
  const g = arena(63);
  g.run("var E=spawnEnemy('knight',P.x+150,P.y);hitEnemy(E,1e9);");
  assert.equal(g.run('G.corpses.length'), 1, 'a falling body is left behind');
  assert.equal(g.run('G.corpses[0].fig'), 'skeleton');
  const a0 = g.run('corpseAngle(G.corpses[0])');
  g.step(0.25);
  const a1 = g.run('corpseAngle(G.corpses[0])');
  assert.ok(Math.abs(a1) > Math.abs(a0) && Math.abs(a1) > 0.5, 'it tips over');
  g.run('G.parts=[];');
  figures(g);
  g.step(0.6);
  assert.equal(g.run('G.corpses.length'), 0, 'then it is gone');
  assert.ok(g.run("G.parts.filter(p=>p.shape==='poof').length") >= 6, 'in a puff of smoke');
});

test('R63 the player falls over and poofs too', () => {
  const g = arena(631);
  g.run('P.iframes=0;P.hp=P.maxHp=10;P.armor=0;P.shield=0;damagePlayer(100);');
  assert.equal(g.run('G.state'), 'over');
  assert.ok(g.run("G.corpses.some(c=>c.player&&c.fig==='knight')"), 'the player body falls');
  g.run('for(let i=0;i<60;i++){stepCorpses(1/60);stepParticles(1/60);}');
  assert.ok(g.run("G.parts.some(p=>p.shape==='poof')"), 'and poofs, even on the game-over screen');
});

test('R63 bosses release a large burst when defeated', () => {
  const g = arena(632);
  g.run('spawnBoss();G.boss.x=P.x+200;G.boss.y=P.y;G.parts=[];G.fx=[];hitEnemy(G.boss,1e13);');
  assert.ok(g.run('G.parts.length') >= 150, 'many particles');
  assert.ok(g.run("G.fx.filter(f=>f.kind==='ring'&&f.r>=350).length") >= 2, 'large shockwave rings');
  assert.ok(g.run('G.shake') >= 20);
});

test('R63 in the chess theme pieces shatter instead of falling over', () => {
  const g = loadGame({ seed: 633, storage: { slaughtermate_look: 'chess' } });
  startRun(g, 'sword'); clearBoard(g);
  g.run("G.parts=[];var E=spawnEnemy('rook',P.x+150,P.y);hitEnemy(E,1e9);");
  assert.equal(g.run('G.corpses.length'), 0, 'no falling body');
  assert.ok(g.run("G.parts.filter(p=>p.shape==='shard').length") >= 10, 'shards fly out');
  g.run('P.iframes=0;P.hp=P.maxHp=10;P.armor=0;G.parts=[];damagePlayer(100);');
  assert.ok(g.run("G.parts.filter(p=>p.shape==='shard').length") >= 10, 'the player shatters too');
});

/* ---------- R64 gold ---------- */

test('R64 enemies drop gold bars, shown as gold in the HUD and the shop', () => {
  const g = arena(64);
  g.run('for(let i=0;i<60;i++){const e=spawnEnemy("pawn",P.x+300,P.y);hitEnemy(e,1e9);}');
  assert.ok(g.run("G.pickups.some(p=>p.k==='frag')"), 'loot drops');
  g.run('var bars=0,shards=0;{const b=drawGoldBar,s=drawShard;drawGoldBar=(...a)=>{bars++;return b(...a);};drawShard=(...a)=>{shards++;return s(...a);};}');
  g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();');
  assert.ok(g.run('bars') >= 2, 'pickups and HUD draw gold bars');
  assert.equal(g.run('shards'), 0, 'no fragment shards');
  g.run('P.magnet=2000;');
  const before = g.run('P.gold');
  g.step(0.7);
  assert.ok(g.run('P.gold') > before);
  assert.ok(g.run("G.texts.some(t=>/gold/i.test(t.txt))"), 'pickup text says gold');
  g.run('P.gold=5000;openShop();');
  const html = g.elements('shop').innerHTML + g.elements('shSpells').children.map(c => c.innerHTML).join('');
  assert.match(html, /\bgold\b/i);
  assert.match(html, /class="goldbar"/, 'gold bar icon');
  assert.doesNotMatch(html, /fragment/i);
});

/* ---------- R65 spell icons ---------- */

test('R65 every element and the Grandmaster tier has its own icon', () => {
  const g = loadGame();
  const keys = ELEMENTS.concat('grandmaster');
  for (const k of keys) {
    assert.equal(g.run(`Array.isArray(ICONS['${k}'])&&ICONS['${k}'].length>0`), true, k + ' icon');
    assert.match(g.run(`iconSVG('${k}',20)`), /^<svg[\s\S]*<path/, k + ' svg');
  }
  const ds = keys.map(k => g.run(`ICONS['${k}'].map(p=>p.d).join()`));
  assert.equal(new Set(ds).size, keys.length, 'all icons differ');
  assert.equal(g.run("spellIcon(SPELL_BY_ID.despair)"), 'grandmaster');
  assert.equal(g.run("spellIcon(SPELL_BY_ID.ember)"), 'fire');
});

test('R65 the HUD slots, cards and logbook show icons instead of stars', () => {
  const g = arena(65);
  g.run("P.spells=[{id:'ember',lvl:1,cd:0,cdMax:1},{id:'quake',lvl:1,cd:0,cdMax:1},{id:'despair',lvl:1,cd:0,cdMax:1},null,null];");
  g.run(`var icons=[],texts=[];{const di=drawIcon,t=txt;drawIcon=(k,...a)=>{icons.push(k);return di(k,...a);};txt=(s,...a)=>{texts.push(String(s));return t(s,...a);};
    cam.x=P.x-VW/2;cam.y=P.y-VH/2;drawHUD();drawIcon=di;txt=t;}`);
  assert.equal(g.run('icons.join()'), 'fire,earth,grandmaster');
  assert.ok(g.run("texts.every(s=>!/[★♛]/.test(s))"), 'no stars in the HUD');
  assert.match(g.run("spellCardHTML('ember')"), /class="sico"/);
  assert.doesNotMatch(g.run("spellCardHTML('supernova')"), /★/);
  g.run("unlockSpell('ember');showLogbook();");
  assert.match(g.elements('logbook').innerHTML, /class="sico"/);
});

/* ---------- R66 earth ---------- */

test('R66 earth particles are rocks and cracks, and its areas are solid brown', () => {
  const g = loadGame({ recordCtx: true });
  assert.equal(g.run('EL_PART.earth'), 'rock');
  assert.equal(g.run('EL_AREA.earth'), 'solid');
  g.run("G.parts=[];for(let i=0;i<200;i++)elPart('earth',0,0);");
  const shapes = new Set(g.run('G.parts.map(p=>p.shape)'));
  assert.ok(shapes.has('rock') && shapes.has('crack'), 'rocks and cracks');
  assert.equal(g.run("typeof PART_DRAW.rock+typeof PART_DRAW.crack"), 'functionfunction');
  g.run('cam.x=0;cam.y=0;');
  g.ctxCalls.length = 0;
  assert.equal(g.run("drawArea('earth',300,300,150,1,0.5)"), 'solid');
  const fills = g.ctxCalls.filter(([k]) => k === 'set:fillStyle').map(([, a]) => String(a[0]));
  const brown = fills.find(c => /^#/.test(c) && (([r, gg, b]) => r > gg && gg > b && r > 70 && r < 200)(rgb(c)));
  assert.ok(brown, 'brown fill: ' + fills.join());
  const alphas = g.ctxCalls.filter(([k]) => k === 'set:globalAlpha').map(([, a]) => a[0]);
  assert.ok(Math.max(...alphas) >= 0.75, 'solid, not faint');
});

/* ---------- R67 - R69 Grandmaster redesigns ---------- */

test('R67 Game of Despair: two rings of pieces slow down, rise and fade, and the crown shatters', () => {
  const g = arena(67);
  cast(g, 'despair', g.run('P.x+300'), g.run('P.y'));
  g.step(0.1);
  const rings = g.run("JSON.stringify([...new Set(G.rituals[0].phantoms.map(p=>p.ring))])");
  assert.equal(rings, '[0,1]', 'two rings of pieces');
  assert.ok(g.run('G.rituals[0].phantoms.length') >= 12);
  assert.equal(g.run("G.rituals[0].phantoms.filter(p=>p.ring===0).map(p=>p.type).sort().join()"), 'bishop,king,knight,pawn,queen,rook', 'still chess pieces');
  const B = g.run('G.rituals[0].burst');
  assert.ok(g.run(`despairSpin(0.6)>despairSpin(0.97)*2`), 'the dance slows down near the end');
  g.run(`G.rituals[0].t=${B}-0.15;`);
  g.step(1 / 60);
  assert.ok(g.run('G.rituals[0].phantoms.every(p=>p.rise>0)'), 'the pieces ascend');
  assert.ok(g.run('despairFade(G.rituals[0])<0.6'), 'and fade');
  assert.ok(g.run('G.rituals[0].crownBroken'), 'the crown shatters before the burst');
  assert.ok(g.run("G.parts.some(p=>p.shape==='shard')"), 'crown shards');
  assert.equal(g.run('G.rituals.length'), 1, 'the burst has not happened yet');
  g.run('render();');
  g.step(0.3);
  assert.equal(g.run('G.rituals.length'), 0, 'then it bursts');
});

test('R68 Mental Inversion: the pulse is vivid', () => {
  const g = loadGame({ seed: 68, recordCtx: true });
  startRun(g, 'sword'); clearBoard(g);
  cast(g, 'inversion', g.run('P.x+300'), g.run('P.y'));
  const rings = g.run("G.fx.filter(f=>f.kind==='ring')");
  assert.ok(rings.length >= 4, 'several pulse rings');
  assert.ok(rings.some(r => r.w >= 30), 'a thick leading ring');
  g.step(0.15);
  g.ctxCalls.length = 0;
  g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;drawRitualGround();');
  assert.ok(g.ctxCalls.some(([k, a]) => k === 'set:globalCompositeOperation' && a[0] === 'lighter'), 'glowing pulse band');
  assert.ok(g.ctxCalls.filter(([k, a]) => k === 'set:fillStyle' && /hsl/.test(String(a[0]))).length >= 3, 'colour-shifting band');
});

test('R69 Grand Seal: crimson, 4 glyphs in a square chained to one large portal', () => {
  const g = arena(69);
  const [r, gg, b] = rgb(g.run('SPELL_BY_ID.seal.col'));
  assert.ok(r > 170 && gg < 60 && b < 80, 'crimson red');
  const cx = g.run('P.x+400'), cy = g.run('P.y');
  g.run(`var I=[];for(let k=0;k<6;k++){const a=k/6*TAU,e=spawnEnemy('pawn',${cx}+Math.cos(a)*330,${cy}+Math.sin(a)*330);e.hp=e.maxHp=1e7;e.dmg=0;e.speed=0;I.push(e);}`);
  cast(g, 'seal', cx, cy);
  g.step(0.5);
  const R = g.run("G.rituals.find(r=>r.kind==='seal')");
  assert.equal(R.glyphs.length, 4, 'four glyphs');
  assert.equal(R.portals, undefined, 'no ring of portals any more');
  const sides = [0, 1, 2, 3].map(i => Math.hypot(R.glyphs[i].x - R.glyphs[(i + 1) % 4].x, R.glyphs[i].y - R.glyphs[(i + 1) % 4].y));
  assert.ok(Math.max(...sides) - Math.min(...sides) < 1, 'a square');
  assert.ok(sides[0] > R.r, 'large and spaced out');
  assert.ok(Math.abs(R.portal.x - cx) < 1 && Math.abs(R.portal.y - cy) < 1, 'one central portal');
  assert.ok(R.links.length >= 12, 'many chains');
  assert.ok(R.links.filter(l => Math.hypot(l.bx - R.portal.x, l.by - R.portal.y) < 1).length >= 8, 'chains run to the portal');
  const d0 = g.run('I.reduce((a,e)=>a+Math.hypot(e.x-G.rituals[0].portal.x,e.y-G.rituals[0].portal.y),0)');
  g.step(1);
  assert.ok(g.run('I.reduce((a,e)=>a+Math.hypot(e.x-G.rituals[0].portal.x,e.y-G.rituals[0].portal.y),0)') < d0 * 0.8, 'the portal pulls enemies in');
  g.run('render();');
  g.step(2);
  assert.ok(g.run(`I.every(e=>e.maxHp-e.hp>=SPELL_BY_ID.seal.dmg*0.9&&e.frozenT>0)`), 'explodes and freezes');
});

/* ---------- R70 - R75 new Grandmaster spells ---------- */

test('R70-R75 six new Grandmaster spells join the tier', () => {
  const g = loadGame();
  const ids = g.run('GM_SPELLS.map(s=>s.id)');
  for (const id of NEW_GM) assert.ok(ids.includes(id), id);
  assert.equal(g.run('GM_SPELLS.length'), 9);
  assert.equal(g.run("SPELL_BY_ID.doom.name+'|'+SPELL_BY_ID.slumber.name+'|'+SPELL_BY_ID.nightfog.name+'|'+SPELL_BY_ID.calamity.name+'|'+SPELL_BY_ID.hellfire.name+'|'+SPELL_BY_ID.excalibur.name"),
    'Doom Desire|Sweet Slumber|Fog of the Nightmare|Artificial Calamity|Hellfire|Excalibur');
  assert.ok(g.run('GM_SPELLS.every(s=>s.tier===6&&s.cd>=30&&s.desc.length>40)'));
  assert.equal(g.run('SPELLS.length'), 75, 'tiers 1-5 untouched');
});

test('R70 Doom Desire marks every enemy on screen, slows them, then grey pillars smite them', () => {
  const g = arena(70);
  g.run(`var A=spawnEnemy('rook',P.x+300,P.y),B=spawnEnemy('pawn',P.x-400,P.y+200),N=spawnEnemy('pawn',P.x+250,P.y+60),F=spawnEnemy('pawn',P.x+1500,P.y);
    for(const e of [A,B,N,F]){e.hp=e.maxHp=1e7;e.dmg=0;e.stunT=1e9;}N.hp=N.maxHp=1e7;`);
  cast(g, 'doom', g.run('P.x+300'), g.run('P.y'));
  assert.ok(g.run('A.doomT>0&&B.doomT>0&&N.doomT>0'), 'on-screen enemies are marked');
  assert.ok(!(g.run('F.doomT') > 0), 'off-screen enemies are not');
  assert.ok(g.run("G.fx.filter(f=>f.kind==='beam').length") >= 3, 'a line to each target');
  const weak = g.run('A.maxHp-A.hp');
  assert.ok(weak > 0 && weak < g.run('SPELL_BY_ID.doom.dmg'), 'the line is weak');
  g.step(2);
  assert.ok(g.run('B.slowT>0'), 'marked enemies stay slowed');
  assert.ok(g.run('A.maxHp-A.hp') < weak * 2, 'no smiting yet');
  g.run('render();');
  g.step(3.5);
  g.run('render();');
  assert.ok(g.run("G.rituals[0].pillars.length") >= 9, 'many pillars');
  g.step(2);
  const smite = g.run('SPELL_BY_ID.doom.dmg');
  assert.ok(g.run('A.maxHp-A.hp') >= smite * 2, 'repeated smites on a marked enemy');
  assert.ok(g.run('N.maxHp-N.hp') >= smite, 'the large area hits its neighbours too');
  assert.equal(g.run('F.hp'), g.run('F.maxHp'));
});

test('R71 Sweet Slumber pulls enemies into a fairy vortex, then they explode and sleep for 7 s', () => {
  const g = arena(71);
  const cx = g.run('P.x+350'), cy = g.run('P.y');
  g.run(`var I=[];for(let k=0;k<5;k++){const a=k/5*TAU,e=spawnEnemy('pawn',${cx}+Math.cos(a)*380,${cy}+Math.sin(a)*380);e.hp=e.maxHp=1e7;e.dmg=0;e.stunT=1e9;I.push(e);}`);
  g.run('spawnBoss();G.boss.x=' + cx + ';G.boss.y=' + (cy + 150) + ';G.boss.atkT=1e9;G.boss.hp=G.boss.maxHp=1e9;');
  cast(g, 'slumber', cx, cy);
  const far = () => g.run(`I.reduce((a,e)=>a+Math.hypot(e.x-${cx},e.y-${cy}),0)`);
  const d0 = far();
  g.step(1);
  const f1 = g.run('G.rituals[0].fairies.length');
  assert.ok(far() < d0 * 0.7, 'a strong pull into the vortex');
  g.step(1.5);
  assert.ok(g.run('G.rituals[0].fairies.length') > f1, 'more fairy outlines form as it goes on');
  g.run('render();');
  assert.equal(g.run('I[0].hp'), g.run('I[0].maxHp'), 'no damage during the pull');
  g.step(0.6);
  assert.ok(g.run('I.every(e=>e.maxHp-e.hp>=SPELL_BY_ID.slumber.dmg*0.9)'), 'the fairies explode for large damage');
  assert.ok(g.run('I.every(e=>e.sleepT>6.5)'), 'and enemies fall asleep for 7 s');
  assert.ok(!(g.run('G.boss.sleepT') > 0) && g.run('G.boss.slowT') > 5, 'the boss is slowed instead');
  // a sleeping enemy does not move or hurt the player, and damage does not wake it
  g.run('var S=I[0];S.stunT=0;S.dmg=50;S.speed=200;P.iframes=0;P.hp=P.maxHp=1000;S.x=P.x+5;S.y=P.y;');
  const sx = g.run('S.x'), hp = g.run('P.hp');
  g.step(0.5);
  assert.equal(g.run('P.hp'), hp, 'sleepers do not attack');
  g.run('hitEnemy(S,10);');
  g.step(0.5);
  assert.ok(g.run('S.sleepT>0'), 'damage does not wake it');
  assert.ok(Math.abs(g.run('S.x') - sx) < 2, 'it does not move');
  g.step(6.5);
  assert.ok(g.run('S.sleepT<=0'), 'it wakes after 7 s');
});

test('R72 Fog of the Nightmare: a swarm of black fog circles where hands attack, and attackers get a fog of their own', () => {
  const g = arena(72);
  g.run(`var A=spawnEnemy('pawn',P.x+120,P.y);A.hp=A.maxHp=1e7;A.dmg=0;A.stunT=1e9;`);
  cast(g, 'nightfog', g.run('P.x+300'), g.run('P.y'));
  const R = g.run("G.rituals.find(r=>r.kind==='nightfog')");
  assert.ok(R.blobs.length >= 8, 'a swarm of circles');
  const radii = R.blobs.map(b => b.r);
  assert.ok(Math.max(...radii) >= 220 && Math.max(...radii) >= Math.min(...radii) * 2, 'large and massive circles');
  g.step(2);
  assert.ok(g.run('A.maxHp-A.hp') >= g.run('SPELL_BY_ID.nightfog.dmg') * 2, 'hands keep attacking inside the fog');
  assert.ok(g.run("G.fx.some(f=>f.kind==='fogHand')"), 'fog hands are drawn');
  g.run('render();');
  // the fog follows the player
  g.run('P.x+=200;');
  g.step(0.1);
  assert.ok(Math.abs(g.run("G.rituals.find(r=>r.kind==='nightfog').x") - g.run('P.x')) < 1);
  // an enemy outside the fog that hits the player gets a small fog that hurts it
  g.run("var O=spawnEnemy('bishop',P.x+1100,P.y);O.hp=O.maxHp=1e7;O.stunT=1e9;P.iframes=0;");
  assert.equal(g.run('inNightFog(O)'), false);
  g.run('damagePlayer(5,O);');
  assert.ok(g.run("G.rituals.some(r=>r.kind==='fogmini'&&r.e===O)"), 'a small fog spawns on the attacker');
  g.step(2);
  assert.ok(g.run('O.maxHp-O.hp') > 0, 'and attacks it');
  // enemy shots carry their shooter, so ranged attackers count too
  g.run("var Q=spawnEnemy('bishop',P.x+400,P.y+300);Q.hp=Q.maxHp=1e7;Q.cd=0;G.eproj=[];");
  g.step(1 / 60);
  assert.ok(g.run('G.eproj.some(p=>p.src===Q)'), 'projectiles remember who fired them');
});

test('R73 Artificial Calamity slows, then explodes after 8 s and turns enemies into goblins', () => {
  const g = arena(73);
  const cx = g.run('P.x+300'), cy = g.run('P.y');
  g.run(`var A=spawnEnemy('rook',${cx + 100},${cy}),B=spawnEnemy('queen',${cx - 150},${cy + 100}),F=spawnEnemy('knight',${cx + 1400},${cy});
    for(const e of [A,B,F]){e.hp=e.maxHp=1e7;e.dmg=0;e.stunT=1e9;}`);
  g.run(`spawnBoss();G.boss.x=${cx};G.boss.y=${cy - 120};G.boss.atkT=1e9;G.boss.speed=0;G.boss.hp=G.boss.maxHp=1e9;`);
  cast(g, 'calamity', cx, cy);
  g.step(1);
  assert.ok(g.run('A.slowT>0&&B.slowT>0'), 'the reactor slows enemies around it');
  g.run('render();');
  g.step(6.8);
  assert.equal(g.run("G.rituals.filter(r=>r.kind==='calamity').length"), 1, 'still running before 8 s');
  assert.equal(g.run('A.hp'), g.run('A.maxHp'));
  g.step(0.4);
  assert.equal(g.run("G.rituals.filter(r=>r.kind==='calamity').length"), 0, 'it explodes at 8 s');
  const types = g.run(`G.enemies.filter(e=>!e.dead&&!e.boss&&Math.hypot(e.x-${cx},e.y-${cy})<500).map(e=>e.type)`);
  assert.ok(types.length >= 2 && types.every(t => t === 'pawn'), 'survivors in the blast are now goblins');
  const gob = g.run(`G.enemies.find(e=>!e.dead&&!e.boss&&e.type==='pawn'&&Math.hypot(e.x-${cx},e.y-${cy})<500)`);
  const frac = (1e7 - g.run('SPELL_BY_ID.calamity.dmg')) / 1e7;
  assert.ok(Math.abs(gob.hp / gob.maxHp - frac) < 0.01, 'they keep their HP percentage');
  assert.ok(gob.maxHp < 1e5, 'with goblin stats');
  assert.ok(g.run('A.dead&&B.dead'), 'the old bodies are gone');
  assert.equal(g.run('G.boss.type'), 'pawn', 'boss keeps its type (floor 1 boss)');
  assert.ok(g.run('G.boss.maxHp-G.boss.hp') >= g.run('SPELL_BY_ID.calamity.dmg') * 0.9, 'the boss takes the damage');
  assert.ok(g.run('G.boss===G.enemies.find(e=>e.boss)'), 'and is not replaced');
  assert.equal(g.run('F.type'), 'knight', 'enemies outside the blast are unchanged');
  assert.equal(g.run('G.kills'), 0, 'transforming is not a kill');
});

test('R74 Hellfire: crimson fireballs fly in from the screen edge, horizontally then vertically, and explode into fire pits', () => {
  const g = arena(74);
  g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;');
  cast(g, 'hellfire', g.run('P.x+300'), g.run('P.y'));
  g.step(0.5);
  const R = g.run("G.rituals.find(r=>r.kind==='hellfire')");
  const [r, gg, b] = rgb(g.run('SPELL_BY_ID.hellfire.col'));
  assert.ok(r > 170 && gg < 60 && b < 80, 'crimson');
  const first = R.balls.filter(x => x.wave === 0);
  assert.ok(first.length >= 6, 'first wave');
  assert.ok(first.every(x => x.vy === 0 && x.vx > 0), 'flies horizontally');
  assert.ok(first.every(x => x.x0 <= g.run('cam.x') + 1), 'from the left edge of the screen');
  g.step(1.5);
  const second = g.run("G.rituals.find(r=>r.kind==='hellfire').balls.filter(x=>x.wave===1)");
  assert.ok(second.length >= 6 && second.every(x => x.vx === 0 && x.vy > 0), 'then vertically from the top');
  assert.ok(second.every(x => x.y0 <= g.run('cam.y') + 1));
  g.run('render();');
  // a fireball explodes on the first enemy it touches
  const h = arena(741);
  h.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;');
  h.run(`var A=spawnEnemy('pawn',P.x,P.y-200),B=spawnEnemy('pawn',P.x+60,P.y-200),C=spawnEnemy('pawn',P.x+700,P.y-200);
    for(const e of [A,B,C]){e.hp=e.maxHp=1e7;e.dmg=0;e.stunT=1e9;}`);
  h.run("G.rituals.push({kind:'hellfire',t:9,dur:10,dmg:SPELL_BY_ID.hellfire.dmg,pit:SPELL_BY_ID.hellfire.pit,boomR:SPELL_BY_ID.hellfire.boomR,queue:[],balls:[{x:P.x-300,y:P.y-200,x0:P.x-300,y0:P.y-200,vx:900,vy:0,wave:0}]});");
  h.step(0.5);
  const dmg = h.run('SPELL_BY_ID.hellfire.dmg');
  assert.ok(h.run('A.maxHp-A.hp') >= dmg * 0.9, 'large explosion on the first enemy');
  assert.ok(h.run('B.maxHp-B.hp') >= dmg * 0.9, 'large area');
  assert.ok(h.run('C.maxHp-C.hp') < dmg * 0.5, 'the fireball stops at the first enemy');
  assert.ok(h.run("G.zones.some(z=>z.el==='fire'&&z.hell)"), 'a burning pit of fire is left behind');
});

test('R75 Excalibur: a giant sword falls, plants with a shockwave, then fires a huge beam of light', () => {
  const g = arena(75);
  const tx = g.run('P.x+300'), ty = g.run('P.y');
  g.run(`var N=spawnEnemy('pawn',${tx + 80},${ty + 40}),FAR=spawnEnemy('pawn',${tx + 900},${ty}),O=spawnEnemy('pawn',${tx},${ty + 900});
    for(const e of [N,FAR,O]){e.hp=e.maxHp=1e7;e.dmg=0;e.stunT=1e9;}`);
  cast(g, 'excalibur', tx, ty);
  g.step(0.3);
  const R = g.run("G.rituals.find(r=>r.kind==='excalibur')");
  assert.ok(R && R.t < R.land, 'the sword is still falling');
  g.run('render();');
  assert.equal(g.run('N.hp'), g.run('N.maxHp'));
  g.step(0.7);
  assert.ok(g.run('N.maxHp-N.hp') >= g.run('SPELL_BY_ID.excalibur.quake') * 0.9, 'the landing shockwave');
  assert.equal(g.run('FAR.hp'), g.run('FAR.maxHp'), 'the beam has not fired yet');
  g.run('render();');
  g.step(2.5);
  assert.ok(g.run('FAR.maxHp-FAR.hp') >= g.run('SPELL_BY_ID.excalibur.dmg') * 0.9, 'a long beam of light in the aimed direction');
  assert.ok(g.run('O.maxHp-O.hp') < g.run('SPELL_BY_ID.excalibur.dmg') * 0.1, 'only along the beam');
});

test('R70-R75 every new Grandmaster spell casts from a slot, renders, and finishes', () => {
  const g = arena(707, 'tome');
  for (let i = 0; i < 20; i++) g.run(`spawnEnemy(['pawn','knight','bishop','rook'][${i % 4}],P.x+Math.cos(${i})*400,P.y+Math.sin(${i})*300)`);
  for (const id of NEW_GM) {
    g.run(`P.spells[0]={id:'${id}',lvl:1,cd:0,cdMax:1};`);
    g.aimAt(g.run('P.x+300'), g.run('P.y'));
    g.fire('keydown', { key: '1' }); g.fire('keyup', { key: '1' });
    assert.ok(g.run('P.spells[0].cd>0'), id + ' cast');
    for (let i = 0; i < 30; i++) { g.step(0.5); g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();'); }
    assert.equal(g.run(`G.rituals.filter(r=>r.kind==='${id}').length`), 0, id + ' finishes');
  }
});

/* ---------- R76 spell slots ---------- */

test('R76 the player has 5 spell slots, cast with 1-5', () => {
  const g = arena(76);
  assert.equal(g.run('P.spells.length'), 5);
  g.run("P.spells=['ember','frost','spark','venom','glint'].map(id=>({id,lvl:1,cd:0,cdMax:1}));");
  g.aimAt(g.run('P.x+200'), g.run('P.y'));
  for (const k of ['1', '2', '3', '4', '5']) { g.fire('keydown', { key: k }); g.fire('keyup', { key: k }); }
  assert.ok(g.run('P.spells.every(s=>s.cd>0)'), 'keys 1-5 cast the five spells');
  g.run('var slots=0;{const t=txt;txt=(s,...a)=>{if(/^[1-5]$/.test(String(s)))slots++;return t(s,...a);};cam.x=P.x-VW/2;cam.y=P.y-VH/2;drawHUD();txt=t;}');
  assert.equal(g.run('slots'), 5, 'the HUD shows five numbered slots');
  g.run("P.spells=[null,null,null,null,null];var done=0;for(const id of ['ember','frost','spark','venom','glint'])equipSpell(id,()=>done++);");
  assert.equal(g.run('done'), 5, 'five spells fit');
  g.run("equipSpell('fireball',()=>done++);");
  assert.equal(g.run('done'), 5, 'a sixth asks to replace');
  assert.equal(g.run("$('replace').classList.contains('hidden')"), false);
  g.run('P.gold=5000;openShop();');
  assert.equal((g.elements('shop').innerHTML.match(/class="eq"/g) || []).length, 5, 'the shop lists five slots');
});
