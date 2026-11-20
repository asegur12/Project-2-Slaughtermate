'use strict';
// Round 3 tests. Each test name starts with the requirement ID (see spec.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, startRun, clearBoard, dummy, HTML } = require('./harness');

const rgb = hex => { const n = parseInt(String(hex).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const ELEMENTS = ['fire', 'ice', 'lightning', 'earth', 'wind', 'nature', 'poison', 'arcane', 'light', 'sun', 'moon', 'darkness', 'tech', 'hyper', 'mind'];
// R36-R45: the particle each element uses instead of plain sparkles, and its area-effect style.
const EXPECT_PART = { fire: 'flame', sun: 'crescent', ice: 'flake', poison: 'skull', lightning: 'zap', arcane: 'shape', hyper: 'piece',
  tech: 'pixel', mind: 'circle', moon: 'star', light: 'streak', darkness: 'wisp', nature: 'leaf', wind: 'cloud', earth: 'debris' };
const EXPECT_AREA = { fire: 'fire', sun: 'domain', ice: 'ice', poison: 'puddle', lightning: 'storm', arcane: 'portal', tech: 'grid',
  mind: 'warp', moon: 'night', darkness: 'void', nature: 'vines', wind: 'fog', hyper: 'plain', light: 'plain', earth: 'plain' };

function cast(g, id, x, y) {
  g.run(`P.spells[0]={id:'${id}',lvl:1,cd:0,cdMax:1};`);
  g.aimAt(x, y);
  g.run('castSpell(0);');
}
function arena(seed, weapon) {
  const g = startRun(loadGame({ seed }), weapon || 'sword');
  clearBoard(g);
  g.run('P.hp=P.maxHp=1e9;P.iframes=1e9;P.crit=0;');
  return g;
}
// Kill the current floor's boss and let the floor-clear sequence run.
function clearFloor(g) {
  g.run('spawnBoss();hitEnemy(G.boss,1e13);');
  g.run('P.x=WORLD/2+900;P.y=WORLD/2;');   // stand away from the centre so the cart is not touched yet
  g.step(2);
}

/* ---------- R36 - R45 spell element designs ---------- */

test('R36-R45 every element has its own particle shape and area style', () => {
  const g = loadGame();
  for (const el of ELEMENTS) {
    assert.equal(g.run(`EL_PART.${el}`), EXPECT_PART[el], el + ' particle');
    assert.equal(g.run(`EL_AREA.${el}`), EXPECT_AREA[el], el + ' area effect');
    assert.equal(g.run(`typeof PART_DRAW[EL_PART.${el}]`), 'function', el + ' particle has a renderer');
  }
});

test('R36-R45 casting any spell emits its element particles and no coloured sparkles', () => {
  const g = arena(361);
  dummy(g, 0, 0);
  g.run('var D=G.enemies[0];D.x=P.x+140;D.y=P.y;');
  for (const s of JSON.parse(g.run('JSON.stringify(SPELLS.map(s=>({id:s.id,el:s.el,kind:s.kind,r:s.r})))'))) {
    const dist = s.kind === 'orbit' ? s.r : 140;
    g.run(`G.parts=[];G.zones=[];G.pstrikes=[];G.beams=[];G.orbs=[];G.pproj=[];G.casts=[];G.fx=[];D.hp=D.maxHp;D.dots=[];D.x=P.x+${dist};D.y=P.y;D.kx=D.ky=0;`);
    cast(g, s.id, g.run('D.x'), g.run('D.y'));
    let own = 0, coloured = 0;
    for (let i = 0; i < 100; i++) {
      g.step(1 / 60);
      own = Math.max(own, g.run(`G.parts.filter(p=>p.shape===EL_PART['${s.el}']).length`));
      coloured = Math.max(coloured, g.run(`G.parts.filter(p=>p.shape==='spark'&&p.c===EL_COL['${s.el}']).length`));
    }
    assert.ok(own > 0, `${s.id} (${s.el}) emits ${EXPECT_PART[s.el]} particles`);
    assert.equal(coloured, 0, `${s.id} no longer emits ${s.el}-coloured sparkles`);
  }
});

test('R36 fire keeps its colour; sun is a deeper red with large and small jagged crescents', () => {
  const g = loadGame();
  assert.equal(g.run('EL_COL.fire'), '#ff6a2b', 'fire colour unchanged');
  const [r, gg, b] = rgb(g.run('EL_COL.sun'));
  assert.ok(r >= 150 && gg < 80 && b < 80, 'sun is a deep red, got ' + g.run('EL_COL.sun'));
  g.run("G.parts=[];for(let i=0;i<200;i++)elPart('sun',0,0);");
  const sizes = JSON.parse(g.run("JSON.stringify(G.parts.filter(p=>p.shape==='crescent').map(p=>p.sz))"));
  assert.ok(sizes.length > 100);
  assert.ok(Math.max(...sizes) / Math.min(...sizes) >= 2.5, 'crescents come large and small');
  assert.ok(g.run("G.parts.every(p=>p.shape!=='crescent'||p.jag>=5)"), 'crescent outlines are jagged');
});

test('R37 R39 ice bolts are snowflakes and lightning bolts are thunderbolts', () => {
  const g = loadGame();
  assert.equal(g.run("boltLook('ice')"), 'flake');
  assert.equal(g.run("boltLook('lightning')"), 'thunder');
  assert.equal(g.run("boltLook('fire')"), 'flame');
  // lightning chains are drawn as zigzag thunderbolts with zigzag particles
  const a = arena(371);
  dummy(a, 0, 0);
  a.run('var D=G.enemies[0];D.x=P.x+120;D.y=P.y;G.parts=[];G.fx=[];');
  cast(a, 'spark', a.run('D.x'), a.run('D.y'));
  assert.ok(a.run("G.fx.some(f=>f.kind==='bolt'&&f.pts.length>=6)"), 'thunderbolt zigzag');
  assert.ok(a.run("G.parts.some(p=>p.shape==='zap')"), 'small zigzag particles');
});

test('R40 arcane uses varied, larger shapes; hyper uses chess-piece outlines', () => {
  const g = loadGame({ seed: 40 });
  g.run('G.parts=[];for(let i=0;i<300;i++)elPart("arcane",0,0);');
  assert.ok(g.run('new Set(G.parts.map(p=>p.n)).size') >= 3, 'arcane particles have various shapes');
  const arc = g.run('G.parts.reduce((a,p)=>a+p.sz,0)/G.parts.length');
  let other = 0;
  for (const el of ELEMENTS.filter(e => e !== 'arcane')) {
    g.run(`G.parts=[];for(let i=0;i<200;i++)elPart("${el}",0,0);`);
    other = Math.max(other, g.run('G.parts.reduce((a,p)=>a+p.sz,0)/G.parts.length'));
  }
  assert.ok(arc > other, `arcane particles are the largest (${arc.toFixed(1)} vs ${other.toFixed(1)})`);
  g.run('G.parts=[];for(let i=0;i<200;i++)elPart("hyper",0,0);');
  assert.ok(g.run("G.parts.every(p=>p.shape==='piece'&&FORMS.includes(p.piece)&&p.c===EL_COL.hyper)"), 'hyper piece outlines in hyper colour');
  assert.ok(g.run('new Set(G.parts.map(p=>p.piece)).size') >= 4, 'several piece types');
});

test('R43 light spells add extra streak lines', () => {
  const g = arena(431);
  g.run('G.parts=[];');
  cast(g, 'glint', g.run('P.x+300'), g.run('P.y'));
  assert.ok(g.run("G.parts.filter(p=>p.shape==='streak').length") >= 8, 'a light ray throws many streaks');
  assert.ok(g.run("G.parts.filter(p=>p.shape==='streak').every(p=>p.len>0)"), 'streaks are lines');
});

test('R36-R45 area effects draw in each element style', () => {
  const g = loadGame({ recordCtx: true });
  g.run('cam.x=0;cam.y=0;');
  for (const el of ELEMENTS) {
    g.ctxCalls.length = 0;
    assert.equal(g.run(`drawArea('${el}',300,300,150,1,0.5)`), EXPECT_AREA[el]);
    assert.ok(g.ctxCalls.length >= 6, el + ' area issues drawing calls');
  }
  // spot checks of distinctive drawing
  g.ctxCalls.length = 0; g.run("drawArea('tech',300,300,150,1,0.5)");
  assert.ok(g.ctxCalls.filter(([k]) => k === 'lineTo').length >= 10, 'tech area is a grid of lines');
  g.ctxCalls.length = 0; g.run("drawArea('moon',300,300,150,1,0.5)");
  assert.ok(g.ctxCalls.some(([k, a]) => k === 'set:fillStyle' && /#0[0-9a-f]1|#0b1030|#0a0f2a|#101a3a/i.test(String(a[0]))), 'night sky is dark blue');
  g.ctxCalls.length = 0; g.run("drawArea('mind',300,300,150,1,0.5)");
  const hues1 = g.ctxCalls.filter(([k, a]) => k === 'set:fillStyle' && /hsl/.test(String(a[0]))).map(([, a]) => a[0]);
  g.run('G.time+=0.7;'); g.ctxCalls.length = 0; g.run("drawArea('mind',300,300,150,1,0.5)");
  const hues2 = g.ctxCalls.filter(([k, a]) => k === 'set:fillStyle' && /hsl/.test(String(a[0]))).map(([, a]) => a[0]);
  assert.ok(hues1.length && hues1.join() !== hues2.join(), 'mind area warps through colours');
});

test('R36-R45 zones and spell bursts are rendered through the element area styles', () => {
  const g = arena(362);
  g.run('var seen=[];const _da=drawArea;drawArea=(el,...a)=>{seen.push(el);return _da(el,...a);};');
  for (const id of ['toxic', 'blizzard', 'cyclone', 'vines', 'grasp', 'tide', 'inferno', 'psystorm', 'rift']) {
    g.run(`G.zones=[];G.fx=[];seen.length=0;`);
    cast(g, id, g.run('P.x+150'), g.run('P.y'));
    g.step(0.7);
    g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();');
    const el = g.run(`SPELL_BY_ID['${id}'].el`);
    assert.ok(g.run(`seen.includes('${el}')`), id + ' zone drawn as ' + EXPECT_AREA[el]);
  }
  // novas and strike impacts leave an element-styled area flash
  g.run('G.fx=[];seen.length=0;');
  cast(g, 'sunspark', g.run('P.x+100'), g.run('P.y'));
  g.run('render();');
  assert.ok(g.run("seen.includes('sun')"), 'sun nova shows the deep red domain');
});

test('R36-R45 every particle shape renders, glowing ones additively', () => {
  const g = loadGame({ recordCtx: true });
  g.run('cam.x=0;cam.y=0;G.parts=[];');
  for (const el of ELEMENTS) g.run(`for(let i=0;i<5;i++)elPart('${el}',200,200);`);
  g.ctxCalls.length = 0;
  g.run('drawParticles();');
  assert.ok(g.ctxCalls.length > 100);
  assert.ok(g.ctxCalls.some(([k, a]) => k === 'set:globalCompositeOperation' && a[0] === 'lighter'));
  g.run('G.parts=[];render();');
});

/* ---------- R46 - R48 shop cart and fragments ---------- */

test('R46 the merchant cart appears in the centre only after the boss dies', () => {
  const g = arena(46);
  assert.equal(g.run('G.cart'), null, 'no cart during the wave');
  g.run('spawnBoss();');
  g.step(0.2);
  assert.equal(g.run('G.cart'), null, 'no cart during the boss fight');
  g.run('hitEnemy(G.boss,1e13);P.x=WORLD/2+900;P.y=WORLD/2;');
  g.step(2);
  assert.ok(g.run('G.cart!==null'), 'cart arrives after the boss dies');
  assert.equal(g.run('G.cart.x'), g.run('WORLD/2'));
  assert.equal(g.run('G.cart.y'), g.run('WORLD/2'));
  assert.equal(g.run('G.cart.pawns.length'), 3, '3 white pawns beside the cart');
  assert.equal(g.run('G.state'), 'play', 'the shop does not open by itself');
  g.step(5);
  assert.equal(g.run('G.state'), 'play');
  g.run('cam.x=WORLD/2-VW/2;cam.y=WORLD/2-VH/2;render();');
});

test('R46 no cart after the final King; winning still ends the run', () => {
  const g = arena(461);
  g.run('G.floor=6;startFloor();G.state="play";P.iframes=1e9;P.hp=P.maxHp=1e9;');
  g.run('spawnBoss();hitEnemy(G.boss,1e13);');
  g.step(5);
  assert.equal(g.run('G.cart'), null);
  assert.equal(g.run('G.state'), 'over');
});

test('R47 touching the cart opens the shop; Escape closes it and starts the next floor', () => {
  const g = arena(47);
  clearFloor(g);
  assert.equal(g.run('G.state'), 'play');
  g.run('P.x=G.cart.x;P.y=G.cart.y+30;');
  g.step(0.1);
  assert.equal(g.run('G.state'), 'shop', 'touching the cart opens the shop');
  assert.ok(!g.elements('shop').classList.contains('hidden'));
  g.fire('keydown', { key: 'Escape' });
  g.fire('keyup', { key: 'Escape' });
  assert.ok(g.elements('shop').classList.contains('hidden'), 'Escape closes the shop');
  assert.equal(g.run('G.state'), 'play');
  assert.equal(g.run('G.floor'), 2, 'next floor starts');
  assert.equal(g.run('G.phase'), 'wave');
  assert.equal(g.run('G.cart'), null, 'the cart leaves with the old floor');
  // Escape during play still pauses (R14)
  g.fire('keydown', { key: 'Escape' });
  assert.equal(g.run('G.state'), 'paused');
});

test('R47 the advance button also closes the shop and the shop never opens on its own', () => {
  const g = arena(471);
  clearFloor(g);
  g.step(6);
  assert.equal(g.run('G.state'), 'play');
  g.run('P.x=G.cart.x+20;P.y=G.cart.y;');
  g.step(0.1);
  assert.equal(g.run('G.state'), 'shop');
  g.elements('shGo').onclick();
  assert.equal(g.run('G.floor'), 2);
  assert.equal(g.run('G.state'), 'play');
});

test('R48 enemies drop chess-piece fragment shards that pay for the shop', () => {
  const g = arena(48);
  g.run('for(let i=0;i<60;i++){const e=spawnEnemy("pawn",P.x+300,P.y);hitEnemy(e,1e9);}');
  assert.ok(g.run("G.pickups.some(p=>p.k==='frag')"), 'fragments drop');
  assert.ok(g.run("G.pickups.every(p=>p.k==='xp'||p.k==='frag')"), 'no gold coins');
  const before = g.run('P.gold');
  g.run('var shards=0;const _ds=drawShard;drawShard=(...a)=>{shards++;return _ds(...a);};');
  g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();');
  assert.ok(g.run('shards') >= 2, 'pickups and HUD draw shards');
  g.run('P.magnet=2000;');
  g.step(1.5);
  assert.ok(g.run('P.gold') > before, 'collected fragments are counted');
  assert.ok(g.run("G.texts.every(t=>!/\\d+g$/.test(t.txt))"), 'no "g" (gold) pickup text');
});

test('R48 the shop prices everything in fragments', () => {
  const g = arena(481);
  g.run('P.gold=5000;openShop();');
  const html = g.elements('shop').innerHTML + g.elements('shSpells').children.map(c => c.innerHTML).join('') +
    g.elements('shItems').children.map(c => c.innerHTML).join('');
  assert.match(html, /fragment/i);
  assert.doesNotMatch(html, /\bgold\b/i, 'no mention of gold');
  assert.match(html, /class="shard"/, 'shard icon');
  assert.doesNotMatch(HTML.match(/<div class="controls">[\s\S]*?<\/div>/)[0], /\bgold\b/i);
});

/* ---------- R49 logbook ---------- */

test('R49 the menu logbook lists every spell, locked until obtained', () => {
  assert.match(HTML, /id="logBtn"/, 'menu has a logbook button');
  const g = loadGame({ seed: 49 });
  g.run('showMenu();');
  g.elements('logBtn').onclick();
  assert.ok(!g.elements('logbook').classList.contains('hidden'), 'logbook opens');
  const html = g.elements('logbook').innerHTML;
  const total = g.run('ALL_SPELLS.length');
  assert.equal(total, 78, '75 tiered spells plus 3 Grandmaster spells');
  assert.equal((html.match(/class="logent/g) || []).length, total, 'one entry per obtainable spell');
  assert.equal((html.match(/logent locked/g) || []).length, total, 'all locked at first');
  assert.doesNotMatch(html, /Supernova|Game of Despair/, 'locked spells hide their names');
  assert.match(html, /0 \/ 78/);
  g.elements('logClose').onclick();
  assert.ok(g.elements('logbook').classList.contains('hidden'));
});

test('R49 obtaining a spell in a run unlocks it in the logbook across runs', () => {
  const g = startRun(loadGame({ seed: 491 }), 'sword');
  const first = g.run('P.spells[0].id');
  g.run("equipSpell('supernova',()=>{});");
  const saved = JSON.parse(g.storage.get('slaughtermate_logbook'));
  assert.ok(saved.includes(first), 'starting spell unlocked');
  assert.ok(saved.includes('supernova'), 'reward spell unlocked');
  const g2 = loadGame({ storage: { slaughtermate_logbook: JSON.stringify(saved) } });
  g2.run('showMenu();showLogbook();');
  const html = g2.elements('logbook').innerHTML;
  assert.match(html, /Supernova/);
  assert.match(html, new RegExp(`${saved.length} / 78`));
  assert.equal((html.match(/logent locked/g) || []).length, 78 - saved.length);
});

/* ---------- R50 crowns ---------- */

test('R50 winning a run crowns the weapon, sized by difficulty', () => {
  const g = loadGame({ seed: 50 });
  g.run("newRun('bow','easy');endRun(true);");
  assert.deepEqual(JSON.parse(g.storage.get('slaughtermate_crowns')), { bow: 'easy' });
  g.run('showMenu();');
  const card = k => g.elements('weapons').children[g.run(`Object.keys(WEAPONS).indexOf('${k}')`)].innerHTML;
  const px = html => +(html.match(/class="crown"[^>]*font-size:(\d+)px/) || [0, 0])[1];
  assert.equal(px(card('bow')), g.run('CROWN_PX.easy'), 'easy crown');
  assert.equal(px(card('sword')), 0, 'uncleared weapon has no crown');
  g.run("newRun('bow','hard');endRun(true);showMenu();");
  assert.equal(px(card('bow')), g.run('CROWN_PX.hard'), 'hard crown replaces easy');
  g.run("newRun('bow','normal');endRun(true);showMenu();");
  assert.equal(px(card('bow')), g.run('CROWN_PX.hard'), 'never downgraded');
  g.run("newRun('sword','normal');endRun(false);showMenu();");
  assert.equal(px(card('sword')), 0, 'a lost run earns no crown');
  assert.ok(g.run('CROWN_PX.easy<CROWN_PX.normal&&CROWN_PX.normal<CROWN_PX.hard'), 'size grows with difficulty');
});

/* ---------- R51 - R54 Grandmaster ---------- */

test('R51 the Grandmaster tier ranks above tier 5', () => {
  const g = loadGame();
  const gm = JSON.parse(g.run('JSON.stringify(GM_SPELLS)'));
  assert.deepEqual(gm.map(s => s.id).sort(), ['despair', 'inversion', 'seal']);
  assert.ok(gm.every(s => s.tier === 6 && s.r >= 500 && s.cd >= 30), 'tier 6, huge area, long cooldown');
  const t5max = g.run('Math.max(...SPELLS.filter(s=>s.tier===5).map(s=>s.dmg||0))');
  for (const id of ['despair', 'seal']) assert.ok(gm.find(s => s.id === id).dmg > t5max * 1.5, id + ' outclasses tier 5');
  assert.equal(g.run('SPELLS.some(s=>s.tier===6)'), false, 'tiers 1-5 list unchanged');
  assert.ok(g.run("GM_SPELLS.every(s=>SPELL_BY_ID[s.id]===s)"));
  assert.equal(g.run('TIER_NAME[6]'), 'Grandmaster');
  assert.match(g.run("spellCardHTML('despair')"), /Grandmaster/);
});

test('R51 Grandmaster spells are rare rewards from floor 4 and every one is offered fairly', () => {
  const g = startRun(loadGame({ seed: 511 }), 'sword');
  for (const f of [1, 2, 3]) {
    g.run(`G.floor=${f};`);
    for (let i = 0; i < 400; i++) assert.ok(g.run('makeCards().every(c=>c.type!=="gm")'), 'no Grandmaster before floor 4');
  }
  g.run('G.floor=6;G.gmPity=0;');
  let gmCards = 0, spellCards = 0; const seen = new Set();
  for (let i = 0; i < 600; i++) for (const c of g.run('makeCards()')) {
    if (c.type === 'gm') { gmCards++; seen.add(c.id); } else if (c.type === 'spell') spellCards++;
  }
  assert.equal(seen.size, 3, 'all three are offered');
  assert.ok(gmCards < spellCards / 5, 'Grandmaster cards stay rare');
  g.run('G.bags[6]=[];');
  assert.equal(new Set([0, 1, 2].map(() => g.run('drawGM(new Set())'))).size, 3, 'shuffle bag gives each before repeats');
});

test('R51 the cart sells one Grandmaster spell from floor 4 on', () => {
  const g = arena(512);
  g.run('G.floor=3;P.gold=1e5;openShop();');
  assert.equal(g.run('G.shop.gm'), null, 'none before floor 4');
  g.run('G.floor=4;openShop();');
  const id = g.run('G.shop.gm');
  assert.ok(['despair', 'inversion', 'seal'].includes(id));
  const box = g.elements('shGm').children;
  assert.equal(box.length, 1);
  assert.match(box[0].innerHTML, /Grandmaster/);
  g.run('P.spells=[null,null,null];');
  box[0].onclick();
  assert.equal(g.run('P.gold'), 1e5 - g.run('GM_PRICE'), 'costs GM_PRICE fragments');
  assert.ok(g.run(`P.spells.some(s=>s&&s.id==='${id}')`), 'equipped');
  assert.ok(g.run('GM_PRICE') > g.run('SPELL_PRICE[5]') * 1.5, 'priced well above tier 5');
});

test('R52 Game of Despair: chess phantoms gather into an orb that bursts and weakens', () => {
  const g = arena(52);
  const cx = g.run('P.x+300'), cy = g.run('P.y');
  g.run(`var A=spawnEnemy('rook',${cx},${cy}),B=spawnEnemy('pawn',${cx + 300},${cy}),O=spawnEnemy('pawn',${cx + 1200},${cy});`);
  g.run('for(const e of [A,B,O]){e.hp=e.maxHp=1e7;e.dmg=10;e.speed=0;e.stunT=1e9;}');
  cast(g, 'despair', cx, cy);
  g.step(0.6);
  const R = g.run("G.rituals.find(r=>r.kind==='despair')");
  assert.ok(R, 'domain is cast');
  assert.equal(g.run("G.rituals[0].phantoms.map(p=>p.type).sort().join()"), 'bishop,king,knight,pawn,queen,rook', 'a phantom of each piece');
  assert.equal(g.run('A.hp'), g.run('A.maxHp'), 'power gathers before the burst');
  g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();');
  g.step(3.5);
  const dmg = g.run("SPELL_BY_ID.despair.dmg");
  assert.ok(g.run('A.maxHp-A.hp') >= dmg * 0.9, 'centre takes huge damage');
  assert.ok(g.run('B.maxHp-B.hp') >= dmg * 0.9, 'whole domain is hit');
  assert.equal(g.run('O.hp'), g.run('O.maxHp'), 'outside the domain is safe');
  assert.ok(g.run('A.weakT>0&&A.despairT>0'), 'hit enemies are weakened');
  assert.ok(g.run('edmg(A)<A.dmg'), 'weakened enemies deal less damage');
  assert.equal(g.run('G.rituals.length'), 0);
});

test('R53 Mental Inversion: controlled enemies fight their own side and victims explode', () => {
  const g = arena(53);
  g.run('P.iframes=0;P.hp=P.maxHp=1000;P.armor=0;');
  // A is in the pulse; B and C are well outside it, C just behind B
  g.run(`var A=spawnEnemy('pawn',P.x+250,P.y),B=spawnEnemy('pawn',P.x+1000,P.y),C=spawnEnemy('pawn',P.x+1060,P.y),K=spawnEnemy('pawn',P.x-250,P.y);
    A.hp=A.maxHp=1e6;B.hp=B.maxHp=1;C.hp=C.maxHp=1e6;K.hp=K.maxHp=1e6;for(const e of [B,C])e.speed=0,e.stunT=1e9;K.dmg=0;`);
  g.run('spawnBoss();G.boss.x=P.x;G.boss.y=P.y+300;G.boss.atkT=1e9;G.boss.speed=0;');
  cast(g, 'inversion', g.run('P.x+300'), g.run('P.y'));
  g.step(0.6);
  assert.ok(g.run('A.charmT>0&&K.charmT>0'), 'enemies hit by the pulse are mind controlled');
  assert.ok(!(g.run('B.charmT') > 0), 'enemies outside are not');
  assert.ok(!(g.run('G.boss.charmT') > 0), 'bosses are immune');
  g.run('G.enemies=G.enemies.filter(e=>!e.boss);G.boss=null;G.phase="wave";');   // take the boss out so A's nearest target is B
  // a controlled piece touching the player does not hurt
  const hp0 = g.run('P.hp');
  g.run('K.x=P.x+5;K.y=P.y;K.dmg=50;');
  g.step(0.2);
  assert.equal(g.run('P.hp'), hp0, 'controlled enemies do not attack the player');
  // A hunts B, kills it, and B explodes onto C
  let boomed = false;
  for (let i = 0; i < 600 && !boomed; i++) { g.step(1 / 60); if (g.run('B.dead')) boomed = true; }
  assert.ok(boomed, 'the controlled enemy kills an enemy');
  assert.ok(g.run('C.maxHp-C.hp') >= g.run('SPELL_BY_ID.inversion.boom') * 0.9, 'the victim explodes and damages its neighbours');
  // control wears off
  g.step(g.run('SPELL_BY_ID.inversion.dur') + 0.5);
  assert.ok(g.run('A.charmT<=0'), 'mind control wears off');
});

test('R54 Grand Seal: chains and 5 portals pull enemies in, then it explodes and freezes them', () => {
  const g = arena(54);
  const cx = g.run('P.x+400'), cy = g.run('P.y');
  g.run(`var I=[];for(let k=0;k<6;k++){const a=k/6*TAU,e=spawnEnemy('pawn',${cx}+Math.cos(a)*320,${cy}+Math.sin(a)*320);e.hp=e.maxHp=1e7;e.dmg=0;e.speed=0;I.push(e);}
    var O=spawnEnemy('pawn',${cx + 1300},${cy});O.hp=O.maxHp=1e7;O.speed=0;`);
  cast(g, 'seal', cx, cy);
  g.step(0.5);
  assert.equal(g.run("G.rituals.find(r=>r.kind==='seal').portals.length"), 5, 'five portals');
  assert.ok(g.run("G.rituals[0].chains>=12"), 'chains ring the area');
  const near = () => g.run('I.reduce((a,e)=>a+Math.min(...G.rituals[0].portals.map(p=>Math.hypot(e.x-p.x,e.y-p.y))),0)');
  const d0 = near();
  g.step(1);
  assert.ok(near() < d0 * 0.8, 'portals pull enemies in');
  g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();');
  g.step(2.5);
  const dmg = g.run('SPELL_BY_ID.seal.dmg');
  assert.ok(g.run(`I.every(e=>e.maxHp-e.hp>=${dmg}*0.9)`), 'the seal explodes on everything inside');
  assert.ok(g.run('I.every(e=>e.stunT>0&&e.frozenT>0)'), 'and freezes them');
  assert.equal(g.run('O.hp'), g.run('O.maxHp'), 'outside the seal is untouched');
});

test('R51-R54 Grandmaster spells can be cast from a slot with 1/2/3 and render in the HUD', () => {
  const g = arena(515, 'staff');
  g.run("P.spells=[{id:'despair',lvl:1,cd:0,cdMax:1},{id:'inversion',lvl:1,cd:0,cdMax:1},{id:'seal',lvl:1,cd:0,cdMax:1}];");
  g.aimAt(g.run('P.x+300'), g.run('P.y'));
  for (const k of ['1', '2', '3']) { g.fire('keydown', { key: k }); g.fire('keyup', { key: k }); g.step(0.7); }
  assert.ok(g.run('P.spells.every(s=>s.cd>0)'), 'all three cast');
  for (let i = 0; i < 8; i++) { g.step(0.5); g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();'); }
});
