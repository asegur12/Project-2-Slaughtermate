'use strict';
// Round 2 tests. Each test name starts with the requirement ID (see spec.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, startRun, clearBoard, dummy, HTML } = require('./harness');

const rgb = hex => { const n = parseInt(String(hex).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lum = hex => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const ELEMENTS = ['fire', 'ice', 'lightning', 'earth', 'wind', 'nature', 'poison', 'arcane', 'light', 'sun', 'moon', 'darkness', 'tech', 'hyper', 'mind'];
const ROUND1_SPELLS = ['ember:1:fire', 'frost:1:ice', 'spark:1:lightning', 'pebble:1:earth', 'gust:1:wind', 'mend:1:nature',
  'fireball:2:fire', 'icering:2:ice', 'chainl:2:lightning', 'toxic:2:poison', 'thorns:2:nature', 'stoneskin:2:earth',
  'meteor:3:fire', 'blizzard:3:ice', 'storm:3:lightning', 'quake:3:earth', 'orbs:3:arcane', 'lance:3:light',
  'flare:4:sun', 'tide:4:moon', 'rift:4:darkness', 'radiant:4:light', 'drones:4:tech', 'warp:4:hyper',
  'supernova:5:sun', 'fullmoon:5:moon', 'abyss:5:darkness', 'judgment:5:light', 'orbital:5:tech', 'collapse:5:hyper'];

// Put the player on floor f with that floor's freshly generated map.
function onFloor(g, f) { g.run(`G.floor=${f};startFloor();G.state='play';`); return g; }
// Count buildings (castles + houses) a floor's generator places, averaged over several maps.
function buildings(f, seeds) {
  let tot = 0;
  for (const seed of seeds) {
    const g = loadGame({ seed });
    tot += g.run(`genMap(${f}).filter(s=>s.k==='keep'||s.k==='house').length`);
  }
  return tot / seeds.length;
}
const SEEDS = [1, 2, 3, 4, 5];
// Fraction of free floor reachable by the player from the start (20px grid flood fill).
function walkable(g) {
  return g.run(`(()=>{const C=20,N=Math.ceil(WORLD/C),r=P.r,blocked=new Uint8Array(N*N);
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=i*C+C/2,y=j*C+C/2;
      if(x<r||y<r||x>WORLD-r||y>WORLD-r){blocked[i*N+j]=1;continue;}
      for(const s of G.structs)if(x>s.x-r&&x<s.x+s.w+r&&y>s.y-r&&y<s.y+s.h+r){blocked[i*N+j]=1;break;}}
    const seen=new Uint8Array(N*N),st=[((P.x/C)|0)*N+((P.y/C)|0)];let reach=0,free=0;
    for(let k=0;k<N*N;k++)if(!blocked[k])free++;
    while(st.length){const k=st.pop();if(seen[k]||blocked[k])continue;seen[k]=1;reach++;const i=(k/N)|0,j=k%N;
      if(i>0)st.push(k-N);if(i<N-1)st.push(k+N);if(j>0)st.push(k-1);if(j<N-1)st.push(k+1);}
    return reach/free;})()`);
}
// Cast the spell `id` from slot 1 at world point (x,y).
function cast(g, id, x, y) {
  g.run(`P.spells[0]={id:'${id}',lvl:1,cd:0,cdMax:1};`);
  g.aimAt(x, y);
  g.run('castSpell(0);');
}

/* ---------- R17 / R18 effects ---------- */

test('R17 every spell produces sparkle particles, more for higher tiers', () => {
  const g = startRun(loadGame({ seed: 17 }), 'sword');
  clearBoard(g);
  g.run('P.hp=P.maxHp=1e9;P.iframes=1e9;');
  dummy(g, 0, 0);
  g.run('var D=G.enemies[0];D.x=P.x+220;D.y=P.y;');
  const perTier = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const s of g.run('SPELLS.map(s=>({id:s.id,tier:s.tier}))')) {
    g.run('G.parts=[];G.zones=[];G.pstrikes=[];G.beams=[];G.orbs=[];G.pproj=[];G.casts=[];D.hp=D.maxHp;D.dots=[];');
    cast(g, s.id, g.run('D.x'), g.run('D.y'));
    let sparks = 0, peak = 0;
    for (let i = 0; i < 90; i++) {
      g.step(1 / 60);
      sparks = Math.max(sparks, g.run("G.parts.filter(p=>p.shape==='spark').length"));
      peak = Math.max(peak, g.run('G.parts.length'));
    }
    assert.ok(sparks > 0, s.id + ' makes sparkles');
    perTier[s.tier].push(peak);
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(avg(perTier[5]) > avg(perTier[1]), 'tier 5 effects are bigger than tier 1');
  assert.ok(avg(perTier[4]) > avg(perTier[2]), 'tier 4 effects are bigger than tier 2');
});

test('R17 spell projectiles leave sparkling trails and the renderer draws sparkles', () => {
  const g = startRun(loadGame({ seed: 171, recordCtx: true }), 'sword');
  clearBoard(g);
  g.run('G.parts=[];');
  cast(g, 'ember', g.run('P.x+600'), g.run('P.y'));
  g.step(0.3);
  assert.ok(g.run("G.parts.some(p=>p.shape==='spark')"), 'bolt trail sparkles');
  g.ctxCalls.length = 0;
  g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();');
  assert.ok(g.ctxCalls.some(([k, a]) => k === 'set:globalCompositeOperation' && a[0] === 'lighter'), 'sparkles glow (additive blend)');
});

test('R18 enemy projectiles leave glowing trails', () => {
  const g = startRun(loadGame({ seed: 18 }), 'sword');
  clearBoard(g);
  g.run("P.iframes=1e9;var bi=spawnEnemy('bishop',P.x+300,P.y+300);bi.cd=0;");
  g.step(0.05);
  assert.ok(g.run('G.eproj.length') > 0);
  g.run('G.parts=[];bi.dead=true;');
  g.step(0.3);
  assert.ok(g.run('G.parts.length') > 3, 'trail particles behind enemy shots');
  assert.ok(g.run("G.parts.some(p=>p.shape==='spark'||p.shape==='ember')"));
});

test('R18 boss telegraphs burst with sparks and debris when they land', () => {
  const g = startRun(loadGame({ seed: 181 }), 'sword');
  clearBoard(g);
  g.run('P.iframes=1e9;G.parts=[];hzCircle(P.x+100,P.y,120,0.2,10);hzLine(P.x,P.y+200,0,600,60,0.2,10);');
  g.step(0.3);
  assert.ok(g.run("G.parts.filter(p=>p.shape==='spark').length") >= 10, 'sparks on impact');
  assert.ok(g.run("G.parts.filter(p=>p.shape==='debris').length") >= 5, 'debris on impact');
});

/* ---------- R19 - R26 floors ---------- */

test('R19 every floor has its own theme and a freshly generated map', () => {
  // Amended in Round 4 (R59, R62): FLOOR_THEMES are the chess theme's floors; R59 tests the fantasy ones.
  const g = startRun(loadGame({ seed: 19, storage: { slaughtermate_look: 'chess' } }), 'sword');
  assert.equal(g.run('FLOOR_THEMES.length'), 6);
  const names = g.run('FLOOR_THEMES.map(t=>t.name).join("|")');
  assert.equal(names, 'Opening|Early Game|Midgame|Middle Gambit|Climax|Endgame');
  const maps = [];
  const tiles = [];
  for (let f = 1; f <= 6; f++) {
    onFloor(g, f);
    maps.push(g.run('JSON.stringify(G.structs.map(s=>[s.k,Math.round(s.x),Math.round(s.y)]))'));
    tiles.push(g.run('G.theme.tileA+G.theme.tileB'));
    assert.equal(g.run('G.theme.name'), g.run(`FLOOR_THEMES[${f - 1}].name`));
  }
  assert.equal(new Set(maps).size, 6, 'each floor has a different layout');
  assert.equal(new Set(tiles).size, 6, 'each floor has different colours');
});

test('R19 the ground is drawn in the current floor colours', () => {
  const g = startRun(loadGame({ seed: 191, recordCtx: true }), 'sword');
  for (const f of [1, 5]) {
    onFloor(g, f);
    g.ctxCalls.length = 0;
    g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;drawGround();');
    const fills = new Set(g.ctxCalls.filter(([k]) => k === 'set:fillStyle').map(([, a]) => a[0]));
    assert.ok(fills.has(g.run('G.theme.tileA')) && fills.has(g.run('G.theme.tileB')), 'floor ' + f + ' tiles');
  }
});

test('R20 floor 1 Opening is light and cool with minimal structures', () => {
  const g = loadGame();
  const t = g.run('FLOOR_THEMES[0]');
  for (const c of [t.tileA, t.tileB]) {
    const [r, , b] = rgb(c);
    assert.ok(lum(c) > 0.6, c + ' is light');
    assert.ok(b > r, c + ' is a cool colour');
  }
  assert.ok(buildings(1, SEEDS) <= buildings(3, SEEDS) / 2, 'minimal structures');
});

test('R21 floor 2 Early Game is slightly darker than floor 1 with more structures', () => {
  const g = loadGame();
  const avg = i => g.run(`[FLOOR_THEMES[${i}].tileA,FLOOR_THEMES[${i}].tileB]`).reduce((s, c) => s + lum(c), 0) / 2;
  assert.ok(avg(1) < avg(0), 'darker');
  assert.ok(avg(0) - avg(1) < 0.25, 'only slightly darker');
  assert.ok(buildings(2, SEEDS) > buildings(1, SEEDS), 'more structures');
});

test('R22 floor 3 Midgame keeps the Round 1 map colours and structure counts', () => {
  const g = loadGame({ seed: 22 });
  const t = g.run('FLOOR_THEMES[2]');
  assert.equal(t.tileA, '#dcc9a3');
  assert.equal(t.tileB, '#a98563');
  assert.equal(t.castles, 4);
  assert.equal(t.towns, 7);
  assert.equal(t.houses.join ? t.houses.join() : String(t.houses), '5,8');
  for (const seed of SEEDS) {
    const m = loadGame({ seed });
    assert.equal(m.run("genMap(3).filter(s=>s.k==='keep').length"), 4, 'four castles');
    const houses = m.run("genMap(3).filter(s=>s.k==='house').length");
    assert.ok(houses >= 7 * 5 * 0.8 && houses <= 7 * 8, 'seven towns of 5-8 houses (' + houses + ')');
  }
});

test('R23 floor 4 Middle Gambit is darker (not too dark) with slightly more structures', () => {
  const g = loadGame();
  const avg = i => g.run(`[FLOOR_THEMES[${i}].tileA,FLOOR_THEMES[${i}].tileB]`).reduce((s, c) => s + lum(c), 0) / 2;
  assert.ok(avg(3) < avg(2), 'darker than floor 3');
  assert.ok(avg(3) > 0.25, 'not too dark');
  const b3 = buildings(3, SEEDS), b4 = buildings(4, SEEDS);
  assert.ok(b4 > b3 && b4 < b3 * 1.6, 'slightly more structures');
});

test('R24 floor 5 Climax is dark red/orange, denser, and has hostile watchtowers', () => {
  const g = startRun(loadGame({ seed: 24 }), 'sword');
  const t = g.run('FLOOR_THEMES[4]');
  const avg = i => g.run(`[FLOOR_THEMES[${i}].tileA,FLOOR_THEMES[${i}].tileB]`).reduce((s, c) => s + lum(c), 0) / 2;
  assert.ok(avg(4) < avg(3), 'darker than floor 4');
  for (const c of [t.tileA, t.tileB]) { const [r, gg, b] = rgb(c); assert.ok(r > gg && r > b, c + ' is red/orange'); }
  assert.ok(buildings(5, SEEDS) > buildings(4, SEEDS), 'more structures than floor 4');
  onFloor(g, 5);
  const towers = g.run("G.enemies.filter(e=>e.type==='watchtower').length");
  assert.ok(towers >= 3, 'hostile watchtowers placed (' + towers + ')');
  assert.equal(g.run("G.enemies.filter(e=>e.type==='watchtower').length"), g.run('FLOOR_THEMES[4].hostile'));
  for (let f = 1; f <= 4; f++) assert.equal(g.run(`FLOOR_THEMES[${f - 1}].hostile`), 0, 'no hostile structures on floor ' + f);
  // a watchtower fires at a nearby player, never moves, and can be destroyed
  clearBoard(g);
  g.run("P.iframes=1e9;var wt=spawnEnemy('watchtower',P.x+350,P.y);wt.cd=0;var wx=wt.x,wy=wt.y;");
  g.step(0.5);
  assert.ok(g.run('G.eproj.length') >= 1, 'it shoots');
  g.run('wt.kx=500;');
  g.step(0.5);
  assert.equal(g.run('wt.x===wx&&wt.y===wy'), true, 'it stays put');
  g.run('hitEnemy(wt,1e9);');
  assert.equal(g.run('wt.dead'), true, 'it can be destroyed');
});

test('R25 floor 6 Endgame is purple/black/white/gold and slightly maze-like but fully walkable', () => {
  const g = startRun(loadGame({ seed: 25 }), 'sword');
  const t = g.run('FLOOR_THEMES[5]');
  const [r, gg, b] = rgb(t.tileA);
  assert.ok(b > gg && r > gg, t.tileA + ' is purple');
  assert.ok(lum(t.tileB) < 0.15, t.tileB + ' is near black');
  assert.ok(lum(t.accent) > 0.9, 'white accent');
  const [ar, ag, ab] = rgb(t.gold);
  assert.ok(ar > 180 && ag > 130 && ab < 120, 'gold accent');
  assert.equal(t.maze, true);
  onFloor(g, 6);
  const mazeWalls = g.run("G.structs.filter(s=>s.k==='maze').length");
  assert.ok(mazeWalls >= 20, 'maze walls (' + mazeWalls + ')');
  for (let f = 1; f <= 5; f++) assert.equal(g.run(`FLOOR_THEMES[${f - 1}].maze`), false);
  assert.ok(walkable(g) > 0.995, 'no sealed-off areas');
});

test('R19 R25 every floor map stays walkable from the start position', () => {
  for (const seed of [31, 32, 33]) {
    const g = startRun(loadGame({ seed }), 'sword');
    for (let f = 1; f <= 6; f++) {
      onFloor(g, f);
      assert.ok(walkable(g) > 0.98, `floor ${f} seed ${seed} walkable`);
      assert.equal(g.run('insideStruct(P.x,P.y,P.r)'), false, 'player does not start inside a wall');
    }
  }
});

test('R26 the floor name is shown when entering a floor', () => {
  // Amended in Round 4 (R59, R62): checked in the chess theme; R59 checks the fantasy floor names.
  const g = startRun(loadGame({ seed: 26, storage: { slaughtermate_look: 'chess' } }), 'sword');
  for (let f = 1; f <= 6; f++) {
    onFloor(g, f);
    const name = g.run(`FLOOR_THEMES[${f - 1}].name`);
    assert.ok(g.run('G.banner.text').includes(name), 'banner shows ' + name);
    const texts = [];
    const orig = g.context.txt;
    g.context.txt = (s, ...rest) => { texts.push(String(s)); return orig(s, ...rest); };
    g.run('render()');
    g.context.txt = orig;
    assert.ok(texts.some(s => s.toUpperCase().includes(name.toUpperCase()) && /FLOOR/i.test(s)), 'HUD shows ' + name);
  }
});

/* ---------- R27 difficulty ---------- */

test('R27 difficulty options with the agreed multipliers', () => {
  const g = loadGame();
  const D = g.run('JSON.stringify(DIFFICULTY)');
  assert.deepEqual(JSON.parse(D), {
    easy: { name: 'Easy', hp: 0.7, dmg: 0.65, proj: 0.9, score: 0.75 },
    normal: { name: 'Normal', hp: 1, dmg: 1, proj: 1, score: 1 },
    hard: { name: 'Hard', hp: 1.4, dmg: 1.35, proj: 1.2, score: 1.5 },
  });
});

test('R27 difficulty scales enemies, bosses, hostile structures and enemy shots', () => {
  const stats = diff => {
    const g = startRun(loadGame({ seed: 27 }), 'sword', diff);
    clearBoard(g);
    return JSON.parse(g.run(`(()=>{G.floorTime=0;const e=spawnEnemy('rook',100,100),w=spawnEnemy('watchtower',300,300);spawnBoss();
      shootE(0,0,0,300,10,7,'#fff');const p=G.eproj[G.eproj.length-1];
      return JSON.stringify({hp:e.maxHp,dmg:e.dmg,bhp:G.boss.maxHp,bdmg:G.boss.dmg,whp:w.maxHp,sp:p.vx,pd:p.dmg});})()`));
  };
  const n = stats('normal'), e = stats('easy'), h = stats('hard');
  const close = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
  for (const [s, m] of [[e, { hp: 0.7, dmg: 0.65, proj: 0.9 }], [h, { hp: 1.4, dmg: 1.35, proj: 1.2 }]]) {
    assert.ok(close(s.hp, n.hp * m.hp), 'enemy hp');
    assert.ok(close(s.dmg, n.dmg * m.dmg), 'enemy damage');
    assert.ok(close(s.bhp, n.bhp * m.hp), 'boss hp');
    assert.ok(close(s.bdmg, n.bdmg * m.dmg), 'boss damage');
    assert.ok(close(s.whp, n.whp * m.hp), 'watchtower hp');
    assert.ok(close(s.sp, n.sp * m.proj), 'projectile speed');
    assert.ok(close(s.pd, n.pd), 'shot damage is passed in already scaled');
  }
});

test('R27 difficulty is chosen on the menu and shown on the scoreboard', () => {
  assert.match(HTML, /id="difficulty"/, 'menu has a difficulty selector');
  const g = loadGame({ seed: 271 });
  g.run('showMenu()');
  const opts = g.elements('difficulty').children;
  assert.equal(opts.length, 3);
  opts[2].onclick();
  assert.equal(g.run('selDifficulty'), 'hard');
  g.elements('startBtn').onclick();
  assert.equal(g.run('G.difficulty'), 'hard');
  g.run('G.score=1000;endRun(false);');
  const base = 1000 + g.run('P.level') * 50;
  assert.equal(g.run('G.final'), Math.round(base * 1.5), 'hard score multiplier');
  g.elements('saveBtn').onclick();
  const saved = JSON.parse(g.storage.get('slaughtermate_scores'));
  assert.equal(saved[0].difficulty, 'Hard');
  assert.match(g.elements('scores').innerHTML, /Hard/);
  assert.match(HTML, /<th>Difficulty<\/th>/);
});

/* ---------- R28 - R32 weapons and dash ---------- */

function weaponGame(w, seed) {
  const g = startRun(loadGame({ seed }), w);
  clearBoard(g);
  g.run('P.hp=P.maxHp=1000;P.iframes=1e9;P.crit=0;');
  return g;
}
// Place dummies at offsets (forward distance, sideways distance) relative to aiming right (+x).
function dummies(g, offsets) {
  g.run('G.enemies=[];');
  for (const [f, s] of offsets) g.run(`(()=>{const e=spawnEnemy('pawn',P.x+${f},P.y+${s});e.hp=e.maxHp=1e6;e.dmg=0;e.speed=0;e.stunT=1e9;})()`);
  g.aimAt(g.run('P.x+300'), g.run('P.y'));
  g.step(1 / 60);
}
const dmgTaken = g => g.run('G.enemies.map(e=>e.maxHp-e.hp)');

test('R28 Scythe: semicircle sweep, charged slash steals HP', () => {
  const g = weaponGame('scythe', 28);
  assert.ok(g.run('!!WEAPONS.scythe'));
  dummies(g, [[60, 0], [5, 70], [5, -70], [-70, 0]]);
  g.run('P.atkCd=0;basicAttack();');
  const d = dmgTaken(g);
  assert.ok(d[0] > 0 && d[1] > 0 && d[2] > 0, 'hits the whole front half, including both sides');
  assert.equal(d[3], 0, 'does not hit behind');
  g.run('G.enemies.forEach(e=>e.hp=e.maxHp);P.hp=300;P.atkCd=0;P.holdT=3;P.charge=1;releaseAttack();');
  assert.ok(g.run('P.hp') > 300, 'charged slash heals the player');
  assert.ok(dmgTaken(g)[0] > d[0], 'charged slash is stronger');
});

test('R29 Shield: bash with knockback, charged rush is wider and stronger', () => {
  const g = weaponGame('shield', 29);
  dummies(g, [[45, 0]]);
  const x0 = g.run('P.x');
  g.run('P.atkCd=0;basicAttack();');
  assert.ok(dmgTaken(g)[0] > 0, 'bash hits');
  assert.ok(g.run('Math.hypot(G.enemies[0].kx,G.enemies[0].ky)') > 300, 'bash knocks back hard');
  g.step(0.2);
  assert.ok(g.run('P.x') > x0, 'bash steps forward');
  const bash = dmgTaken(g)[0];
  dummies(g, [[120, 55], [220, -55], [300, 0]]);
  const x1 = g.run('P.x');
  g.run('P.atkCd=0;P.holdT=3;P.charge=1;releaseAttack();');
  g.step(0.6);
  assert.ok(g.run('P.x') - x1 > 150, 'rush carries the player forward');
  const d = dmgTaken(g);
  assert.ok(d.every(v => v > bash), 'rush hits a wide path harder than a bash');
});

test('R30 Club: rectangular slam, charged wind-up swing with 3 chain explosions', () => {
  const g = weaponGame('club', 30);
  dummies(g, [[120, 0], [80, 80], [-40, 0]]);
  g.run('P.atkCd=0;basicAttack();');
  const d = dmgTaken(g);
  assert.ok(d[0] > 0, 'hits straight ahead');
  assert.equal(d[1], 0, 'rectangle, not a circle: misses the diagonal');
  assert.equal(d[2], 0, 'misses behind');
  dummies(g, [[110, 0], [230, 0], [350, 0]]);
  g.run('P.atkCd=0;P.holdT=3;P.charge=1;releaseAttack();');
  g.step(0.1);
  assert.ok(dmgTaken(g).every(v => v === 0), 'nothing lands during the wind-up');
  assert.ok(g.run('P.windup>0'), 'wind-up in progress');
  g.step(1.2);
  const after = dmgTaken(g);
  assert.ok(after.every(v => v > 0), 'all three chain explosions land');
  assert.equal(g.run('G.clubBlasts'), 3, 'exactly 3 explosions');
});

test('R31 Tome: 3 piercing spirits with damage over time, charged 9-spirit burst with pushback', () => {
  const g = weaponGame('tome', 31);
  dummies(g, [[150, 0], [260, 0]]);
  g.run('P.atkCd=0;basicAttack();');
  assert.equal(g.run("G.pproj.filter(p=>p.kind==='spirit').length"), 3, 'three spirits');
  g.step(0.6);
  const d1 = dmgTaken(g);
  assert.ok(d1[0] > 0 && d1[1] > 0, 'spirits pierce through the first enemy');
  assert.ok(g.run('G.enemies[0].dots.length') > 0, 'damage over time applied');
  g.run('G.pproj=[];');
  g.step(1);
  assert.ok(dmgTaken(g)[0] > d1[0], 'damage keeps ticking after the hit');
  g.step(3);
  const settled = dmgTaken(g)[0];
  g.step(1);
  assert.equal(dmgTaken(g)[0], settled, 'the damage over time is short-term');
  dummies(g, [[40, 0]]);
  g.run('P.atkCd=0;P.holdT=3;P.charge=1;releaseAttack();');
  assert.equal(g.run("G.pproj.filter(p=>p.kind==='spirit').length"), 9, 'nine spirits');
  assert.ok(g.run('G.enemies[0].kx') > 200, 'pushback');
});

test('R32 Space dashes toward the cursor with a 1 second cooldown', () => {
  const g = weaponGame('sword', 32);
  assert.equal(g.run('DASH_CD'), 1);
  g.aimAt(g.run('P.x'), g.run('P.y-500'));
  const y0 = g.run('P.y'), x0 = g.run('P.x');
  g.fire('keydown', { key: ' ', code: 'Space' }); g.fire('keyup', { key: ' ', code: 'Space' });
  g.step(0.3);
  const moved = y0 - g.run('P.y');
  assert.ok(moved > 120 && moved < 300, 'short dash toward the cursor (' + moved + ')');
  assert.ok(Math.abs(g.run('P.x') - x0) < 5, 'straight toward the cursor');
  const y1 = g.run('P.y');
  g.aimAt(g.run('P.x'), g.run('P.y-500'));
  g.fire('keydown', { key: ' ', code: 'Space' }); g.fire('keyup', { key: ' ', code: 'Space' });
  g.step(0.3);
  assert.ok(Math.abs(g.run('P.y') - y1) < 1, 'no second dash during cooldown');
  g.step(0.5);
  g.aimAt(g.run('P.x'), g.run('P.y-500'));
  const y2 = g.run('P.y');
  g.fire('keydown', { key: ' ', code: 'Space' }); g.fire('keyup', { key: ' ', code: 'Space' });
  g.step(0.3);
  assert.ok(y2 - g.run('P.y') > 120, 'dash again after 1 second');
  assert.match(HTML, /Space/, 'controls text mentions Space');
});

/* ---------- R33 - R35 spells ---------- */

test('R33 every tier has exactly one spell of every element, Round 1 spells kept', () => {
  const g = loadGame();
  const spells = JSON.parse(g.run('JSON.stringify(SPELLS)'));
  assert.equal(new Set(spells.map(s => s.id)).size, spells.length, 'unique ids');
  for (let t = 1; t <= 5; t++) {
    const els = spells.filter(s => s.tier === t).map(s => s.el);
    assert.equal(els.length, ELEMENTS.length, `tier ${t} has ${ELEMENTS.length} spells`);
    assert.deepEqual([...new Set(els)].sort(), ELEMENTS.slice().sort(), `tier ${t} covers every element once`);
  }
  for (const k of ROUND1_SPELLS) {
    const [id, tier, el] = k.split(':');
    const s = spells.find(x => x.id === id);
    assert.ok(s && s.tier === +tier && s.el === el, id + ' kept unchanged');
  }
  for (const el of ELEMENTS) assert.ok(g.run(`!!EL_COL.${el}`), el + ' has a colour');
});

test('R33 every spell can be cast and hits a target', () => {
  const g = startRun(loadGame({ seed: 331 }), 'sword');
  clearBoard(g);
  g.run('P.hp=P.maxHp=1e9;P.iframes=1e9;');
  dummy(g, 0, 0);
  g.run('var D=G.enemies[0];');
  for (const s of JSON.parse(g.run('JSON.stringify(SPELLS.filter(s=>s.dmg).map(s=>({id:s.id,kind:s.kind,r:s.r})))'))) {
    // orbiting spells circle the player at radius r; everything else is aimed at a target 90px away
    const dist = s.kind === 'orbit' ? s.r : 90;
    g.run(`G.zones=[];G.pstrikes=[];G.beams=[];G.orbs=[];G.pproj=[];G.casts=[];D.hp=D.maxHp;D.dots=[];D.x=P.x+${dist};D.y=P.y;D.kx=D.ky=0;`);
    // rain spells scatter strikes at random, so allow a few casts
    for (let attempt = 0; attempt < 4 && g.run('D.hp>=D.maxHp'); attempt++) {
      cast(g, s.id, g.run('D.x'), g.run('D.y'));
      g.step(2.5);
    }
    assert.ok(g.run('D.hp<D.maxHp'), s.id + ' deals damage');
  }
});

test('R34 Mind spells: one per tier, psychic damage over time', () => {
  const g = startRun(loadGame({ seed: 34 }), 'sword');
  clearBoard(g);
  g.run('P.iframes=1e9;P.crit=0;');
  const minds = JSON.parse(g.run("JSON.stringify(SPELLS.filter(s=>s.el==='mind'))"));
  assert.deepEqual(minds.map(s => s.tier).sort(), [1, 2, 3, 4, 5]);
  dummy(g, 0, 0);
  g.run('var D=G.enemies[0];D.x=P.x+200;D.y=P.y;');
  for (const s of minds) {
    assert.ok(s.dot && s.dot[0] > 0 && s.dot[1] > 0, s.id + ' has damage over time');
    g.run('G.zones=[];G.pproj=[];G.casts=[];D.hp=D.maxHp;D.dots=[];');
    cast(g, s.id, g.run('D.x'), g.run('D.y'));
    g.step((s.windup || 0) + 0.7);
    g.run('G.zones=[];G.pproj=[];G.fx=[];');
    const mid = g.run('D.hp');
    assert.ok(mid < g.run('D.maxHp'), s.id + ' hits');
    g.step(0.8);
    assert.ok(g.run('D.hp') < mid, s.id + ' keeps damaging over time');
  }
  // Tier 1 (inspired by Psychic) also weakens its target
  const t1 = minds.find(s => s.tier === 1);
  assert.ok(t1.weak > 0, 'tier 1 mind spell weakens');
  g.run('D.hp=D.maxHp;D.dots=[];D.weakT=0;G.casts=[];');
  cast(g, t1.id, g.run('D.x'), g.run('D.y'));
  g.step(0.5);
  assert.ok(g.run('D.weakT>0'), 'target is weakened');
  const hp = g.run('D.hp');
  g.run('hitEnemy(D,100);');
  assert.ok(hp - g.run('D.hp') > 100, 'weakened target takes extra damage');
  // Tier 5 (inspired by Psystrike) is massive; both use original names
  const t5 = minds.find(s => s.tier === 5);
  assert.ok(t5.r >= 400 && t5.dmg >= 500, 'tier 5 mind spell is massive');
  for (const s of minds) assert.doesNotMatch(s.name, /psychic|psystrike/i, 'original name: ' + s.name);
});

test('R35 heavy tier 3-5 spells have slight wind-ups; tier 1-2 stay instant', () => {
  const g = loadGame();
  const spells = JSON.parse(g.run('JSON.stringify(SPELLS)'));
  const wound = spells.filter(s => s.windup);
  assert.ok(wound.length >= 8, 'some spells have wind-ups');
  for (const s of wound) {
    assert.ok(s.tier >= 3, s.id + ' wind-up only on tier 3+');
    assert.ok(s.windup >= 0.2 && s.windup <= 0.6, s.id + ' wind-up is slight');
  }
  for (const t of [3, 4, 5]) assert.ok(wound.some(s => s.tier === t), 'tier ' + t + ' has a wound-up spell');
});

test('R35 a wound-up spell fires at the cursor after the wind-up and the player can move meanwhile', () => {
  const g = startRun(loadGame({ seed: 351 }), 'sword');
  clearBoard(g);
  g.run('P.iframes=1e9;');
  const id = g.run("SPELLS.find(s=>s.windup&&s.kind==='zone').id");
  const wu = g.run(`SPELL_BY_ID['${id}'].windup`);
  dummy(g, 0, 0);
  g.run('var D=G.enemies[0];D.x=P.x+300;D.y=P.y;');
  cast(g, id, g.run('P.x+150'), g.run('P.y'));
  assert.ok(g.run('P.spells[0].cd>0'), 'cooldown starts on cast');
  assert.equal(g.run('G.zones.length'), 0, 'nothing happens immediately');
  assert.equal(g.run('G.casts.length'), 1, 'wind-up in progress');
  const x0 = g.run('P.x');
  g.fire('keydown', { key: 'd' });
  g.step(wu / 2);
  g.fire('keyup', { key: 'd' });
  // re-aim at the dummy while still winding up (camera is still once the player stops)
  g.aimAt(g.run('D.x'), g.run('D.y'));
  g.step(wu / 2 + 0.05);
  assert.ok(g.run('P.x') > x0, 'player moved during the wind-up');
  assert.equal(g.run('G.zones.length'), 1, 'spell fired after the wind-up');
  assert.ok(g.run('Math.hypot(G.zones[0].x-D.x,G.zones[0].y-D.y)') < 5, 'aimed at the cursor at release time');
});

test('R17 R19 R24 R25 rendering works on every floor with every weapon', () => {
  for (const w of ['sword', 'bow', 'staff', 'hammer', 'scythe', 'shield', 'club', 'tome']) {
    const g = startRun(loadGame({ seed: 40 }), w);
    for (let f = 1; f <= 6; f++) {
      onFloor(g, f);
      g.run('P.iframes=1e9;P.hp=P.maxHp=1e9;');
      g.step(0.5);
      g.run('cam.x=P.x-VW/2;cam.y=P.y-VH/2;render();');
    }
    g.run('showMenu();render();');
  }
});
