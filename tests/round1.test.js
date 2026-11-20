'use strict';
// Round 1 regression tests. Each test name starts with the requirement ID (see spec.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, startRun, clearBoard, dummy, HTML, SCRIPT } = require('./harness');

const lum = hex => {
  const n = parseInt(String(hex).slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

test('R1 player is a white pawn, enemies are black pieces, bosses are checkered', () => {
  const g = startRun(loadGame({ seed: 1 }), 'sword');
  clearBoard(g);
  assert.equal(g.run('FORMS[P.form]'), 'pawn');
  g.run("spawnEnemy('knight',P.x+120,P.y);spawnBoss();G.boss.x=P.x-250;G.boss.y=P.y;cam.x=P.x-VW/2;cam.y=P.y-VH/2;");
  const calls = [];
  g.context.drawPiece = (type, x, y, s, o) => calls.push({ type, fill: o.fill });
  g.run('render()');
  const player = calls.find(c => c.type === 'pawn' && typeof c.fill === 'string' && lum(c.fill) > 0.8);
  assert.ok(player, 'player drawn as a light (white) pawn');
  const knight = calls.find(c => c.type === 'knight');
  assert.ok(knight && lum(knight.fill) < 0.2, 'enemy knight drawn dark (black)');
  const boss = calls.find(c => c.fill === g.run('CHECK'));
  assert.ok(boss, 'boss drawn with the checkered pattern');
});

test('R2 the map is large and has castles and towns', () => {
  const g = startRun(loadGame({ seed: 2 }), 'sword');
  assert.ok(g.run('WORLD') >= 3000);
  const kinds = new Set(g.run('G.structs.map(s=>s.k)'));
  assert.ok(kinds.has('keep') && kinds.has('wall') && kinds.has('tower'), 'castle parts present');
  assert.ok(kinds.has('house'), 'town houses present');
});

test('R3 swarms spawn on the outskirts and come from all sides', () => {
  const g = startRun(loadGame({ seed: 3 }), 'sword');
  const pos = g.run('G.enemies.map(e=>[e.x-P.x,e.y-P.y])');
  assert.ok(pos.length >= 10, 'an initial wave spawns');
  for (const [dx, dy] of pos) assert.ok(Math.hypot(dx, dy) >= 450, 'spawns away from the player');
  const quads = new Set(pos.map(([dx, dy]) => (dx >= 0 ? 1 : 0) + (dy >= 0 ? 2 : 0)));
  assert.equal(quads.size, 4, 'enemies come from all four sides');
  // enemies walk toward the player
  g.run('P.iframes=1e9;');
  const before = g.run('G.enemies.filter(e=>e.type==="pawn").map(e=>Math.hypot(e.x-P.x,e.y-P.y))');
  g.step(1);
  const after = g.run('G.enemies.filter(e=>e.type==="pawn").slice(0,' + before.length + ').map(e=>Math.hypot(e.x-P.x,e.y-P.y))');
  const closer = after.filter((d, i) => d < before[i]).length;
  assert.ok(closer > after.length * 0.6, 'most pawns moved closer');
});

test('R4 each enemy piece type has its own movement and attack', () => {
  const g = startRun(loadGame({ seed: 4 }), 'sword');
  clearBoard(g);
  g.run('P.iframes=1e9;');
  const types = g.run('Object.keys(AI)');
  for (const t of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) assert.ok(types.includes(t), t + ' has AI');
  // knight hops in an L-shape
  g.run("var kn=spawnEnemy('knight',P.x+400,P.y+5);kn.t=0;");
  g.step(0.05);
  assert.equal(g.run('kn.st'), 'hop');
  // bishop snipes from range
  g.run("G.enemies=[];var bi=spawnEnemy('bishop',P.x+300,P.y+300);bi.cd=0;");
  g.step(0.05);
  assert.ok(g.run('G.eproj.length') >= 1, 'bishop fires');
  // rook winds up a charge when lined up on a rank or file
  g.run("G.enemies=[];G.eproj=[];var ro=spawnEnemy('rook',P.x+400,P.y);ro.cd=0;");
  g.step(0.05);
  assert.equal(g.run('ro.st'), 'wind');
  // queen fires a volley
  g.run("G.enemies=[];G.eproj=[];var qu=spawnEnemy('queen',P.x+400,P.y);qu.cd=0;");
  g.step(0.05);
  assert.ok(g.run('G.eproj.length') >= 5, 'queen volley');
  // king summons pawns
  g.run("G.enemies=[];var ki=spawnEnemy('king',P.x+300,P.y);ki.cd=0;");
  g.step(0.05);
  assert.ok(g.run("G.enemies.filter(e=>e.type==='pawn').length") >= 3, 'king summons');
});

test('R5 six bosses, one per piece type, each ends a floor and must be killed', () => {
  const g = startRun(loadGame({ seed: 5 }), 'sword');
  assert.equal(g.run('BOSSES.map(b=>b.type).join()'), 'pawn,knight,bishop,rook,queen,king');
  clearBoard(g);
  g.run('P.iframes=1e9;P.hp=P.maxHp=1e9;G.dur=0.05;');
  g.step(0.1);
  assert.equal(g.run('G.phase'), 'boss');
  assert.equal(g.run('G.boss.type'), 'pawn');
  g.run('G.boss.x=P.x+2000;');
  g.step(5);
  assert.equal(g.run('G.floor'), 1, 'cannot advance while the boss lives');
  assert.equal(g.run('G.state'), 'play');
  g.run('hitEnemy(G.boss,1e9);');
  assert.equal(g.run('G.phase'), 'cleared');
  // Amended in Round 3 (R46, R47): the floor now ends at the merchant cart, which opens the shop
  // when touched, not with an automatic shop screen.
  g.step(4);
  assert.ok(g.run('G.cart!==null'), 'floor ends after the boss dies: the merchant cart arrives');
  g.run('P.x=G.cart.x;P.y=G.cart.y;');
  g.step(0.1);
  assert.equal(g.run('G.state'), 'shop', 'touching the cart opens the shop');
});

test('R6 the player is promoted through the other five pieces', () => {
  const g = startRun(loadGame({ seed: 6 }), 'sword');
  for (let f = 1; f <= 5; f++) {
    g.run('spawnBoss();hitEnemy(G.boss,1e12);');
    assert.equal(g.run('FORMS[P.form]'), ['knight', 'bishop', 'rook', 'queen', 'king'][f - 1]);
    g.run('G.floor++;startFloor();G.state="play";');
  }
});

test('R7 the four Round 1 weapon classes have basic and stronger charged attacks', () => {
  for (const w of ['sword', 'bow', 'staff', 'hammer']) {
    const g = startRun(loadGame({ seed: 7 }), w);
    clearBoard(g);
    assert.ok(g.run(`!!WEAPONS.${w}`), w + ' exists');
    const d = dummy(g, 0, 0);
    g.run('var D=G.enemies[0];D.x=P.x+70;D.y=P.y;');
    g.aimAt(g.run('D.x'), g.run('D.y'));
    g.step(1 / 60);
    g.run('P.atkCd=0;basicAttack();');
    g.step(1);
    const basic = g.run('D.maxHp-D.hp');
    g.run('D.hp=D.maxHp;P.atkCd=0;P.holdT=3;P.charge=1;releaseAttack();');
    g.step(1.2);
    const charged = g.run('D.maxHp-D.hp');
    assert.ok(basic > 0, w + ' basic attack hits');
    assert.ok(charged > basic, w + ' charged attack is stronger');
    void d;
  }
});

test('R8 spell tiers scale from small to massive', () => {
  const g = loadGame({ seed: 8 });
  const spells = g.run('SPELLS');
  const median = a => { a = a.slice().sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
  const reach = s => Math.max(s.r || 0, (s.spread || 0) + (s.r || 0));
  let prev = 0;
  for (let t = 1; t <= 5; t++) {
    const dmg = spells.filter(s => s.tier === t && s.dmg).map(s => s.dmg);
    const m = median(dmg);
    assert.ok(m > prev, `tier ${t} median damage ${m} > tier ${t - 1} (${prev})`);
    prev = m;
  }
  for (const s of spells.filter(s => s.tier <= 2)) assert.ok(reach(s) <= 260, s.id + ' is small-scale');
  for (const s of spells.filter(s => s.tier === 5 && s.dmg)) assert.ok(reach(s) >= 400 || (s.len || 0) >= 1000, s.id + ' is massive');
});

test('R9 the player can equip 3 spells and each tier has at least 5 spells', () => {
  const g = startRun(loadGame({ seed: 9 }), 'sword');
  assert.equal(g.run('P.spells.length'), 3);
  for (let t = 1; t <= 5; t++) assert.ok(g.run(`SPELLS.filter(s=>s.tier===${t}).length`) >= 5);
  g.run("P.spells=[null,null,null];var ids=SPELLS.filter(s=>s.tier===1).map(s=>s.id);var done=0;");
  g.run('equipSpell(ids[0],()=>done++);equipSpell(ids[1],()=>done++);equipSpell(ids[2],()=>done++);');
  assert.equal(g.run('P.spells.filter(Boolean).length'), 3);
  assert.equal(g.run('done'), 3);
  g.run('equipSpell(ids[3],()=>done++);');
  assert.equal(g.run('done'), 3, 'a 4th spell asks to replace instead of adding a slot');
  assert.equal(g.run("$('replace').classList.contains('hidden')"), false);
});

test('R10 tiers 4 and 5 include sun, moon, darkness, light, tech and hyper spells', () => {
  const g = loadGame();
  for (const t of [4, 5]) {
    const els = new Set(g.run(`SPELLS.filter(s=>s.tier===${t}).map(s=>s.el)`));
    for (const e of ['sun', 'moon', 'darkness', 'light', 'tech', 'hyper']) assert.ok(els.has(e), `tier ${t} has ${e}`);
  }
});

test('R11 enemies scale with floor and level and can kill the player late', () => {
  const g = startRun(loadGame({ seed: 11 }), 'sword');
  const early = g.run("(()=>{const e=spawnEnemy('pawn',100,100);return [e.maxHp,e.dmg];})()");
  g.run('G.floor=6;P.level=30;');
  const late = g.run("(()=>{const e=spawnEnemy('pawn',100,100);return [e.maxHp,e.dmg];})()");
  assert.ok(late[0] > early[0] * 4, 'HP scales up');
  assert.ok(late[1] > early[1] * 2, 'damage scales up');
  g.run('P.iframes=0;damagePlayer(P.maxHp*10);');
  assert.equal(g.run('G.state'), 'over', 'the player can die');
});

test('R12 spell rewards are fair: a tier bag offers every spell before any repeat', () => {
  const g = startRun(loadGame({ seed: 12 }), 'sword');
  for (let t = 1; t <= 5; t++) {
    const n = g.run(`SPELLS.filter(s=>s.tier===${t}).length`);
    g.run(`G.bags[${t}]=[];`);
    const drawn = [];
    for (let i = 0; i < n; i++) drawn.push(g.run(`drawSpell(${t},new Set())`));
    assert.equal(new Set(drawn).size, n, `tier ${t}: all ${n} spells before a repeat`);
  }
  // every spell shows up in level-up cards over time
  g.run('G.floor=6;');
  const seen = new Set();
  for (let i = 0; i < 600; i++) for (const c of g.run('makeCards()')) if (c.type === 'spell') seen.add(c.id);
  assert.equal(seen.size, g.run('SPELLS.length'), 'every spell is offered');
});

test('R13 the shop sells spells and other items', () => {
  const g = startRun(loadGame({ seed: 13 }), 'sword');
  g.run('P.gold=5000;P.spells=[null,null,null];openShop();');
  assert.equal(g.run('G.state'), 'shop');
  assert.equal(g.run('G.shop.spells.length'), 4);
  assert.equal(g.run('G.shop.stats.length'), 3);
  const cards = g.elements('shSpells').children;
  const first = g.run('G.shop.spells[0]');
  const price = g.run(`SPELL_PRICE[SPELL_BY_ID['${first}'].tier]`);
  cards[cards.length - 4].onclick();
  assert.equal(g.run('P.gold'), 5000 - price, 'gold is spent');
  assert.ok(g.run(`P.spells.some(s=>s&&s.id==='${first}')`), 'spell is equipped');
  const items = g.elements('shItems').children;
  assert.ok(items.length >= 4, 'potion and relics on sale');
});

test('R14 controls: WASD move, click attacks, hold-release charges, 1-3 cast', () => {
  const g = startRun(loadGame({ seed: 14 }), 'sword');
  clearBoard(g);
  const y0 = g.run('P.y');
  g.fire('keydown', { key: 'w' }); g.step(0.3); g.fire('keyup', { key: 'w' });
  assert.ok(g.run('P.y') < y0, 'W moves up');
  const x0 = g.run('P.x');
  g.fire('keydown', { key: 'd' }); g.step(0.3); g.fire('keyup', { key: 'd' });
  assert.ok(g.run('P.x') > x0, 'D moves right');
  const ys = g.run('P.y');
  g.fire('keydown', { key: 's' }); g.step(0.3); g.fire('keyup', { key: 's' });
  assert.ok(g.run('P.y') > ys, 'S moves down');
  const xa = g.run('P.x');
  g.fire('keydown', { key: 'a' }); g.step(0.3); g.fire('keyup', { key: 'a' });
  assert.ok(g.run('P.x') < xa, 'A moves left');

  let basic = 0, charged = 0;
  g.context.basicAttack = () => { basic++; };
  g.context.chargedAttack = () => { charged++; };
  g.fireCanvas('mousedown', { button: 0 }); g.step(0.05); g.fire('mouseup', { button: 0 });
  assert.equal(basic, 1, 'click = basic attack');
  g.fireCanvas('mousedown', { button: 0 }); g.step(2); g.fire('mouseup', { button: 0 });
  assert.equal(charged, 1, 'hold and release = charged attack');

  g.run("P.spells=[{id:'ember',lvl:1,cd:0,cdMax:1},{id:'frost',lvl:1,cd:0,cdMax:1},{id:'spark',lvl:1,cd:0,cdMax:1}];");
  for (const k of ['1', '2', '3']) g.fire('keydown', { key: k });
  for (const k of ['1', '2', '3']) g.fire('keyup', { key: k });
  g.step(1);
  assert.ok(g.run('P.spells.every(s=>s.cd>0)'), '1 2 3 cast the three spells');
});

test('R15 the menu shows a scoreboard with highest floor and score', () => {
  const scores = [{ name: 'Ana', floor: 4, score: 51234, weapon: 'Bow', won: false, date: 1 }];
  const g = loadGame({ storage: { slaughtermate_scores: JSON.stringify(scores) } });
  g.run('showMenu()');
  assert.equal(g.run('G.state'), 'menu');
  const html = g.elements('scores').innerHTML;
  assert.match(html, /Ana/);
  assert.match(html, /<td>4<\/td>/);
  assert.match(html, /51,234|51234/);
  assert.equal(g.elements('bestFloor').textContent, '4');
});

test('R16 the game runs offline: no network URLs or requests', () => {
  assert.doesNotMatch(HTML, /(src|href)\s*=\s*["']?\s*(https?:)?\/\//i, 'no external resources');
  assert.doesNotMatch(HTML, /@import|url\(\s*["']?https?:/i, 'no external CSS');
  assert.doesNotMatch(SCRIPT, /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|import\s*\(/, 'no network calls');
});
