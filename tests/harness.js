'use strict';
// Loads the game script from index.html into a Node vm context with a stubbed
// browser (DOM elements, 2D canvas, storage, input events). Each call to
// loadGame() returns a fresh, isolated game. See docs/decisions/0001.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
const HTML = fs.readFileSync(HTML_PATH, 'utf8');
const SCRIPT = (() => {
  const m = HTML.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No inline <script> found in index.html');
  return m[1];
})();

// A canvas context where every method is a no-op that returns the context itself,
// so gradients and patterns (createRadialGradient().addColorStop()) also work.
function makeCtx(calls) {
  const target = {};
  const proxy = new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'measureText') return () => ({ width: 10 });
      return (...args) => { if (calls) calls.push([k, args]); return proxy; };
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  return proxy;
}

function makeElement(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    children: [], style: {}, dataset: {}, value: '', textContent: '', _html: '', onclick: null,
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      contains(c) { return this._s.has(c); },
      toggle(c, on) { if (on === undefined) on = !this._s.has(c); on ? this._s.add(c) : this._s.delete(c); },
    },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); this.children = []; },
    set className(v) { this._cls = v; this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); },
    get className() { return this._cls || ''; },
    appendChild(c) { this.children.push(c); return c; },
    querySelector() { return makeElement('div'); },
    querySelectorAll() { return []; },
    addEventListener() {},
    getContext() { return makeCtx(); },
    width: 0, height: 0,
  };
  return el;
}

// Small deterministic PRNG so tests that depend on randomness are repeatable.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadGame(opts) {
  opts = opts || {};
  const elements = new Map();
  const listeners = {};
  const storage = new Map(Object.entries(opts.storage || {}));
  const getEl = id => { if (!elements.has(id)) elements.set(id, makeElement('div')); return elements.get(id); };
  const canvasEl = makeElement('canvas');
  elements.set('c', canvasEl);
  const ctxCalls = [];
  canvasEl.getContext = () => makeCtx(opts.recordCtx ? ctxCalls : null);
  canvasEl.addEventListener = (type, fn) => { (listeners['canvas:' + type] = listeners['canvas:' + type] || []).push(fn); };

  const sandbox = {
    console,
    document: {
      getElementById: getEl,
      createElement: makeElement,
      body: makeElement('body'),
    },
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener() {},
    localStorage: {
      getItem: k => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => { storage.set(k, String(v)); },
      removeItem: k => { storage.delete(k); },
    },
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    setTimeout: fn => { if (opts.runTimeouts) fn(); return 0; },
    clearTimeout() {},
    Path2D: class Path2D { moveTo() {} lineTo() {} closePath() {} ellipse() {} arc() {} rect() {} },
    DOMMatrix: class DOMMatrix { constructor(a) { this.a = a; } },
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  if (opts.seed !== undefined) {
    context.__rng = mulberry32(opts.seed);
    vm.runInContext('Math.random = () => __rng();', context);
  }
  vm.runInContext(SCRIPT, context, { filename: 'index.html' });

  const api = {
    context,
    elements: getEl,
    storage,
    ctxCalls,
    // Evaluate an expression inside the game's global scope (sees const/let bindings).
    run(code) { return vm.runInContext(code, context); },
    // Dispatch a fake DOM event to window-level listeners.
    fire(type, ev) { for (const fn of listeners[type] || []) fn(Object.assign({ preventDefault() {} }, ev)); },
    // Dispatch a fake DOM event to listeners registered on the game canvas.
    fireCanvas(type, ev) { for (const fn of listeners['canvas:' + type] || []) fn(Object.assign({ preventDefault() {} }, ev)); },
    // Advance the simulation by `seconds` in fixed steps while playing.
    step(seconds, dt) {
      dt = dt || 1 / 60;
      const n = Math.round(seconds / dt);
      context.__dt = dt;
      for (let i = 0; i < n; i++) vm.runInContext("if(G.state==='play')update(__dt);", context);
    },
    // Place the mouse at a world position (camera follows the player).
    aimAt(wx, wy) {
      vm.runInContext('cam.x=P.x-VW/2;cam.y=P.y-VH/2;', context);
      context.__mx = wx; context.__my = wy;
      vm.runInContext('mouse.x=__mx-cam.x;mouse.y=__my-cam.y;', context);
    },
  };
  return api;
}

// Start a run with the given weapon (and optional difficulty) and clear the board.
function startRun(game, weapon, difficulty) {
  game.run(`selWeapon=${JSON.stringify(weapon || 'sword')};`);
  if (difficulty) game.run(`selDifficulty=${JSON.stringify(difficulty)};`);
  game.run(`newRun(${JSON.stringify(weapon || 'sword')}${difficulty ? ',' + JSON.stringify(difficulty) : ''});`);
  return game;
}

// Remove every enemy and stop spawning so a test controls the board exactly.
function clearBoard(game) {
  game.run(`G.enemies=[];G.eproj=[];G.hazards=[];G.pickups=[];G.parts=[];G.spawnAcc=-1e9;G.packT=1e9;G.dur=1e9;
    G.structs=G.structs.filter(s=>Math.hypot(s.x+s.w/2-P.x,s.y+s.h/2-P.y)>900);P.iframes=0;`);
  return game;
}

// Spawn a stationary dummy enemy that never moves or attacks.
function dummy(game, x, y, hp) {
  return game.run(`(()=>{const e=spawnEnemy('pawn',${x},${y});e.hp=e.maxHp=${hp || 1e6};e.dmg=0;e.speed=0;e.stunT=1e9;return e;})()`);
}

module.exports = { loadGame, startRun, clearBoard, dummy, HTML, SCRIPT };
