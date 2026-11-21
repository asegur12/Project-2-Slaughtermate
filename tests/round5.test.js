'use strict';
// Round 5 tests. Each test name starts with the requirement ID (see spec.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, startRun, clearBoard, dummy, HTML } = require('./harness');

const rgb = hex => { const n = parseInt(String(hex).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lum = hex => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

function arena(seed, weapon, opts) {
  const g = startRun(loadGame(Object.assign({ seed }, opts || {})), weapon || 'sword');
  clearBoard(g);
  g.run('P.hp=P.maxHp=1e9;P.iframes=1e9;P.crit=0;');
  return g;
}
// Aim to the right of the player and set the weapon tier.
function ready(g, tier) {
  g.aimAt(g.run('P.x') + 400, g.run('P.y'));
  g.run(`P.aim=0;P.wtier=${tier};P.atkCd=0;`);
}
const lost = (g, e) => g.run(`(${e}).maxHp-(${e}).hp`);
function dummyAt(g, dx, dy, name) {
  g.run(`var ${name}=(()=>{const e=spawnEnemy('pawn',P.x+${dx},P.y+${dy || 0});e.hp=e.maxHp=1e6;e.dmg=0;e.speed=0;e.stunT=1e9;return e;})();`);
  return name;
}
function figures(g) {
  g.run(`var __figs=[];{const f=drawFigure,p=drawPiece;
    drawFigure=(k,x,y,s,o)=>{__figs.push({fig:k,s,o:o||{}});return f(k,x,y,s,o);};
    drawPiece=(k,x,y,s,o)=>{__figs.push({piece:k,s,fill:o&&o.fill});return p(k,x,y,s,o);};
    cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();drawFigure=f;drawPiece=p;}`);
  return JSON.parse(g.run('JSON.stringify(__figs.map(c=>({fig:c.fig,piece:c.piece,s:c.s,fill:typeof c.fill==="string"?c.fill:null})))'));
}
// Kill the current floor's boss so the cart (or portal) comes.
function clearFloor(g) {
  g.run('spawnBoss();G.boss.atkT=1e9;G.boss.spellT=1e9;hitEnemy(G.boss,1e12);');
}
// Put the merchant cart on the board with the player standing well away from it.
function cartReady(g) {
  clearFloor(g);
  g.run('P.x+=500;');
  g.step(1.5);
  assert.ok(g.run('!!G.cart'), 'the cart has arrived');
  g.run('P.x=G.cart.x+500;P.y=G.cart.y;');
}
const hitMerchant = (g, k) => g.run(`(()=>{const m=G.cart.pawns[${k || 0}];damageCircle(G.cart.x+m.dx,G.cart.y+m.dy,20,5);})()`);

/* ---------- R77 - R79 the Merchant ---------- */

test('R77 hitting a merchant warns twice, then the cart vanishes and the Merchant boss appears', () => {
  const g = arena(77);
  cartReady(g);
  hitMerchant(g);
  assert.match(g.run('G.cart.say.txt'), /stop that/i);
  hitMerchant(g);
  assert.equal(g.run('G.cart.hits'), 1, 'one hit per 0.5 s: a second hit at once is ignored');
  g.step(0.6);
  hitMerchant(g, 1);
  assert.match(g.run('G.cart.say.txt'), /warning you/i);
  g.step(0.6);
  hitMerchant(g, 2);
  assert.equal(g.run('G.cart'), null, 'the cart disappears');
  assert.equal(g.run('G.boss&&G.boss.type'), 'merchant', 'the Merchant boss appears');
  assert.equal(g.run('G.phase'), 'boss');
  assert.equal(g.run('G.merchantFought'), true);
  assert.equal(g.run('G.state'), 'play', 'the shop did not open');
});

test('R77 the merchants ignore the player when nothing hits them', () => {
  const g = arena(771);
  cartReady(g);
  g.step(3);
  assert.equal(g.run('G.cart.hits'), 0);
  assert.equal(g.run('G.boss'), null);
});

test('R78 the Merchant rides the cart, rams the player and calls tanky shop helpers; the swarm stops', () => {
  const g = arena(78);
  cartReady(g);
  for (let k = 0; k < 3; k++) { hitMerchant(g, k); g.step(0.6); }
  const atk = g.run('BOSS_ATTACKS.merchant.join()');
  assert.match(atk, /ram/);
  assert.match(atk, /helpers/);
  assert.ok(g.run('ETYPES.helper.hp') > g.run('ETYPES.pawn.hp') * 2, 'shop helpers are tankier than goblins');
  assert.equal(g.run('AI.helper===AI.pawn||typeof AI.helper==="function"'), true);
  g.run("G.enemies=G.enemies.filter(e=>e.boss);bossAttack(G.boss,'helpers');");
  const types = g.run('G.enemies.filter(e=>!e.boss).map(e=>e.type).join()').split(',');
  assert.ok(types.length >= 3 && types.every(t => t === 'helper'), 'only shop helpers: ' + types);
  g.run("G.enemies=G.enemies.filter(e=>e.boss);G.boss.atkT=1e9;G.boss.spellT=1e9;");
  g.step(4);
  assert.equal(g.run('G.enemies.filter(e=>!e.boss).length'), 0, 'no normal swarm during the fight');
  g.run("bossAttack(G.boss,'ram');");
  assert.ok(g.run('G.hazards.some(h=>h.k==="l")'), 'the ram is telegraphed');
  g.step(1.2);
  assert.ok(g.run('!!G.boss.dash||G.boss.dashing!==undefined'), 'then the cart charges');
  // helpers never appear outside this fight
  const g2 = arena(781);
  g2.run('G.spawnAcc=0;G.dur=60;');
  for (let f = 1; f <= 6; f++) { g2.run(`G.floor=${f};`); for (let k = 0; k < 400; k++) assert.notEqual(g2.run('rollEnemyType()'), 'helper'); }
});

test('R78 R84 the Merchant casts weakened spells of tiers 1-4', () => {
  const g = arena(781);
  cartReady(g);
  for (let k = 0; k < 3; k++) { hitMerchant(g, k); g.step(0.6); }
  const tiers = JSON.parse(g.run('JSON.stringify(bossSpellPool(G.boss).map(id=>SPELL_BY_ID[id].tier))'));
  assert.ok(tiers.length > 20 && tiers.every(t => t >= 1 && t <= 4), 'tiers ' + [...new Set(tiers)]);
  assert.deepEqual([...new Set(tiers)].sort().join(), '1,2,3,4');
  const merchantMax = g.run(`(()=>{G.hazards=[];G.eproj=[];G.ezones=[];for(const id of bossSpellPool(G.boss))bossCast(G.boss,id);
    return Math.max(...G.hazards.map(h=>h.dmg),...G.eproj.map(p=>p.dmg),...G.ezones.map(z=>z.dps))/edmg(G.boss);})()`);
  assert.ok(merchantMax <= 1.0, 'heavily weakened: at most the Merchant\'s own hit (' + merchantMax + ')');
});

test('R79 defeating the Merchant gives 500 gold, skips the shop and the bell is saved for the weapon', () => {
  const g = arena(79, 'club');
  cartReady(g);
  for (let k = 0; k < 3; k++) { hitMerchant(g, k); g.step(0.6); }
  const gold = g.run('P.gold');
  g.run('hitEnemy(G.boss,1e12);');
  assert.equal(g.run('P.gold') - gold, 500, 'robbed of 500 gold');
  assert.match(g.run('G.banner.text+" "+G.banner.sub'), /500/);
  assert.equal(g.run('G.phase'), 'cleared');
  const floor = g.run('G.floor');
  g.step(6);
  assert.equal(g.run('G.floor'), floor + 1, 'the next floor starts by itself');
  assert.equal(g.run('G.state'), 'play', 'no shop');
  assert.equal(JSON.parse(g.storage.get('slaughtermate_bells')).club, true);
  g.run('showMenu();');
  const cards = g.elements('weapons').children.map(c => c.innerHTML);
  assert.match(cards[Object.keys({ sword: 1, bow: 1, staff: 1, hammer: 1, scythe: 1, shield: 1, club: 1 }).indexOf('club')], /class="bell"/, 'the club card shows a bell');
  assert.doesNotMatch(cards[0], /class="bell"/, 'the sword card does not');
  // a new session still shows it
  const g2 = loadGame({ storage: { slaughtermate_bells: g.storage.get('slaughtermate_bells') } });
  g2.run('showMenu();');
  assert.ok(g2.elements('weapons').children.some(c => /class="bell"/.test(c.innerHTML)));
});

test('R79 the Merchant can only be fought once per run', () => {
  const g = arena(791);
  cartReady(g);
  for (let k = 0; k < 3; k++) { hitMerchant(g, k); g.step(0.6); }
  g.run('hitEnemy(G.boss,1e12);');
  g.step(6);
  clearBoard(g);
  g.run('P.iframes=1e9;');
  cartReady(g);
  for (let k = 0; k < 3; k++) { hitMerchant(g, k); g.step(0.6); }
  assert.ok(g.run('!!G.cart'), 'the cart stays');
  assert.notEqual(g.run('G.boss&&G.boss.type'), 'merchant');
});

/* ---------- R80 - R83 the Grandmaster ---------- */

function floor3(seed) {
  const g = arena(seed);
  g.run('G.floor=3;startFloor();G.spawnAcc=-1e9;G.packT=1e9;G.enemies=[];P.hp=P.maxHp=1e9;P.iframes=1e9;');
  return g;
}

test('R80 one grand disciple with a lot of HP spawns in the floor 3 swarm', () => {
  const g = floor3(80);
  g.step(1);
  assert.equal(g.run("G.enemies.filter(e=>e.type==='disciple').length"), 0, 'not at the start');
  g.run('G.floorTime=G.dur*0.4;');
  g.step(0.2);
  assert.equal(g.run("G.enemies.filter(e=>e.type==='disciple').length"), 1);
  assert.ok(g.run("G.enemies.find(e=>e.type==='disciple').maxHp") > g.run("spawnEnemy('queen',100,100).maxHp") * 3, 'a lot of HP');
  g.step(3);
  assert.equal(g.run("G.enemies.filter(e=>e.type==='disciple').length"), 1, 'only one');
  for (const f of [1, 2, 4, 5, 6]) {
    const h = arena(800 + f);
    h.run(`G.floor=${f};startFloor();G.floorTime=G.dur*0.5;P.iframes=1e9;P.hp=P.maxHp=1e9;`);
    h.step(1);
    assert.equal(h.run("G.enemies.filter(e=>e.type==='disciple').length"), 0, 'no disciple on floor ' + f);
  }
});

test('R80 the disciple explodes, killing nearby enemies but not bosses, and his draft unlocks floor 7', () => {
  const g = floor3(801);
  g.run(`var near1=spawnEnemy('rook',P.x+250,P.y),near2=spawnEnemy('pawn',P.x+150,P.y+80),far1=spawnEnemy('pawn',P.x-700,P.y);
    var dsc=spawnEnemy('disciple',P.x+200,P.y);spawnBoss();G.boss.x=P.x+260;G.boss.y=P.y;G.boss.atkT=1e9;G.boss.spellT=1e9;`);
  const php = g.run('P.hp');
  g.run('hitEnemy(dsc,1e12);');
  assert.equal(g.run('near1.dead&&near2.dead'), true, 'nearby enemies die');
  assert.equal(g.run('far1.dead'), false, 'far ones survive');
  assert.equal(g.run('G.boss.dead'), false, 'the boss survives');
  assert.equal(g.run('P.hp'), php, 'the blast does not hurt the player');
  assert.ok(g.run('!!G.draftAt'));
  g.run('hitEnemy(G.boss,1e12);');
  g.step(0.2);
  assert.ok(g.run('!!G.draft'), 'the draft appears when the floor is cleared');
  assert.ok(g.run('Math.hypot(G.draft.x-dsc.x,G.draft.y-dsc.y)') < 1, 'where the disciple died');
  g.run('P.hp=P.maxHp=1000;P.x=G.cart?G.cart.x+600:P.x;');
  g.run('P.x=G.draft.x;P.y=G.draft.y;');
  g.step(0.1);
  assert.equal(g.run('G.hasDraft'), true);
  assert.equal(g.run('G.draft'), null);
  assert.equal(g.run('Math.round(P.hp)'), 700, 'costs 30% of max HP');
  // it can't kill
  const h = floor3(802);
  h.run('var d2=spawnEnemy("disciple",P.x+300,P.y);hitEnemy(d2,1e12);spawnBoss();hitEnemy(G.boss,1e12);');
  h.step(0.2);
  h.run('P.hp=1;P.maxHp=1000;P.x=G.draft.x;P.y=G.draft.y;');
  h.step(0.1);
  assert.equal(h.run('G.hasDraft'), true);
  assert.ok(h.run('P.hp') >= 1, 'still alive');
});

test('R80 a disciple still alive when the boss dies leaves no draft', () => {
  const g = floor3(803);
  g.run('spawnEnemy("disciple",P.x+300,P.y);spawnBoss();hitEnemy(G.boss,1e12);');
  g.step(0.5);
  assert.equal(g.run('G.draft'), null);
  assert.equal(g.run('!!G.hasDraft'), false);
});

test('R81 with the draft, beating the floor 6 boss awards the crown and opens a portal to floor 7 instead of a shop', () => {
  const g = arena(81, 'hammer');
  g.run('G.floor=6;G.hasDraft=true;startFloor();G.enemies=[];G.spawnAcc=-1e9;G.packT=1e9;P.iframes=1e9;');
  clearFloor(g);
  g.run('P.x+=600;');
  g.step(5);
  assert.equal(g.run('G.state'), 'play', 'the run goes on');
  assert.equal(g.run('G.cart'), null, 'no cart');
  assert.ok(g.run('!!G.portal'), 'a portal');
  assert.equal(JSON.parse(g.storage.get('slaughtermate_crowns')).hammer, 'normal', 'the crown is awarded');
  g.run('P.x=G.portal.x;P.y=G.portal.y;');
  g.step(0.1);
  assert.equal(g.run('G.floor'), 7);
  assert.equal(g.run('G.state'), 'play');
  assert.match(g.run('G.theme.name'), /Grandmaster's Domain/);
  // without the draft floor 6 still ends the run
  const h = arena(811);
  h.run('G.floor=6;startFloor();G.enemies=[];G.spawnAcc=-1e9;P.iframes=1e9;');
  clearFloor(h);
  h.step(5);
  assert.equal(h.run('G.state'), 'over');
  assert.equal(h.run('G.portal'), null);
});

function floor7(seed, look, weapon) {
  const g = arena(seed, weapon, look ? { storage: { slaughtermate_look: look } } : undefined);
  g.run('G.floor=7;G.hasDraft=true;startFloor();P.hp=P.maxHp=1e9;P.iframes=1e9;');
  return g;
}

test('R81 floor 7 is a giant black-and-white chessboard', () => {
  for (const look of ['fantasy', 'chess']) {
    const g = floor7(812, look);
    assert.equal(g.run('G.theme.name'), "The Grandmaster's Domain");
    assert.ok(g.run('G.theme.tile') >= 200, 'giant squares');
    assert.ok(lum(g.run('G.theme.tileA')) > 0.85 && lum(g.run('G.theme.tileB')) < 0.15, 'black and white');
    assert.equal(g.run('FLOOR_THEMES.length'), 6, 'the six chess floors are unchanged');
    assert.equal(g.run('BOSSES.length'), 6);
  }
});

test('R81 floor 7 enemies are chess pieces in both themes, with checkered elites and grand disciples', () => {
  const g = floor7(813);
  const types = new Set();
  for (let k = 0; k < 3000; k++) types.add(g.run('rollEnemyType()'));
  for (const t of types) assert.ok(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'disciple'].includes(t), t);
  assert.ok(types.has('disciple'), 'grand disciples in the swarm');
  g.run('G.spawnAcc=0;');
  g.step(20);
  const el = JSON.parse(g.run('JSON.stringify(G.enemies.filter(e=>e.elite).map(e=>({t:e.type,s:e.s,hp:e.maxHp})))'));
  assert.ok(el.length > 0, 'checkered elites spawn');
  const one = el[0];
  assert.ok(Math.abs(one.s / g.run(`ETYPES.${one.t}.s`) - 1.3) < 0.01, 'elites are 1.3x the size');
  g.run('G.enemies=G.enemies.filter(e=>!e.dead);for(const e of G.enemies){e.x=P.x+(Math.random()-0.5)*600;e.y=P.y+(Math.random()-0.5)*400;}');
  const figs = figures(g);
  const pieces = figs.filter(f => f.piece);
  assert.ok(pieces.length > 3, 'enemies are drawn as chess pieces in the fantasy theme');
  assert.ok(!figs.some(f => ['goblin', 'skeleton', 'apprentice', 'minotaur', 'witch', 'guard'].includes(f.fig)), 'no medieval enemies');
  assert.ok(pieces.some(f => f.fill === null), 'checkered (pattern-filled) elites are drawn');
  assert.ok(figs.some(f => f.fig === 'knight'), 'the player keeps the fantasy look');
});

test('R82 the Grandmaster arrives on floor 7 with about 1.7x the King\'s HP', () => {
  const g = floor7(82);
  g.run('spawnBoss();');
  assert.equal(g.run('G.boss.type'), 'grandmaster');
  assert.match(g.run('G.boss.name'), /Grandmaster/);
  const ratio = g.run('GM_BOSS.hp/BOSSES[5].hp');
  assert.ok(ratio > 1.6 && ratio < 1.8, 'ratio ' + ratio);
  assert.equal(g.run('BOSS_ATTACKS.grandmaster.filter(a=>!["rookwall","promote","enrage","gmspell"].includes(a)).length'), 0, 'only his own attacks');
  // he moves like the other bosses
  g.run('G.boss.atkT=1e9;G.boss.spellT=1e9;G.boss.x=P.x+600;G.boss.y=P.y;');
  const d0 = g.run('Math.hypot(G.boss.x-P.x,G.boss.y-P.y)');
  g.step(1);
  assert.ok(g.run('Math.hypot(G.boss.x-P.x,G.boss.y-P.y)') < d0 - 30, 'walks toward the player');
});

function gmArena(seed, look) {
  const g = floor7(seed, look);
  clearBoard(g);
  g.run('P.hp=P.maxHp=1e9;P.iframes=0;spawnBoss();var gmb=G.boss;gmb.atkT=1e9;gmb.spellT=1e9;gmb.speed=0;gmb.x=P.x+700;gmb.y=P.y;');
  g.aimAt(g.run('P.x') + 200, g.run('P.y'));
  return g;
}

test('R82 a wall of checkered rooks sweeps the screen, hits hard and can be destroyed', () => {
  const g = gmArena(821);
  g.run("bossAttack(gmb,'rookwall');");
  const rooks = g.run("G.enemies.filter(e=>e.sweep).length");
  assert.ok(rooks >= 6, rooks + ' rooks');
  assert.equal(g.run("G.enemies.filter(e=>e.sweep).every(e=>e.type==='rook'&&e.elite)"), true, 'checkered rooks');
  const pos = g.run("JSON.stringify(G.enemies.filter(e=>e.sweep).map(e=>[e.x,e.y]))");
  g.run('var sw1=G.enemies.find(e=>e.sweep);');
  g.step(0.5);
  assert.notEqual(g.run("JSON.stringify(G.enemies.filter(e=>e.sweep).map(e=>[e.x,e.y]))"), pos, 'they move');
  g.run('hitEnemy(sw1,1e12);');
  assert.equal(g.run('sw1.dead'), true, 'a rook can be destroyed');
  g.run('P.hp=1e9;P.iframes=0;');
  g.step(4);
  assert.ok(g.run('P.hp') < 1e9 - g.run('edmg(gmb)'), 'the wall hits the player hard');
  g.step(4);
  assert.equal(g.run('G.enemies.filter(e=>e.sweep&&!e.dead).length'), 0, 'the wall leaves the board');
});

test('R82 the Grandmaster promotes nearby enemies into rooks or queens, keeping their HP fraction', () => {
  const g = gmArena(822);
  g.run('var pn=spawnEnemy("pawn",gmb.x+200,gmb.y);pn.hp=pn.maxHp*0.5;var pf=spawnEnemy("pawn",gmb.x-1400,gmb.y);');
  g.run("bossAttack(gmb,'promote');");
  const near = JSON.parse(g.run('JSON.stringify(G.enemies.filter(e=>!e.dead&&!e.boss&&Math.hypot(e.x-gmb.x-200,e.y-gmb.y)<5).map(e=>[e.type,e.hp/e.maxHp]))'));
  assert.equal(near.length, 1);
  assert.ok(['rook', 'queen'].includes(near[0][0]), near[0][0]);
  assert.ok(Math.abs(near[0][1] - 0.5) < 0.01, 'same HP fraction');
  assert.equal(g.run('pf.dead||pf.type'), 'pawn', 'far enemies are left alone');
});

test('R82 enraged enemies charge headfirst at the player and die dealing heavy damage', () => {
  const g = gmArena(823);
  g.run('var kz=[];for(let k=0;k<5;k++)kz.push(spawnEnemy("pawn",P.x-300,P.y-200+k*100));');
  g.run("bossAttack(gmb,'enrage');");
  assert.equal(g.run('kz.every(e=>e.kamikaze>0)'), true);
  g.run('P.hp=1e9;');
  g.step(3);
  assert.equal(g.run('kz.filter(e=>!e.dead).length'), 0, 'they all died on contact');
  assert.ok(1e9 - g.run('P.hp') > g.run('ETYPES.pawn.dmg'), 'heavy damage');
  assert.equal(g.run('G.kills'), 0, 'they killed themselves (no kills for the player)');
});

test('R82 the Grandmaster casts Grandmaster spells (not Hellfire) with a longer wind-up and a smaller area', () => {
  const ids = JSON.parse(loadGame().run('JSON.stringify(GM_FOE_SPELLS)'));
  assert.deepEqual(ids.sort(), ['calamity', 'despair', 'doom', 'excalibur', 'inversion', 'nightfog', 'seal', 'slumber']);
  const g = gmArena(824);
  g.run("bossGM(gmb,'despair');");
  const R = JSON.parse(g.run('JSON.stringify((({r,burst,foe})=>({r,burst,foe}))(G.rituals.find(r=>r.kind==="despair")))'));
  assert.equal(R.foe, true);
  assert.ok(R.r < 540 && R.r > 380, 'slightly smaller area');
  assert.ok(R.burst > 2.8, 'longer wind-up');
  for (const id of ['seal', 'slumber', 'calamity']) {
    g.run(`G.rituals=[];bossGM(gmb,'${id}');`);
    assert.ok(g.run(`G.rituals.find(r=>r.foe).r<SPELL_BY_ID['${id}'].r`), id + ' smaller');
  }
});

test('R82 every Grandmaster spell the boss casts hurts a player standing in it, and then ends', () => {
  for (const id of ['despair', 'seal', 'doom', 'slumber', 'nightfog', 'calamity', 'excalibur']) {
    const g = gmArena(825);
    if (id === 'nightfog') g.run('gmb.x=P.x+150;');
    g.run(`bossGM(gmb,'${id}');`);
    let hurt = false;
    for (let k = 0; k < 140 && !hurt; k++) { g.step(0.1); g.run('P.x=P.x;'); hurt = g.run('P.hp') < 1e9; }
    assert.ok(hurt, id + ' hurts the player');
    g.step(14);
    assert.equal(g.run('G.rituals.filter(r=>r.foe).length'), 0, id + ' ends');
  }
});

test('R82 the Grandmaster\'s Mental Inversion buffs enemies instead of controlling them', () => {
  const g = gmArena(826);
  g.run('var bf=spawnEnemy("pawn",gmb.x+150,gmb.y);bf.stunT=1e9;var d0=edmg(bf);');
  g.run("bossGM(gmb,'inversion');");
  g.step(0.8);
  assert.ok(g.run('bf.gmBuffT>0'), 'buffed');
  assert.ok(!(g.run('bf.charmT') > 0), 'not mind-controlled');
  assert.ok(g.run('edmg(bf)>d0*1.2'), 'hits harder');
});

test('R83 the Grandmaster glows, explodes and clears the run; the upside-down crown is saved', () => {
  const g = gmArena(83);
  g.run('var gmEnemy=spawnEnemy("pawn",P.x-300,P.y);hitEnemy(gmb,1e12);');
  assert.equal(g.run('gmb.dead'), false, 'he does not vanish at once');
  assert.ok(g.run('gmb.dying>=0'), 'he starts to glow');
  g.run('var hpd=gmb.hp;hitEnemy(gmb,1e6);');
  assert.equal(g.run('gmb.hp'), g.run('hpd'), 'no more damage while dying');
  g.step(1);
  assert.equal(g.run('gmb.dead'), false);
  g.step(3);
  assert.equal(g.run('gmb.dead'), true, 'he explodes');
  assert.equal(g.run('gmEnemy.dead'), true, 'the explosion clears the board');
  g.step(5);
  assert.equal(g.run('G.state'), 'over');
  assert.match(g.elements('end').innerHTML, /Grandmaster/);
  assert.equal(JSON.parse(g.storage.get('slaughtermate_gmcrowns')).sword, true);
  g.run('showMenu();');
  assert.match(g.elements('weapons').children[0].innerHTML, /class="crown gm"/, 'upside-down crown on the sword card');
  assert.match(HTML, /\.crown\.gm[^{]*\{[^}]*rotate\(180deg\)/, 'drawn upside down');
});

/* ---------- R84 boss spells ---------- */

test('R84 each boss casts spells of its own tiers', () => {
  const want = ['1', '1,2', '1,2,3', '1,2,3,4', '1,2,3,4,5', '4,5'];
  for (let f = 1; f <= 6; f++) {
    const g = arena(840 + f);
    g.run(`G.floor=${f};startFloor();G.enemies=[];spawnBoss();`);
    const tiers = [...new Set(JSON.parse(g.run('JSON.stringify(bossSpellPool(G.boss).map(id=>SPELL_BY_ID[id].tier))')))].sort().join();
    assert.equal(tiers, want[f - 1], 'boss ' + f);
    assert.equal(g.run('bossSpellPool(G.boss).some(id=>["heal","shield"].includes(SPELL_BY_ID[id].kind))'), false, 'only attacking spells');
  }
});

test('R84 a boss casts about every 7 s, on top of its normal attacks', () => {
  const g = arena(845);
  g.run('G.floor=2;startFloor();G.enemies=[];G.spawnAcc=-1e9;G.packT=1e9;spawnBoss();G.boss.x=P.x+500;G.boss.y=P.y;');
  g.step(22);
  const log = JSON.parse(g.run('JSON.stringify(G.boss.castLog)'));
  assert.ok(log.length >= 2 && log.length <= 5, log.length + ' casts in 22 s');
  assert.ok(log.every(id => g.run(`SPELL_BY_ID['${id}'].tier`) <= 2));
});

test('R84 boss spells are telegraphed in the element look, use the boss damage, and stun becomes a slow', () => {
  const g = arena(846);
  g.run('G.floor=5;startFloor();G.enemies=[];G.spawnAcc=-1e9;G.packT=1e9;spawnBoss();var bs=G.boss;bs.atkT=1e9;bs.spellT=1e9;bs.speed=0;bs.x=P.x+400;bs.y=P.y;P.iframes=0;');
  for (const id of ['fireball', 'meteor', 'tide', 'lance', 'storm', 'flare', 'chainl', 'lunarorbs', 'mindcrush', 'psistrike']) {
    g.run(`G.hazards=[];G.eproj=[];G.ezones=[];bossCast(bs,'${id}');`);
    const n = g.run('G.hazards.length+G.eproj.length+G.ezones.length');
    assert.ok(n > 0, id + ' makes an attack');
    assert.ok(g.run(`[...G.hazards,...G.eproj].every(h=>h.el===SPELL_BY_ID['${id}'].el)&&G.ezones.every(z=>z.el===SPELL_BY_ID['${id}'].el)`), id + ' in its element look');
    assert.ok(g.run('Math.max(0,...G.hazards.map(h=>h.dmg),...G.eproj.map(p=>p.dmg))') <= g.run('edmg(bs)') * 2.5, id + ' uses the boss damage');
  }
  assert.ok(g.run("SPELL_BY_ID.meteor.dmg") > g.run('edmg(bs)') * 5, 'not the spell\'s damage');
  // Earthquake stuns enemies; on the player it is a short slow
  g.run("G.hazards=[];G.eproj=[];bs.x=P.x+100;P.hp=P.maxHp=1e9;P.iframes=0;bossCast(bs,'quake');");
  g.step(1.5);
  assert.ok(g.run('P.slowT') > 0.5, 'slowed');
  const x0 = g.run('P.x');
  g.run("keys.d=true;");
  g.step(0.25);
  g.run("keys.d=false;");
  const moved = g.run('P.x') - x0;
  assert.ok(moved > 20 && moved < g.run('P.speed') * 0.25 * 0.75, 'moves about 40% slower (' + moved + ')');
});

/* ---------- R85 enemy logbook ---------- */

test('R85 the enemy logbook lists every enemy and boss, unlocking each on its first encounter', () => {
  const g = loadGame();
  assert.match(HTML, /id="beastBtn"/);
  const ids = JSON.parse(g.run('JSON.stringify(BESTIARY.map(b=>b.id))'));
  for (const id of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'watchtower', 'helper', 'disciple', 'checkered',
    'boss:pawn', 'boss:knight', 'boss:bishop', 'boss:rook', 'boss:queen', 'boss:king', 'boss:merchant', 'boss:grandmaster'])
    assert.ok(ids.includes(id), id);
  assert.equal(ids.length, 18);
  g.run('showBestiary();');
  assert.equal((g.elements('bestiary').innerHTML.match(/\?\?\?/g) || []).length, 18, 'all locked at first');
  startRun(g, 'sword');
  g.run('spawnEnemy("knight",100,100);spawnBoss();');
  const saved = JSON.parse(g.storage.get('slaughtermate_bestiary'));
  assert.ok(saved.includes('knight') && saved.includes('boss:pawn') && saved.includes('pawn'));
  g.run('showMenu();showBestiary();');
  const html = g.elements('bestiary').innerHTML;
  assert.match(html, /Skeleton/, 'medieval names in the fantasy theme');
  assert.match(html, /Goblin Chief/);
  assert.doesNotMatch(html, /Mad Knight/);
  assert.equal((html.match(/\?\?\?/g) || []).length, 18 - saved.length);
});

test('R85 the chess theme shows the chess version of the enemy logbook', () => {
  const g = loadGame({ storage: { slaughtermate_look: 'chess', slaughtermate_bestiary: JSON.stringify(['pawn', 'knight', 'boss:knight', 'helper']) } });
  g.run('showBestiary();');
  const html = g.elements('bestiary').innerHTML;
  assert.match(html, /Knight/);
  assert.match(html, /Mad Knight/);
  assert.doesNotMatch(html, /Skeleton|Goblin|Evil Prince/);
  assert.match(html, /<canvas[^>]*data-k="knight"/, 'each entry has a drawing');
});

/* ---------- R86 - R94 weapon upgrades ---------- */

test('R86 the shop sells weapon upgrades up to tier 5, each adding damage', () => {
  const g = arena(86);
  assert.equal(g.run('P.wtier'), 1, 'tier 1 is the default');
  assert.equal(g.run('WEAPON_UP_PRICE.slice(2).join()'), '150,300,500,800');
  g.run('P.gold=5000;G.state="play";openShop();');
  const forge = () => g.elements('shForge').children.at(-1);
  assert.match(forge().innerHTML, /Gold Sword/);
  forge().onclick();
  assert.equal(g.run('P.wtier'), 2);
  assert.equal(g.run('P.gold'), 4850);
  forge().onclick(); forge().onclick(); forge().onclick();
  assert.equal(g.run('P.wtier'), 5);
  assert.match(forge().innerHTML, /Mirror Sword/);
  forge().onclick();
  assert.equal(g.run('P.wtier'), 5, 'tier 5 is the maximum');
  assert.equal(g.run('P.gold'), 5000 - 1750);
  const dm = [1, 2, 3, 4, 5].map(t => g.run(`P.wtier=${t};wdmg()`));
  for (let t = 1; t < 5; t++) assert.ok(dm[t] > dm[t - 1], 'tier ' + (t + 1) + ' adds damage');
  assert.ok(Math.abs(dm[4] / dm[0] - 1.8) < 1e-9, '+20% per tier');
  assert.equal(g.run("['Gold','Obsidian','Enchanted','Mirror'].every((m,i)=>weaponTierName('hammer',i+2)===m+' Hammer')"), true);
  g.run('P.gold=0;P.wtier=2;openShop();');
  assert.ok(forge().classList.contains('dis'), 'too expensive');
  forge().onclick();
  assert.equal(g.run('P.wtier'), 2);
});

test('R87 Sword tiers: bigger slashes, double spin, wave slashes, a 3-hit slice and a wave beam', () => {
  const g = arena(87, 'sword');
  ready(g, 1); dummyAt(g, 125, 0, 'sw125');
  g.run('basicAttack();');
  assert.equal(lost(g, 'sw125'), 0, 'tier 1 does not reach 125 px');
  ready(g, 2); g.run('basicAttack();');
  assert.ok(lost(g, 'sw125') > 0, 'tier 2 has a larger radius');
  // double spin
  g.run('G.enemies=[];'); ready(g, 2); dummyAt(g, 100, 0, 'spin');
  g.run('chargedAttack();');
  const one = lost(g, 'spin');
  g.step(0.5);
  assert.ok(lost(g, 'spin') > one * 1.8, 'tier 2 spins twice');
  // wave slash
  g.run('G.enemies=[];G.pproj=[];'); ready(g, 3); g.run('chargedAttack();');
  assert.equal(g.run("G.pproj.filter(p=>p.kind==='wave').length"), 1, 'tier 3 charged is a wave slash');
  // massive slower basic and a tri-wave
  g.run('G.pproj=[];'); ready(g, 4); dummyAt(g, 210, 0, 'sw210');
  g.run('basicAttack();');
  assert.ok(lost(g, 'sw210') > 0, 'tier 4 basic hits a massive area');
  assert.ok(g.run('P.atkCd') > g.run('WEAPONS.sword.cd') * 1.3, 'but is slower');
  g.run('chargedAttack();');
  assert.equal(g.run("G.pproj.filter(p=>p.kind==='wave').length"), 3, 'tier 4 charged is a tri-wave');
  // 3-hit slice and wave beam
  g.run('G.enemies=[];G.pproj=[];'); ready(g, 5); dummyAt(g, 120, 0, 'sl');
  g.run('basicAttack();');
  const first = lost(g, 'sl');
  g.step(0.4);
  assert.ok(Math.abs(lost(g, 'sl') / first - 3) < 0.01, 'tier 5 basic is a 3-hit slice');
  dummyAt(g, 1000, 0, 'far');
  g.run('chargedAttack();');
  assert.ok(lost(g, 'far') > 0, 'tier 5 charged is a massive wave beam');
});

test('R88 Hammer tiers: bigger smash, slowing slam, pulses, a leaping crush and breaking the map', () => {
  const g = arena(88, 'hammer');
  ready(g, 1); dummyAt(g, 145, 0, 'h145');
  g.run('basicAttack();');
  assert.equal(lost(g, 'h145'), 0);
  ready(g, 2); g.run('basicAttack();');
  assert.ok(lost(g, 'h145') > 0, 'tier 2 bigger smash');
  g.run('G.enemies=[];'); ready(g, 2); dummyAt(g, 100, 0, 'hs');
  g.run('hs.stunT=0;chargedAttack();');
  assert.ok(g.run('hs.slowT') > 1, 'tier 2 charged slows');
  g.run('G.enemies=[];'); ready(g, 3); dummyAt(g, 260, 0, 'hp');
  g.run('basicAttack();');
  assert.ok(g.run('G.pulses.length') > 0, 'tier 3 basic releases a pulse');
  g.step(0.6);
  assert.ok(lost(g, 'hp') > 0, 'the pulse reaches further than the smash');
  g.aimAt(g.run('P.x') + 400, g.run('P.y'));
  const x0 = g.run('P.x');
  g.run('chargedAttack();');
  assert.ok(g.run('!!P.leap'), 'tier 3 charged is a leaping crush');
  g.step(0.8);
  assert.ok(g.run('P.x') - x0 > 300, 'leaps toward the cursor');
  // tier 5: pulses multiply, the map breaks for a while
  g.run('G.enemies=[];G.pulses=[];G.pulseCount=0;'); ready(g, 5);
  for (let k = 0; k < 4; k++) dummyAt(g, 140 + k * 30, k * 40 - 60, 'm' + k);
  g.run('basicAttack();'); g.step(0.8);
  assert.ok(g.run('G.pulseCount') >= 4, 'every enemy hit releases another pulse (' + g.run('G.pulseCount') + ')');
  g.run('G.enemies=[];G.structs.push({x:P.x+380,y:P.y-30,w:60,h:60,k:"house",c:"#888"});var hs5=G.structs[G.structs.length-1];');
  g.aimAt(g.run('P.x') + 400, g.run('P.y'));
  g.run('chargedAttack();'); g.step(0.8);
  assert.ok(g.run('hs5.broken') > 0, 'structures near the crush are destroyed');
  assert.equal(g.run('insideStruct(hs5.x+30,hs5.y+30,0)'), false, 'and do not block movement');
  g.step(9);
  assert.equal(g.run('insideStruct(hs5.x+30,hs5.y+30,0)'), true, 'they rebuild');
});

test('R89 Bow tiers: 3, 5 and 10 arrows, piercing, and massive homing arrows', () => {
  const g = arena(89, 'bow');
  const shots = (t, charged) => { g.run('G.pproj=[];'); ready(g, t); g.run(charged ? 'chargedAttack();' : 'basicAttack();'); return g.run('G.pproj.length'); };
  assert.deepEqual([1, 2, 3, 4, 5].map(t => shots(t)), [1, 3, 5, 5, 10]);
  assert.deepEqual([1, 2, 3, 4, 5].map(t => shots(t, true)), [1, 3, 5, 3, 10]);
  shots(4);
  assert.ok(g.run('G.pproj.every(p=>p.pierce>=2)'), 'tier 4 arrows pierce');
  shots(4, true);
  assert.ok(g.run("G.pproj.every(p=>p.kind==='bigarrow'&&p.home)"), 'tier 4 charged arrows home');
  g.run('G.pproj=[];G.enemies=[];');
  for (const [dx, dy, n] of [[-300, -250, 'ha'], [-350, 260, 'hb'], [100, 400, 'hc']]) dummyAt(g, dx, dy, n);
  ready(g, 4); g.run('chargedAttack();');
  g.step(0.3);
  assert.ok(g.run("G.pproj.some(p=>p.kind==='bigarrow'&&p.stopped)"), 'they stop first');
  g.step(2);
  for (const n of ['ha', 'hb', 'hc']) assert.ok(lost(g, n) > 0, 'homed in on ' + n);
});

test('R90 Staff tiers: chain explosions, a free random slot spell, a pull, small orbs, pillars and a laser', () => {
  const g = arena(90, 'staff');
  const orb = () => g.run("explodeProj({x:P.x+300,y:P.y,explode:70,dmg:20,o:{},kind:'orb',color:'#c77dff',vx:1,vy:0});");
  ready(g, 1); dummyAt(g, 340, 0, 'a1'); dummyAt(g, 400, 0, 'b1');
  orb();
  assert.equal(lost(g, 'b1'), 0, 'tier 1 has no chain');
  ready(g, 2); orb();
  assert.ok(lost(g, 'b1') > 0, 'tier 2 bursts chain onto nearby enemies');
  g.run('G.enemies=[];'); dummyAt(g, 340, 0, 'a2'); dummyAt(g, 430, 0, 'b2');
  ready(g, 2); orb();
  assert.equal(lost(g, 'b2'), 0);
  ready(g, 3); orb();
  assert.ok(lost(g, 'b2') > 0, 'tier 3 chain explosions are larger');
  // free random spell
  g.run("G.enemies=[];G.zones=[];P.spells=[{id:'toxic',lvl:1,cd:0,cdMax:1},null,null,null,null];");
  ready(g, 2); g.run('chargedAttack();');
  assert.ok(g.run("G.zones.some(z=>z.el==='poison')"), 'tier 2 charged casts a spell from a slot');
  assert.equal(g.run('P.spells[0].cd'), 0, 'for free');
  g.run('G.zones=[];'); ready(g, 3); g.run('chargedAttack();');
  assert.ok(g.run('G.zones.some(z=>z.pull>0)'), 'tier 3 charged also pulls enemies in');
  // small orbs
  g.run('G.pproj=[];'); ready(g, 4); orb();
  assert.ok(g.run("G.pproj.filter(p=>p.kind==='miniorb').length") >= 3, 'tier 4 bursts shoot small orbs');
  // pillars moving away and the laser
  g.run('G.pproj=[];G.mpillars=[];'); ready(g, 5); orb();
  assert.ok(g.run('G.mpillars.length') > 0, 'tier 5 bursts leave pillars');
  const d0 = g.run('Math.hypot(G.mpillars[0].x-P.x,G.mpillars[0].y-P.y)');
  g.step(0.5);
  assert.ok(g.run('Math.hypot(G.mpillars[0].x-P.x,G.mpillars[0].y-P.y)') > d0 + 30, 'that slowly move away from the player');
  g.run('G.pstrikes=[];G.zones=[];'); g.aimAt(g.run('P.x') + 400, g.run('P.y')); g.run('chargedAttack();');
  assert.ok(g.run('G.pstrikes.some(s=>s.laser&&s.r>=240)'), 'tier 5 charged is a giant laser');
});

test('R91 Scythe tiers: life steal, thrown scythes, a giant spin and a warp slash', () => {
  const g = arena(91, 'scythe');
  ready(g, 1); dummyAt(g, 80, 0, 'sc');
  g.run('P.hp=P.maxHp*0.5;var h0=P.hp;basicAttack();');
  assert.equal(g.run('P.hp-h0'), 0, 'tier 1 basic does not heal');
  ready(g, 2); g.run('h0=P.hp;basicAttack();');
  assert.ok(g.run('P.hp-h0') > 0, 'tier 2 basic steals HP');
  ready(g, 1); g.run('P.hp=P.maxHp=1e6;P.hp=1e5;h0=P.hp;chargedAttack();');
  const c1 = g.run('P.hp-h0');
  ready(g, 2); g.run('P.hp=1e5;h0=P.hp;chargedAttack();');
  assert.ok(g.run('P.hp-h0') > c1 * 1.9, 'tier 2 charged steals twice as much');
  const thrown = t => { g.run('G.pproj=[];'); ready(g, t); g.run('basicAttack();'); return g.run("G.pproj.filter(p=>p.kind==='scythe').length"); };
  assert.deepEqual([1, 2, 3, 4, 5].map(thrown), [0, 0, 1, 3, 5]);
  g.run('G.pproj=[];'); ready(g, 3); g.run('chargedAttack();');
  assert.ok(g.run("G.pproj.some(p=>p.kind==='scythe')"), 'tier 3 charged throws one too');
  g.run('G.enemies=[];'); dummyAt(g, -150, 0, 'behind');
  ready(g, 4); g.run('chargedAttack();');
  assert.ok(lost(g, 'behind') > 0, 'tier 4 charged slashes all around');
  g.run('G.enemies=[];'); ready(g, 5); dummyAt(g, 420, 0, 'warp');
  const x0 = g.run('P.x');
  g.run('chargedAttack();'); g.step(0.5);
  assert.ok(Math.abs(g.run('P.x') - x0 - 400) < 40, 'tier 5 charged warps to the cursor');
  assert.ok(lost(g, 'warp') > 0, 'and slices there');
});

test('R92 Club tiers: bigger slam, chain explosions, a long line of bursts, knockback, weakening and double-wield', () => {
  const g = arena(92, 'club');
  ready(g, 1); dummyAt(g, 175, 0, 'c175');
  g.run('basicAttack();'); g.step(0.3);
  assert.equal(lost(g, 'c175'), 0);
  ready(g, 2); g.run('basicAttack();'); g.step(0.3);
  assert.ok(lost(g, 'c175') > 0, 'tier 2 larger area');
  g.run('G.clubBlasts=0;'); ready(g, 3); g.run('basicAttack();'); g.step(0.5);
  assert.ok(g.run('G.clubBlasts') >= 3, 'tier 3 basic is chain explosions');
  g.run('G.enemies=[];G.clubBlasts=0;'); dummyAt(g, 850, 0, 'line');
  ready(g, 3); g.run('chargedAttack();'); g.step(1.6);
  assert.ok(g.run('G.clubBlasts') >= 8, 'tier 3 charged is a long line of bursts');
  assert.ok(lost(g, 'line') > 0, 'that travels far');
  g.run('G.enemies=[];'); dummyAt(g, 110, 0, 'kb');
  ready(g, 4); g.run('chargedAttack();'); g.step(0.6);
  assert.ok(g.run('kb.weakT') > 0, 'tier 4 charged weakens');
  g.run('G.enemies=[];'); dummyAt(g, 110, 0, 'kb2');
  ready(g, 4); g.run('basicAttack();'); g.step(0.3);
  assert.ok(g.run('Math.hypot(kb2.x-P.x-110,kb2.y-P.y)') > 40, 'tier 4 explosions push enemies away');
  g.run('G.clubBlasts=0;'); ready(g, 5); g.run('basicAttack();'); g.step(0.6);
  const cone = g.run('G.clubBlasts');
  assert.ok(cone >= 6, 'tier 5 basic: many explosions in a wide cone');
  ready(g, 5); g.run('chargedAttack();'); g.step(0.5);
  assert.ok(g.run('P.dualT') > 5, 'tier 5 charged: double-wield');
  g.run('G.clubBlasts=0;P.atkCd=0;basicAttack();'); g.step(0.6);
  assert.equal(g.run('G.clubBlasts'), cone * 2, 'every basic attack strikes twice');
});

test('R93 Shield tiers: farther dash, less ranged damage, a dash shield, wind force and dragging', () => {
  const dashBy = (g, t) => { ready(g, t); g.run('P.dashCd=0;'); const x0 = g.run('P.x'); g.run('dash();'); g.step(0.4); return g.run('P.x') - x0; };
  const g = arena(93, 'shield');
  const d1 = dashBy(g, 1), d2 = dashBy(g, 2);
  assert.ok(d2 > d1 * 1.3, 'tier 2 dashes farther (' + d1 + ' -> ' + d2 + ')');
  g.run('G.enemies=[];'); dummyAt(g, 120, 0, 'push');
  ready(g, 2); g.run('push.stunT=0;chargedAttack();'); g.step(0.5);
  const far2 = g.run('push.x-P.x');
  g.run('G.enemies=[];'); dummyAt(g, 120, 0, 'push1');
  ready(g, 1); g.run('push1.stunT=0;chargedAttack();'); g.step(0.5);
  assert.ok(far2 > g.run('push1.x-P.x') + 30, 'tier 2 charged pushes further');
  const hitBy = t => { ready(g, t); g.run('P.hp=P.maxHp=1e6;P.iframes=0;P.shield=0;G.eproj=[{x:P.x,y:P.y,vx:0,vy:0,r:8,dmg:100,life:1,color:"#f00"}];'); g.step(0.02); return 1e6 - g.run('P.hp'); };
  assert.ok(Math.abs(hitBy(3) / hitBy(1) - 0.7) < 0.01, 'tier 3 takes 30% less ranged damage');
  g.run('P.shield=0;P.shieldT=0;'); dashBy(g, 3);
  assert.ok(g.run('P.shield') >= g.run('P.maxHp') * 0.25 - 1 && g.run('P.shieldT') > 4, 'tier 3 dash gives a shield for 5 s');
  g.run('G.enemies=[];'); g.aimAt(g.run('P.x') + 400, g.run('P.y')); dummyAt(g, 0, 110, 'wind');
  g.run('wind.stunT=0;'); dashBy(g, 4);
  assert.ok(g.run('Math.abs(wind.y-P.y)') > 150 || g.run('wind.x') < g.run('P.x') - 50, 'tier 4 dash wind pushes enemies away');
  ready(g, 4); g.run('P.shieldT=2;chargedAttack();'); g.step(0.4);
  assert.ok(g.run('P.shieldT') > 4, 'tier 4 charged extends the shield');
  g.run('G.enemies=[];'); dummyAt(g, 60, 0, 'drag');
  const x0 = g.run('drag.x'); dashBy(g, 5);
  assert.ok(g.run('drag.x') - x0 > 120, 'tier 5 dash drags enemies along');
  assert.ok(g.run('shieldRadius()') > 30, 'bigger shield');
});

test('R94 Tome tiers: more spirits, homing, locking on, exploding and lingering areas', () => {
  const g = arena(94, 'tome');
  const fire = (t, charged) => { g.run('G.pproj=[];'); ready(g, t); g.run(charged ? 'chargedAttack();' : 'basicAttack();'); return g.run("G.pproj.filter(p=>p.kind==='spirit').length"); };
  assert.equal(fire(1), 3);
  assert.ok(fire(2) >= 5, 'tier 2 more spirits');
  fire(2, true);
  assert.ok(g.run("G.pproj.every(p=>p.homing)"), 'tier 2 charged spirits home in');
  fire(2);
  assert.ok(g.run("G.pproj.every(p=>!p.homing)"), 'tier 2 basic spirits do not');
  fire(3);
  assert.ok(g.run("G.pproj.every(p=>p.lock)"), 'tier 3 spirits lock on');
  assert.ok(fire(3, true) > 9, 'tier 3 charged releases more spirits');
  g.run('G.enemies=[];'); dummyAt(g, 0, 260, 'side');
  fire(4);
  assert.ok(g.run("G.pproj.every(p=>p.stopT>0)"), 'tier 4 spirits stop');
  g.step(1.5);
  assert.ok(lost(g, 'side') > 0, 'then fly at an enemy');
  g.run('G.enemies=[];G.zones=[];'); dummyAt(g, 160, 0, 'zz');
  fire(5); g.step(1.2);
  const zb = JSON.parse(g.run('JSON.stringify(G.zones.filter(z=>z.tome).map(z=>z.dur))'));
  assert.ok(zb.length > 0 && zb.every(d => d === 3), 'tier 5 explosions leave a 3 s area');
  g.run('G.zones=[];'); fire(5, true); g.step(1.5);
  const zc = JSON.parse(g.run('JSON.stringify(G.zones.filter(z=>z.tome).map(z=>z.dur))'));
  assert.ok(zc.length > 0 && zc.every(d => d > 3), 'charged areas last longer');
});

test('R86 every weapon at every tier attacks, renders and keeps running', () => {
  for (const w of ['sword', 'bow', 'staff', 'hammer', 'scythe', 'shield', 'club', 'tome']) {
    for (const look of ['fantasy', 'chess']) {
      const g = arena(860, w, { storage: { slaughtermate_look: look } });
      for (let k = 0; k < 12; k++) { const a = k * 0.5; g.run(`spawnEnemy('pawn',P.x+Math.cos(${a})*200,P.y+Math.sin(${a})*200);`); }
      for (let t = 1; t <= 5; t++) {
        ready(g, t);
        g.run('basicAttack();'); g.step(0.3); g.run('P.atkCd=0;chargedAttack();'); g.step(0.6); g.run('P.dashCd=0;dash();'); g.step(0.4);
        g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();');
      }
      g.step(3);
      assert.equal(g.run('G.state'), 'play', w + ' ' + look);
    }
  }
});

/* ---------- R95 - R97 ---------- */

test('R95 the cursor is a black bullseye with a white outline', () => {
  const css = HTML.match(/canvas\{[^}]*\}/)[0];
  const m = css.match(/cursor:url\("data:image\/svg\+xml,([^"]+)"\)/);
  assert.ok(m, 'an inline SVG cursor (offline)');
  const svg = decodeURIComponent(m[1]);
  assert.ok((svg.match(/<circle/g) || []).length >= 3, 'concentric rings');
  assert.match(svg, /#000|black/);
  assert.match(svg, /#fff|white/);
});

test('R96 the Grandmaster is a giant eye with two checkered hands and a crown halo; disciples are the eye alone', () => {
  for (const look of ['fantasy', 'chess']) {
    const g = gmArena(96, look);
    g.run('gmb.x=P.x+200;var dsp=spawnEnemy("disciple",P.x-200,P.y);');
    g.run(`var __gm=[];{const f=drawGrandmaster;drawGrandmaster=(x,y,s,o)=>{const r=f(x,y,s,o);__gm.push(r.join('+'));return r;};
      cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();drawGrandmaster=f;}`);
    const drawn = g.run('__gm.join("|")').split('|').sort();
    assert.deepEqual(drawn, ['eye', 'eye+hand+hand+halo'], look);
    assert.ok(g.run('GM_BOSS.s') > g.run('BOSSES[5].s'), 'giant');
  }
});

test('R97 an uploaded image becomes the face of the Grandmaster and the disciples, and can be removed', () => {
  assert.match(HTML, /id="faceIn"[^>]*type="file"|type="file"[^>]*id="faceIn"/, 'a file picker on the start screen');
  assert.match(HTML, /id="faceBtn"/);
  assert.match(HTML, /id="faceClear"/);
  const g = gmArena(97);
  assert.equal(g.run('FACE_SIZE'), 128);
  g.run("setFace('data:image/png;base64,iVBORw0KGgo=');");
  assert.equal(g.storage.get('slaughtermate_face'), 'data:image/png;base64,iVBORw0KGgo=');
  const parts = g.run('drawGrandmaster(100,100,60,{}).join()');
  assert.match(parts, /face/);
  assert.doesNotMatch(parts, /eye/, 'the image replaces the whole eye');
  assert.equal(g.run('drawGrandmaster(100,100,30,{disciple:true}).join()'), 'face');
  const g2 = loadGame({ storage: { slaughtermate_face: 'data:image/png;base64,iVBORw0KGgo=' } });
  assert.match(g2.run('drawGrandmaster(100,100,60,{}).join()'), /face/, 'remembered next session');
  g2.run('clearFace();');
  assert.equal(g2.storage.has('slaughtermate_face'), false);
  assert.match(g2.run('drawGrandmaster(100,100,60,{}).join()'), /eye/);
});
