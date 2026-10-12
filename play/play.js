/* Shared challenge engine for the toddler flash-card games:
   mode picker, "Find it"-style choice rounds with adaptive levels, stickers, parade,
   confetti, one shared audio element (unlocked on the first tap for iOS).
   Plain ES5, no dependencies. */
(function () {
  "use strict";
  var P = window.PLAY = {};
  var ROOT = "";
  try {
    var cs = document.currentScript;
    if (cs) ROOT = (cs.getAttribute("src") || "").replace(/play\/play\.js.*$/, "");
  } catch (e) {}
  P.root = ROOT;
  var GAME = "game";

  // ---------- helpers ----------
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function loadJSON(k, d) { try { var v = JSON.parse(load(k)); return v == null ? d : v; } catch (e) { return d; } }
  function saveJSON(k, v) { store(k, JSON.stringify(v)); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function mk(tag, cls, parent, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  P.store = store; P.load = load; P.loadJSON = loadJSON; P.saveJSON = saveJSON;
  P.shuffle = shuffle; P.rnd = rnd; P.mk = mk;

  // ---------- icons (UI only) ----------
  var ICON = P.ICON = {
    learn: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="22" rx="4" fill="#fff" stroke="#3a2e5c" stroke-width="2.4"/><circle cx="11" cy="12" r="3" fill="#ffbe0b"/><path d="M5 25l8-8 5 5 4-4 6 6" fill="#06d6a0" stroke="#3a2e5c" stroke-width="2" stroke-linejoin="round"/></svg>',
    find: '<svg viewBox="0 0 32 32"><circle cx="13" cy="13" r="9" fill="#bde0fe" stroke="#3a2e5c" stroke-width="3"/><path d="M20 20l8 8" stroke="#3a2e5c" stroke-width="4.5" stroke-linecap="round"/><circle cx="10" cy="10" r="2.5" fill="#fff"/></svg>',
    sound: '<svg viewBox="0 0 32 32"><path d="M4 12h6l7-6v20l-7-6H4z" fill="#ff7aa2" stroke="#3a2e5c" stroke-width="2.2" stroke-linejoin="round"/><path d="M21 11c2 3 2 7 0 10M25 8c4 5 4 11 0 16" fill="none" stroke="#3a2e5c" stroke-width="2.4" stroke-linecap="round"/></svg>',
    hunt: '<svg viewBox="0 0 32 32"><path d="M4 15L16 4l12 11" fill="none" stroke="#3a2e5c" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 13v15h18V13" fill="#ffd6a5" stroke="#3a2e5c" stroke-width="2.4" stroke-linejoin="round"/><circle cx="16" cy="20" r="4.5" fill="#3a86ff"/></svg>',
    starts: '<svg viewBox="0 0 32 32"><rect x="15" y="9" width="15" height="15" rx="3" fill="#cdeac0" stroke="#3a2e5c" stroke-width="2"/><circle cx="22.5" cy="16.5" r="3.5" fill="#fb5607"/><text x="1" y="24" font-family="Arial Rounded MT Bold,Arial,sans-serif" font-weight="900" font-size="19" fill="#3a2e5c">B</text></svg>',
    after: '<svg viewBox="0 0 32 32"><rect x="2" y="8" width="11" height="15" rx="2.5" fill="#fff" stroke="#3a2e5c" stroke-width="2"/><rect x="2" y="8" width="11" height="4" fill="#f57c00"/><path d="M15 16h6m-3-3l3 3-3 3" fill="none" stroke="#3a2e5c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="22" y="8" width="8" height="15" rx="2.5" fill="#fff" stroke="#3a2e5c" stroke-width="2" stroke-dasharray="3 2"/></svg>',
    star: '<svg viewBox="0 0 32 32"><path d="M16 2.5l4 8.6 9.4 1.1-7 6.4 1.9 9.3L16 23.2l-8.3 4.7 1.9-9.3-7-6.4 9.4-1.1z" fill="#ffd23f" stroke="#c98a00" stroke-width="2" stroke-linejoin="round"/></svg>',
    speaker: '<svg viewBox="0 0 32 32"><path d="M4 12h6l7-6v20l-7-6H4z" fill="#3a2e5c" stroke="#3a2e5c" stroke-width="2" stroke-linejoin="round"/><path d="M21 11c2 3 2 7 0 10M25 8c4 5 4 11 0 16" fill="none" stroke="#3a2e5c" stroke-width="2.6" stroke-linecap="round"/></svg>',
    ear: '<svg viewBox="0 0 32 32"><path d="M9 13a7.5 7.5 0 0 1 15 0c0 5-5 6-5 11a4 4 0 0 1-8 0" fill="#ffd6a5" stroke="#3a2e5c" stroke-width="2.4" stroke-linecap="round"/><path d="M13 13a3.5 3.5 0 0 1 7 0c0 2-2 2.5-2 4" fill="none" stroke="#3a2e5c" stroke-width="2.2" stroke-linecap="round"/></svg>',
    play: '<svg viewBox="0 0 32 32"><path d="M8 4l20 12L8 28z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>',
    match: '<svg viewBox="0 0 32 32"><rect x="3" y="6" width="13" height="18" rx="3" fill="#ff7aa2" stroke="#3a2e5c" stroke-width="2" transform="rotate(-8 9 15)"/><rect x="15" y="7" width="13" height="18" rx="3" fill="#3a86ff" stroke="#3a2e5c" stroke-width="2" transform="rotate(8 21 16)"/></svg>'
  };

  // ---------- Audio: one shared element, unlocked by the first tap (iOS) ----------
  var soundKey = "play-sound";
  var player = null, seqTok = 0, unlocked = false, warm = {};
  var synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;
  function soundOn() { return load(soundKey) !== "off"; }
  P.soundOn = soundOn;
  function getPlayer() {
    if (!player) { try { player = new Audio(); player.preload = "auto"; } catch (e) { player = null; } }
    return player;
  }
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    var a = getPlayer();
    if (!a) return;
    try {
      if (!a.src || a.paused) {
        a.src = ROOT + "play/audio/silence.mp3";
        var p = a.play();
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {}
  }
  document.addEventListener("touchend", unlock, true);
  document.addEventListener("click", unlock, true);
  P.warm = function (urls) {
    (urls || []).forEach(function (u) {
      if (!u || warm[u]) return;
      try { var a = new Audio(); a.preload = "auto"; a.src = u; warm[u] = a; } catch (e) {}
    });
  };
  P.stop = function () {
    seqTok++;
    if (player) { try { player.pause(); } catch (e) {} }
    setPlaying(false);
  };
  var playingBtn = null;
  function setPlaying(on) { if (playingBtn) playingBtn.classList.toggle("pm-playing", !!on); }
  // Play clips one after another; done() always fires (also when muted / blocked / broken).
  P.playSeq = function (urls, done, silentMs) {
    var tok = ++seqTok, a = getPlayer(), i = 0, finished = false;
    urls = (urls || []).filter(Boolean);
    function finish() {
      if (finished || tok !== seqTok) return;
      finished = true; setPlaying(false);
      if (done) done();
    }
    if (player) { try { player.pause(); } catch (e) {} }
    if (!soundOn() || !a || !urls.length) { setTimeout(finish, silentMs == null ? 900 : silentMs); return tok; }
    setPlaying(true);
    function step() {
      if (tok !== seqTok) return;
      if (i >= urls.length) { finish(); return; }
      var u = urls[i++], moved = false, guard;
      function nxt() { if (moved || tok !== seqTok) return; moved = true; clearTimeout(guard); setTimeout(step, 120); }
      a.onended = nxt; a.onerror = nxt;
      guard = setTimeout(nxt, 9000);
      try {
        a.src = u;
        var p = a.play();
        if (p && p.catch) p.catch(function (err) {
          if (err && err.name === "AbortError") return;
          nxt();
        });
      } catch (e) { nxt(); }
    }
    step();
    return tok;
  };
  P.isCurrent = function (tok) { return tok === seqTok; };

  // ---------- confetti / wiggle ----------
  var CONF = ["#ff5d8f", "#ffbe0b", "#3a86ff", "#06d6a0", "#8338ec", "#fb5607"];
  var confLive = 0;
  P.confetti = function (x, y, colors) {
    if (confLive > 30) return;
    var pal = colors && colors.length ? colors : CONF, n = 22;
    if (x == null) { x = innerWidth / 2; y = innerHeight * 0.45; }
    for (var i = 0; i < n; i++) {
      var d = mk("div", "pm-conf" + (i % 3 === 0 ? " sq" : ""), document.body);
      var ang = (Math.PI * 2 * i) / n + Math.random() * 0.4, dist = 22 + Math.random() * 22;
      d.style.left = x + "px"; d.style.top = y + "px";
      d.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "vmin");
      d.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(1) + "vmin");
      d.style.setProperty("--rot", Math.round(Math.random() * 540 - 270) + "deg");
      d.style.background = pal[i % pal.length];
      confLive++;
      (function (node) { setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); confLive--; }, 1150); })(d);
    }
  };
  function center(elm) { var r = elm.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  P.center = center;
  P.wiggle = function (elm) {
    elm.classList.remove("pm-wiggle"); void elm.offsetWidth; elm.classList.add("pm-wiggle");
    setTimeout(function () { elm.classList.remove("pm-wiggle"); }, 650);
  };

  // ---------- Stickers (shared by all games, localStorage "play-stickers") ----------
  var SKEY = "play-stickers";
  var SHAPES = ["star", "heart", "flower", "sun", "moon", "rainbow", "balloon"];
  var SCOLS = ["ff5d8f", "ffbe0b", "3a86ff", "06d6a0", "8338ec", "fb5607", "ff7aa2", "2ec4b6", "e53935"];
  var ANIMAL_IDS = ["dog","cat","cow","pig","horse","sheep","chicken","duck","bunny","mouse","lion","tiger","elephant","monkey","giraffe","zebra","bear","panda","frog","fish","whale","dolphin","octopus","turtle","snake","bird","owl","penguin","butterfly","bee","fox","koala","snail","ladybug"];
  P.ANIMAL_IDS = ANIMAL_IDS;
  var FACE = '<circle cx="41" cy="50" r="4.2" fill="#3a2e5c"/><circle cx="59" cy="50" r="4.2" fill="#3a2e5c"/><path d="M42 60q8 7 16 0" fill="none" stroke="#3a2e5c" stroke-width="3.4" stroke-linecap="round"/><circle cx="34" cy="58" r="3.5" fill="#ff8fab" opacity=".7"/><circle cx="66" cy="58" r="3.5" fill="#ff8fab" opacity=".7"/>';
  function shapeSVG(shape, c) {
    var W = 'stroke="#fff" stroke-width="9" stroke-linejoin="round" paint-order="stroke"';
    var hi = '<ellipse cx="33" cy="30" rx="9" ry="5" fill="#fff" opacity=".45" transform="rotate(-30 33 30)"/>';
    var body;
    switch (shape) {
      case "heart": body = '<path d="M50 90C21 70 6 53 6 33 6 19 17 8 31 8c8 0 15 4 19 11 4-7 11-11 19-11 14 0 25 11 25 25 0 20-15 37-44 57z" fill="' + c + '" ' + W + '/>' + hi + FACE; break;
      case "flower": body = '<g fill="' + c + '" ' + W + '><circle cx="50" cy="24" r="17"/><circle cx="75" cy="42" r="17"/><circle cx="66" cy="72" r="17"/><circle cx="34" cy="72" r="17"/><circle cx="25" cy="42" r="17"/></g><circle cx="50" cy="51" r="17" fill="#ffd23f" stroke="#fff" stroke-width="4"/>'; break;
      case "sun": body = '<g stroke="#fff" stroke-width="16" stroke-linecap="round"><path d="M50 6v14M50 80v14M6 50h14M80 50h14M19 19l10 10M71 71l10 10M81 19L71 29M29 71L19 81"/></g><g stroke="' + c + '" stroke-width="8" stroke-linecap="round"><path d="M50 6v14M50 80v14M6 50h14M80 50h14M19 19l10 10M71 71l10 10M81 19L71 29M29 71L19 81"/></g><circle cx="50" cy="50" r="27" fill="' + c + '" ' + W + '/>' + FACE.replace(/cy="50"/g, 'cy="48"'); break;
      case "moon": body = '<path d="M62 8A42 42 0 1 0 92 66 34 34 0 1 1 62 8z" fill="' + c + '" ' + W + '/><circle cx="36" cy="46" r="4" fill="#3a2e5c"/><path d="M30 58q7 6 14 0" fill="none" stroke="#3a2e5c" stroke-width="3.4" stroke-linecap="round"/>'; break;
      case "rainbow": body = '<g fill="none" stroke-linecap="round"><path d="M10 78a40 40 0 0 1 80 0" stroke="#fff" stroke-width="34"/><path d="M14 78a36 36 0 0 1 72 0" stroke="#e53935" stroke-width="8"/><path d="M22 78a28 28 0 0 1 56 0" stroke="#ffbe0b" stroke-width="8"/><path d="M30 78a20 20 0 0 1 40 0" stroke="#06d6a0" stroke-width="8"/><path d="M38 78a12 12 0 0 1 24 0" stroke="#3a86ff" stroke-width="8"/></g><g fill="#fff" stroke="#e5e0ef" stroke-width="2"><circle cx="14" cy="82" r="10"/><circle cx="86" cy="82" r="10"/></g>'; break;
      case "balloon": body = '<path d="M50 72q-6 10 2 16t-2 10" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M50 72q-6 10 2 16t-2 10" fill="none" stroke="#3a2e5c" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="50" cy="38" rx="28" ry="33" fill="' + c + '" ' + W + '/><path d="M45 71h10l-5 6z" fill="' + c + '"/>' + hi; break;
      default: body = '<path d="M50 6l12.4 26.6 29 3.4-21.6 19.8 5.8 28.7L50 70.1 24.4 84.5l5.8-28.7L8.6 36l29-3.4z" fill="' + c + '" ' + W + '/>' + hi + FACE.replace(/cy="50"/g, 'cy="48"').replace("M42 60", "M42 57").replace(/cy="58"/g, 'cy="55"');
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + body + "</svg>";
  }
  P.stickerHTML = function (id) {
    var p = String(id || "").split(":");
    if (p[0] === "a" && ANIMAL_IDS.indexOf(p[1]) >= 0) {
      var ring = "#" + SCOLS[ANIMAL_IDS.indexOf(p[1]) % SCOLS.length];
      return '<span class="pm-stk pm-stk-photo" style="--ring:' + ring + '"><img src="' + ROOT + "img/" + p[1] + '.jpg" alt="' + p[1] + '" draggable="false"></span>';
    }
    var shape = SHAPES.indexOf(p[1]) >= 0 ? p[1] : "star";
    var col = /^[0-9a-fA-F]{6}$/.test(p[2] || "") ? "#" + p[2] : "#ffbe0b";
    return '<span class="pm-stk">' + shapeSVG(shape, col) + "</span>";
  };
  P.randomSticker = function (hex) {
    var c = hex ? String(hex).replace("#", "") : rnd(SCOLS);
    if (c.toLowerCase() === "ffffff") c = "ffffff";
    return "s:" + rnd(SHAPES) + ":" + c;
  };
  P.stickers = function () { return loadJSON(SKEY, []) || []; };
  P.sessionEarned = 0;
  var elCount = null, lastBig = 0;
  function renderCount(bump) {
    if (!elCount) return;
    elCount.querySelector("b").textContent = String(P.stickers().length);
    if (bump) { elCount.classList.remove("pm-bump"); void elCount.offsetWidth; elCount.classList.add("pm-bump"); }
  }
  P.renderCount = function (bump) { renderCount(bump); };
  // 5-sticker milestone reached (and not rewarded yet)?
  P.bigDue = function () {
    var n = P.sessionEarned;
    if (n > 0 && n % 5 === 0 && n !== lastBig) { lastBig = n; return true; }
    return false;
  };
  // After a correct answer: post-answer reward (shared/reward.js) or the classic parade, then next().
  P.afterCorrect = function (o, next) {
    var big = P.bigDue();
    if (window.REWARD && window.REWARD.after) window.REWARD.after(big, o || {}, next);
    else if (big) P.parade(next);
    else if (next) next();
  };
  // pref: preferred sticker id (e.g. "a:cow"); fromEl: element the sticker flies out of
  P.earnSticker = function (pref, fromEl) {
    var id = (pref && Math.random() < 0.6) ? pref : P.randomSticker();
    var list = P.stickers();
    list.push({ s: id, g: GAME, t: Date.now() });
    if (list.length > 3000) list = list.slice(-3000);
    saveJSON(SKEY, list);
    P.sessionEarned++;
    var from = fromEl ? center(fromEl) : [innerWidth / 2, innerHeight / 2];
    var to = elCount ? center(elCount) : [innerWidth / 2, 20];
    var f = mk("div", "pm-fly", document.body, P.stickerHTML(id));
    f.style.left = from[0] + "px"; f.style.top = from[1] + "px";
    var done = function () { if (f.parentNode) f.parentNode.removeChild(f); renderCount(true); };
    if (f.animate) {
      var an = f.animate([
        { transform: "scale(.2) rotate(-40deg)", opacity: 0 },
        { transform: "scale(1.25) rotate(8deg)", opacity: 1, offset: 0.3 },
        { transform: "scale(1) rotate(0)", opacity: 1, offset: 0.55 },
        { transform: "translate(" + (to[0] - from[0]) + "px," + (to[1] - from[1]) + "px) scale(.3)", opacity: 0.9 }
      ], { duration: 1300, easing: "ease-in-out", fill: "forwards" });
      an.onfinish = done;
      setTimeout(done, 1600);
    } else setTimeout(done, 600);
    return id;
  };
  // Little parade of the latest stickers; cb() when dismissed.
  P.parade = function (cb) {
    var list = P.stickers().slice(-5);
    var ov = mk("div", "pm-parade", document.body);
    mk("h2", "", ov, "Yay! " + P.sessionEarned + " stickers!");
    var row = mk("div", "row", ov);
    list.forEach(function (s, i) { var d = mk("div", "", row, P.stickerHTML(s.s)); d.style.animationDelay = (i * 0.18) + "s, " + (0.8 + i * 0.12) + "s"; });
    var shown = Date.now(), closed = false;
    function close() {
      if (closed) return; closed = true;
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      if (cb) cb();
    }
    ov.addEventListener("click", function (ev) { ev.stopPropagation(); if (Date.now() - shown > 900) { P.stop(); close(); } });
    setTimeout(function () { P.confetti(); }, 300);
    setTimeout(function () { P.confetti(innerWidth * 0.25, innerHeight * 0.4); }, 900);
    P.playSeq([ROOT + "play/audio/parade.mp3"], function () { setTimeout(close, 1400); }, 2600);
  };

  // ---------- Overlay (start button / info) ----------
  P.overlay = function (build, onClose) {
    var ov = mk("div", "pm-ov", document.body);
    var shown = Date.now(), closed = false;
    var api = { el: ov, close: function () { if (closed) return; closed = true; if (ov.parentNode) ov.parentNode.removeChild(ov); if (onClose) onClose(); },
                dismiss: function () { closed = true; if (ov.parentNode) ov.parentNode.removeChild(ov); } };
    build(ov, api);
    ov.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (Date.now() - shown < 350) return;
      if (api.onTap) api.onTap(ev); else api.close();
    });
    return api;
  };

  // ---------- Grid fit: biggest square cards for n items ----------
  P.fitGrid = function (grid, n, gap) {
    grid.style.maxWidth = "none";
    var W = grid.clientWidth, H = grid.clientHeight;
    if (!W || !H) return;
    gap = gap || Math.round(Math.max(10, Math.min(W, H) * 0.035));
    var best = 0, bc = 1;
    for (var cols = 1; cols <= n; cols++) {
      var rows = Math.ceil(n / cols);
      var s = Math.min((W - (cols - 1) * gap) / cols, (H - (rows - 1) * gap) / rows);
      if (s > best + 0.5) { best = s; bc = cols; }
    }
    best = Math.floor(Math.min(best, 560) - 1);
    grid.style.setProperty("--pm-cs", best + "px");
    grid.style.setProperty("--pm-gap", gap + "px");
    // keep rows balanced: limit the row width to bc cards
    grid.style.maxWidth = (bc * best + (bc - 1) * gap + 2) + "px";
    grid.style.marginLeft = grid.style.marginRight = "auto";
    return best;
  };

  // ---------- Choice mode ("Find it", "Sounds", "Starts with", "What comes after") ----------
  // spec: { id, label, icon, pool: [items], key(item), maxChoices,
  //         prompt(target) -> {html, audio:[urls], visual(el)?},
  //         makeRound(target, n)? -> {choices:[items], answer:item},
  //         card(item, inner, round), correctAudio(target, answer) -> [urls],
  //         wrongAudio(target)? -> [urls], sticker(target, answer)? -> id, ink(target)? }
  P.choiceMode = function (spec) {
    var M = { id: spec.id, label: spec.label, icon: spec.icon };
    var root = null, head = null, visual = null, grid = null, say = null, lvlEl = null;
    var st = null, round = null, busy = false, lastTap = 0, recent = [], timer = null, active = false, roundNo = 0;
    var key = spec.key || function (it) { return it.id; };
    var maxC = function () { return Math.min(spec.maxChoices || 4, spec.pool.length); };
    function skey() { return "play-" + GAME + "-" + spec.id; }
    function save() { saveJSON(skey(), st); }
    function pickTarget() {
      var pool = spec.pool.filter(function (t) { return recent.indexOf(key(t)) < 0; });
      if (!pool.length) pool = spec.pool.slice();
      var tot = 0, ws = pool.map(function (t) { var w = st.w[key(t)] || 1; tot += w; return w; });
      var r = Math.random() * tot;
      for (var i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
      return pool[pool.length - 1];
    }
    function defaultRound(target, n) {
      var others = shuffle(spec.pool.filter(function (t) { return key(t) !== key(target) && (!spec.conflict || !spec.conflict(target, t)); }));
      return { choices: shuffle([target].concat(others.slice(0, n - 1))), answer: target };
    }
    function renderLvl() {
      if (!lvlEl) return;
      lvlEl.innerHTML = "";
      for (var k = 2; k <= maxC(); k++) mk("i", k <= st.lvl ? "on" : "", lvlEl);
      lvlEl.title = st.lvl + " choices";
    }
    function layout() { if (grid && round) P.fitGrid(grid, round.choices.length); }
    function playPrompt() {
      if (!round) return;
      P.playSeq(round.prompt.audio, null, 0);
    }
    function newRound() {
      clearTimeout(timer);
      if (!active) return;
      busy = false;
      var target = pickTarget();
      recent.push(key(target)); while (recent.length > Math.min(2, spec.pool.length - 1)) recent.shift();
      var n = Math.max(2, Math.min(st.lvl, maxC()));
      var r = (spec.makeRound || defaultRound)(target, n);
      roundNo++;
      round = { target: target, answer: r.answer, choices: r.choices, wrong: 0, prompt: spec.prompt(target), no: roundNo };
      if (spec.ink) document.body.style.setProperty("--pm-ink", spec.ink(target));
      if (spec.onRound) spec.onRound(target, r);
      head.querySelector(".pm-q").innerHTML = round.prompt.html;
      visual.innerHTML = "";
      if (round.prompt.visual) round.prompt.visual(visual);
      grid.innerHTML = "";
      round.choices.forEach(function (it, idx) {
        var b = mk("button", "pm-card", grid);
        b.type = "button";
        b.setAttribute("aria-label", it.label || it.name || key(it));
        b.style.animationDelay = (idx * 0.07) + "s";
        var inner = mk("div", "pm-in", b);
        spec.card(it, inner, round);
        b.addEventListener("click", function (ev) { ev.stopPropagation(); tap(idx, b); });
        setTimeout(function () { b.classList.add("pm-ready"); b.style.animationDelay = ""; }, 700 + idx * 70);
      });
      renderLvl();
      layout();
      requestAnimationFrame(layout);
      playPrompt();
      if (spec.warmNext) P.warm(spec.warmNext(target));
    }
    function tap(idx, b) {
      if (busy || !round) return;
      var now = Date.now();
      if (now - lastTap < 500) return;
      lastTap = now;
      var it = round.choices[idx];
      if (it === round.answer) correct(b); else wrong(b);
    }
    function correct(b) {
      busy = true;
      var t = round.target, k = key(t), clean = round.wrong === 0, lv = st.lvl;
      b.classList.remove("pm-hint", "pm-tried");
      b.classList.add("pm-right");
      Array.prototype.forEach.call(grid.children, function (c) { if (c !== b) c.classList.add("pm-fade"); });
      var c = center(b);
      P.confetti(c[0], c[1], spec.confetti ? spec.confetti(t) : null);
      var pref = spec.sticker ? spec.sticker(t, round.answer) : null;
      P.earnSticker(pref, b);
      if (clean) {
        st.streak++; st.miss = 0;
        st.w[k] = Math.max(1, (st.w[k] || 1) - 1);
        if (st.streak >= 3 && st.lvl < maxC()) { st.lvl++; st.streak = 0; }
      } else {
        st.miss++; st.streak = 0;
        if (st.miss >= 2 && st.lvl > 2) { st.lvl--; st.miss = 0; }
      }
      st.rounds = (st.rounds || 0) + 1;
      save(); renderLvl();
      M.last = { clean: clean, levelFrom: lv, levelTo: st.lvl };
      var yay = ROOT + "play/audio/yay" + (1 + Math.floor(Math.random() * 5)) + ".mp3";
      var t0 = Date.now();
      P.playSeq([yay].concat(spec.correctAudio(t, round.answer)), function () {
        var wait = Math.max(500, 2000 - (Date.now() - t0));
        timer = setTimeout(function () {
          if (!active) return;
          P.afterCorrect({ animal: (pref && /^a:/.test(pref)) ? pref.slice(2) : null, mode: spec.id }, function () { if (active) newRound(); });
        }, wait);
      }, 1600);
    }
    function wrong(b) {
      var t = round.target, k = key(t);
      P.wiggle(b);
      b.classList.add("pm-tried");
      round.wrong++;
      if (round.wrong === 1) { st.w[k] = Math.min(7, (st.w[k] || 1) + 2); st.streak = 0; save(); }
      if (round.wrong >= 2) {
        Array.prototype.forEach.call(grid.children, function (c, i) { if (round.choices[i] === round.answer) c.classList.add("pm-hint"); });
      }
      var tr = ROOT + "play/audio/" + (round.wrong % 2 ? "try1" : "try2") + ".mp3";
      P.playSeq([tr].concat(spec.wrongAudio ? spec.wrongAudio(t) : round.prompt.audio), null, 0);
    }
    M.start = function (el) {
      active = true;
      st = loadJSON(skey(), null);
      if (!st || typeof st !== "object") st = {};
      st.lvl = Math.max(2, Math.min(st.lvl || 2, maxC())); st.streak = st.streak || 0; st.miss = st.miss || 0; st.w = st.w || {};
      root = el; root.innerHTML = "";
      head = mk("div", "pm-head", root);
      say = mk("button", "pm-say", head, ICON.speaker);
      say.type = "button"; say.setAttribute("aria-label", "Hear it again");
      playingBtn = say;
      say.addEventListener("click", function (ev) { ev.stopPropagation(); var now = Date.now(); if (now - lastTap < 500) return; lastTap = now; playPrompt(); });
      mk("div", "pm-q", head);
      if (spec.extraHead) spec.extraHead(head, function () { return round; });
      lvlEl = mk("div", "pm-lvl", head);
      visual = mk("div", "pm-visual", root);
      grid = mk("div", "pm-grid", root);
      window.addEventListener("resize", layout);
      newRound();
    };
    M.stop = function () {
      active = false; clearTimeout(timer); round = null;
      window.removeEventListener("resize", layout);
      if (playingBtn === say) playingBtn = null;
    };
    M.state = function () { return { st: st, round: round, busy: busy, answerIndex: round ? round.choices.indexOf(round.answer) : -1 }; };
    return M;
  };

  // ---------- Mode picker + init ----------
  var cfg = null, curMode = null, modeObj = null, elPlay = null, bar = null, lastBar = 0, startOv = null;
  P.mode = function () { return curMode; };
  P.modeObj = function () { return modeObj; };
  function setMode(id, fromLoad) {
    var m = null;
    (cfg.modes || []).forEach(function (x) { if (x.id === id) m = x; });
    if (!m) { id = "learn"; m = cfg.modes[0]; }
    if (startOv) { startOv.dismiss(); startOv = null; }
    if (modeObj && modeObj.stop) modeObj.stop();
    P.stop();
    if (curMode === "learn" && id !== "learn" && cfg.learnStop) { try { cfg.learnStop(); } catch (e) {} }
    curMode = id; modeObj = m;
    store("play-mode-" + GAME, id);
    document.body.classList.toggle("pm-alt", id !== "learn");
    Array.prototype.forEach.call(bar.querySelectorAll(".pm-mode"), function (b) { b.classList.toggle("on", b.dataset.mode === id); b.setAttribute("aria-pressed", b.dataset.mode === id ? "true" : "false"); });
    if (id === "learn") { if (cfg.onLearn) cfg.onLearn(); return; }
    if (fromLoad) {
      // First visit of the page: one big button so the first tap unlocks audio before the voice starts.
      startOv = P.overlay(function (ov) {
        mk("h2", "", ov, m.label + "!");
        var go = mk("button", "pm-go", ov, ICON.play); go.type = "button"; go.setAttribute("aria-label", "Start");
      }, function () { startOv = null; if (curMode === id) m.start(elPlay); });
    } else m.start(elPlay);
  }
  P.setMode = function (id) { setMode(id, false); };
  P.init = function (c) {
    cfg = c; GAME = c.game || "game";
    soundKey = c.soundKey || "play-sound";
    document.body.classList.add("pm");
    if (c.rightButtons === 2) document.body.classList.add("pm-r2");
    bar = mk("nav", "", document.body); bar.id = "pmBar"; bar.setAttribute("aria-label", "Game modes");
    (c.modes || []).forEach(function (m) {
      var b = mk("button", "pm-mb pm-mode" + (m.label.length > 8 ? " pm-2l" : ""), bar, (m.icon || "") + "<b>" + m.label + "</b>");
      b.type = "button"; b.dataset.mode = m.id; b.title = m.title || m.label;
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var now = Date.now(); if (now - lastBar < 500) return; lastBar = now;
        if (m.id !== curMode) setMode(m.id, false);
        b.blur();
      });
    });
    if (c.stickerButton !== false) {
      elCount = mk("a", "pm-mb pm-stk-btn", bar, ICON.star + "<b>0</b>");
      elCount.href = ROOT + "stickers/?from=" + encodeURIComponent(location.pathname + location.search);
      elCount.setAttribute("aria-label", "Sticker book");
      elCount.title = "Sticker book";
      elCount.addEventListener("click", function (ev) { ev.stopPropagation(); });
      renderCount(false);
    }
    elPlay = mk("section", "", document.body); elPlay.id = "pmPlay"; elPlay.setAttribute("aria-live", "polite");
    elPlay.addEventListener("click", function (ev) { ev.stopPropagation(); });
    // Parent mute button (each game keeps its own setting): stop our voice too.
    var sb = document.getElementById("soundBtn");
    if (sb) sb.addEventListener("click", function () { setTimeout(function () { if (!soundOn()) P.stop(); }, 0); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) P.stop(); });
    window.addEventListener("storage", function (e) { if (e.key === SKEY) renderCount(false); });
    window.addEventListener("pageshow", function () { renderCount(false); });
    if (c.modes && c.modes.length) {
      var saved = load("play-mode-" + GAME) || "learn";
      var start = function () { setMode(saved, true); };
      if (c.opener) {
        // opener (e.g. "Today is Monday!") is itself the first tap
        if (saved !== "learn") document.body.classList.add("pm-alt");
        c.opener(function () { if (curMode == null) setMode(saved, false); });
      } else start();
    }
  };
  P.GAME = function () { return GAME; };
})();
