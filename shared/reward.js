/* Post-answer rewards for the toddler games (shared by all games; needs play/play.js first).
   - Quick reward (~5 s): pop balloons / pop bubbles / tap fireworks / dancing animal photo.
   - Big reward every 5 stickers: "Pick a present!" -> prize sticker in the sticker book.
   - Parent setting (sticker book): "every" | "3" | "off"  (localStorage "play-reward-mode").
   - Synth pop/boing/bang sounds via WebAudio (respects the game's mute setting).
   - After a reward closes, taps are ignored for 0.6 s so she can't skip the next question.
   Plain ES5, no dependencies. */
(function () {
  "use strict";
  var P = window.PLAY;
  if (!P) return;
  var ROOT = P.root || "", AU = ROOT + "shared/audio/";
  var RW = window.REWARD = {};
  var MKEY = "play-reward-mode";
  function mk(tag, cls, parent, html) { return P.mk(tag, cls, parent, html); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rr(a, b) { return a + Math.random() * (b - a); }

  RW.getMode = function () { var v = P.load(MKEY); return (v === "3" || v === "off") ? v : "every"; };
  RW.setMode = function (v) { P.store(MKEY, (v === "3" || v === "off") ? v : "every"); };

  // ---------------- WebAudio synth (unlocked on the first gesture, iOS-safe) ----------------
  var ctx = null, master = null, noise = null, primed = false;
  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination); } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function gesture() {
    var c = ac();
    if (!c || primed) return;
    primed = true;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
  }
  ["touchend", "click", "keydown"].forEach(function (n) { document.addEventListener(n, gesture, true); });
  function live() { return P.soundOn() && ctx && primed ? ac() : null; }
  function noiseBuf(c) {
    if (noise) return noise;
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    var d = noise.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noise;
  }
  function env(c, t, peak, dur) {
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);
    return g;
  }
  function tone(c, type, f0, f1, t, dur, peak) {
    var o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.9);
    o.connect(env(c, t, peak, dur)); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function hiss(c, t, dur, peak, type, f0, f1, q) {
    var s = c.createBufferSource(); s.buffer = noiseBuf(c);
    var f = c.createBiquadFilter(); f.type = type || "bandpass"; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    s.connect(f); f.connect(env(c, t, peak, dur)); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  var SFX = RW.sfx = {
    pop: function (p) { var c = live(); if (!c) return; var t = c.currentTime, f = (p || 1) * rr(620, 820);
      tone(c, "sine", f, 110, t, 0.12, 0.55); hiss(c, t, 0.07, 0.45, "bandpass", 1900, 900, 0.8); },
    bubble: function () { var c = live(); if (!c) return; var t = c.currentTime, f = rr(380, 520);
      tone(c, "sine", f, f * 2.6, t, 0.09, 0.35); tone(c, "sine", f * 1.5, f * 3.2, t + 0.05, 0.07, 0.15); },
    boing: function () { var c = live(); if (!c) return; var t = c.currentTime;
      var o = c.createOscillator(); o.type = "triangle";
      o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(430, t + 0.22); o.frequency.exponentialRampToValueAtTime(260, t + 0.55);
      var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 16; lg.gain.value = 45; l.connect(lg); lg.connect(o.frequency);
      o.connect(env(c, t, 0.5, 0.6)); o.start(t); l.start(t); o.stop(t + 0.65); l.stop(t + 0.65); },
    whistle: function () { var c = live(); if (!c) return; var t = c.currentTime; tone(c, "sine", 700, 1700, t, 0.3, 0.08); },
    bang: function () { var c = live(); if (!c) return; var t = c.currentTime;
      hiss(c, t, 0.7, 0.7, "lowpass", 1600, 250, 0.7); tone(c, "sine", 140, 45, t, 0.3, 0.5);
      for (var i = 0; i < 5; i++) hiss(c, t + 0.18 + i * rr(0.05, 0.1), 0.04, 0.18, "highpass", 3000, 3000, 1); },
    rattle: function () { var c = live(); if (!c) return; var t = c.currentTime;
      for (var i = 0; i < 7; i++) { hiss(c, t + i * 0.1, 0.05, 0.3, "bandpass", 2400, 1800, 2); tone(c, "square", 180, 160, t + i * 0.1, 0.04, 0.05); } },
    chime: function () { var c = live(); if (!c) return; var t = c.currentTime;
      [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(c, "triangle", f, f, t + i * 0.09, 0.45, 0.28); tone(c, "sine", f * 2, f * 2, t + i * 0.09, 0.3, 0.06); }); },
    tick: function () { var c = live(); if (!c) return; tone(c, "sine", 900, 700, c.currentTime, 0.05, 0.12); }
  };

  // ---------------- tap guard (no stray skip into the next question) ----------------
  var active = null, lastEnd = 0, GUARD_MS = 600;
  RW.isActive = function () { return !!active; };
  function guard(e) {
    if (active) {
      if (!active.el.contains(e.target)) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); }
      return;
    }
    if (learnPending && e.type === "click") { clearTimeout(learnPending); learnPending = null; }
    if (Date.now() - lastEnd < GUARD_MS) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); RW.blocked = (RW.blocked || 0) + 1; }
  }
  ["click", "pointerdown", "mousedown"].forEach(function (n) { window.addEventListener(n, guard, true); });
  window.addEventListener("keydown", function (e) {
    if (active) {
      e.stopPropagation(); e.preventDefault();
      if ((e.key === "Enter" || e.key === " " || e.key === "ArrowRight") && active.next) active.next();
      return;
    }
    if (Date.now() - lastEnd < GUARD_MS) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  // ---------------- particles ----------------
  var PAL = ["#ff5d8f", "#ffbe0b", "#3a86ff", "#06d6a0", "#8338ec", "#fb5607", "#ff7aa2"];
  function burst(host, x, y, colors, n, dist, cls) {
    colors = colors || PAL; n = n || 16; dist = dist || 20;
    for (var i = 0; i < n; i++) {
      var d = mk("div", "rw-bit" + (cls ? " " + cls : "") + (i % 3 === 0 ? " sq" : ""), host);
      var ang = (Math.PI * 2 * i) / n + Math.random() * 0.5, r = dist * rr(0.6, 1.2);
      d.style.left = x + "px"; d.style.top = y + "px";
      d.style.setProperty("--dx", (Math.cos(ang) * r).toFixed(1) + "vmin");
      d.style.setProperty("--dy", (Math.sin(ang) * r).toFixed(1) + "vmin");
      d.style.setProperty("--rot", Math.round(rr(-300, 300)) + "deg");
      d.style.background = d.style.color = colors[i % colors.length];
      (function (node) { setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1200); })(d);
    }
  }
  RW.burst = burst;
  function ptXY(e) { var t = e.changedTouches && e.changedTouches[0]; return t ? [t.clientX, t.clientY] : [e.clientX, e.clientY]; }
  function ctr(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }

  // ---------------- overlay shell ----------------
  var ARROW = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 16h19M16 7l9 9-9 9" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function shell(cls, title, opts) {
    opts = opts || {};
    var ov = mk("div", "rw-ov " + cls, document.body);
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", title.replace(/<[^>]*>/g, ""));
    var h = mk("h2", "rw-title", ov, title);
    var area = mk("div", "rw-area", ov);
    var nb = mk("button", "rw-next", ov, "<b>Next</b>" + ARROW);
    nb.type = "button"; nb.setAttribute("aria-label", "Next");
    var bar = opts.dur ? mk("div", "rw-time", ov, "<i></i>") : null;
    var S = { el: ov, area: area, title: h, nextBtn: nb, shown: Date.now(), closed: false, timers: [], onClose: null };
    ["click", "pointerdown", "touchstart", "mousedown"].forEach(function (n) {
      ov.addEventListener(n, function (e) { e.stopPropagation(); }, false);
    });
    ov.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    S.later = function (fn, ms) { var id = setTimeout(function () { if (!S.closed) fn(); }, ms); S.timers.push(id); return id; };
    S.setAuto = function (ms) {
      clearTimeout(S.auto); S.auto = S.later(function () { S.close(); }, ms);
      if (bar) { var i = bar.firstChild; i.style.transition = "none"; i.style.transform = "scaleX(1)"; void i.offsetWidth; i.style.transition = "transform " + ms + "ms linear"; i.style.transform = "scaleX(0)"; }
    };
    S.enableNext = function (ms) { S.later(function () { nb.classList.add("on"); }, ms); };
    S.next = function () { if (nb.classList.contains("on")) S.close(); };
    nb.addEventListener("click", function (e) { e.stopPropagation(); S.next(); });
    S.close = function () {
      if (S.closed) return; S.closed = true;
      S.timers.forEach(clearTimeout);
      ov.classList.add("rw-out");
      lastEnd = Date.now() + 250;     // guard runs from the moment the overlay is really gone
      active = null;
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); lastEnd = Date.now(); if (S.onClose) S.onClose(); }, 250);
    };
    active = S;
    return S;
  }

  // ---------------- quick rewards ----------------
  var BCOL = [["#ff4d6d", "#c9184a"], ["#ffbe0b", "#e09f00"], ["#3a86ff", "#1d5fcc"], ["#06d6a0", "#049a74"], ["#8338ec", "#5f1fbf"], ["#fb5607", "#c43f00"], ["#ff7aa2", "#e04f7d"]];
  function balloonSVG(c) {
    return '<svg viewBox="0 0 100 150" aria-hidden="true"><path d="M50 96q-7 14 3 24t-4 26" fill="none" stroke="#6b5b8a" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M44 94h12l-6 8z" fill="' + c[1] + '"/><ellipse cx="50" cy="50" rx="40" ry="46" fill="' + c[0] + '"/>' +
      '<ellipse cx="50" cy="50" rx="40" ry="46" fill="none" stroke="' + c[1] + '" stroke-width="3" opacity=".6"/>' +
      '<ellipse cx="34" cy="30" rx="10" ry="15" fill="#fff" opacity=".45" transform="rotate(-25 34 30)"/><circle cx="30" cy="52" r="4" fill="#fff" opacity=".35"/></svg>';
  }
  function popAll(S, sel, n, onAll) {
    var left = n;
    return function () { left--; if (left <= 0) onAll(); };
  }
  var QUICK = {
    balloons: function (S, o) {
      var host = S.area, n = 7, done = popAll(S, ".rw-balloon", n, allPopped);
      var cols = BCOL.slice().sort(function () { return Math.random() - 0.5; });
      for (var i = 0; i < n; i++) (function (i) {
        var b = mk("button", "rw-balloon", host, balloonSVG(cols[i % cols.length]));
        b.type = "button"; b.setAttribute("aria-label", "Balloon");
        b.style.left = (6 + (i * 88 / (n - 1)) + rr(-3, 3)) + "%";
        b.style.setProperty("--y0", rr(4, 40).toFixed(0) + "vh");
        b.style.setProperty("--sw", rr(2, 5).toFixed(1) + "vw");
        b.style.animationDelay = (-rr(0, 2)).toFixed(2) + "s, " + (i * 0.06).toFixed(2) + "s";
        b.addEventListener("pointerdown", function (e) {
          e.preventDefault(); if (b.dataset.p) return; b.dataset.p = "1";
          var c = ctr(b.firstChild); SFX.pop(rr(0.85, 1.2));
          burst(S.el, c[0], c[1] - b.offsetHeight * 0.12, [cols[i % cols.length][0], "#ffffff", cols[i % cols.length][0], "#ffd23f"], 14, 14);
          b.classList.add("popped"); RW.pops = (RW.pops || 0) + 1; done();
        });
      })(i);
      function allPopped() { S.title.innerHTML = "Hooray!"; P.playSeq([ROOT + "play/audio/yay" + rnd([2, 3, 4]) + ".mp3"], function () { S.later(S.close, 300); }, 900); S.setAuto(3000); }
    },
    bubbles: function (S) {
      var host = S.area, n = 9, done = popAll(S, ".rw-bubble", n, function () { S.title.innerHTML = "Hooray!"; P.playSeq([ROOT + "play/audio/yay4.mp3"], function () { S.later(S.close, 300); }, 900); S.setAuto(3000); });
      for (var i = 0; i < n; i++) (function (i) {
        var b = mk("button", "rw-bubble", host, "<i></i>");
        b.type = "button"; b.setAttribute("aria-label", "Bubble");
        var s = rr(16, 27);
        b.style.width = b.style.height = "min(" + s.toFixed(0) + "vw," + (s * 0.66).toFixed(0) + "vh)";
        b.style.left = rr(2, 78).toFixed(0) + "%"; b.style.top = rr(8, 70).toFixed(0) + "%";
        b.style.setProperty("--hue", Math.round(rr(0, 360)) + "deg");
        b.style.animationDelay = (-rr(0, 3)).toFixed(2) + "s, " + (i * 0.07).toFixed(2) + "s";
        b.addEventListener("pointerdown", function (e) {
          e.preventDefault(); if (b.dataset.p) return; b.dataset.p = "1";
          var c = ctr(b); SFX.bubble();
          burst(S.el, c[0], c[1], ["#bde0fe", "#ffffff", "#a2d2ff", "#ffc8dd"], 10, 9, "round");
          b.classList.add("popped"); RW.pops = (RW.pops || 0) + 1; done();
        });
      })(i);
    },
    fireworks: function (S) {
      var host = S.area, last = 0, liveN = 0;
      function boom(x, y) {
        if (liveN > 6) return; liveN++; setTimeout(function () { liveN--; }, 1000);
        var hue = rnd([["#ffd23f", "#ff9f1c", "#ffe066"], ["#ff4d8d", "#ff85b3", "#ffd23f"], ["#3ab7ff", "#4cc9f0", "#9bf6ff"], ["#2ee6a6", "#06d6a0", "#ffd23f"], ["#c77dff", "#9d4edd", "#ff85b3"]]);
        burst(S.el, x, y, hue, 26, 28, "spark"); burst(S.el, x, y, hue, 12, 13, "spark");
        var st = mk("div", "rw-flash", S.el); st.style.left = x + "px"; st.style.top = y + "px"; st.style.background = hue[0];
        setTimeout(function () { if (st.parentNode) st.parentNode.removeChild(st); }, 600);
        SFX.bang(); RW.booms = (RW.booms || 0) + 1;
      }
      S.el.addEventListener("pointerdown", function (e) {
        if (e.target.closest && e.target.closest(".rw-next")) return;
        var n = Date.now(); if (n - last < 140) return; last = n;
        var p = ptXY(e); boom(p[0], p[1]);
      });
      for (var i = 0; i < 18; i++) { var s = mk("i", "rw-star", host); s.style.left = rr(2, 98) + "%"; s.style.top = rr(2, 95) + "%"; s.style.animationDelay = rr(0, 2) + "s"; }
      [500, 1600, 2900].forEach(function (t) { S.later(function () { SFX.whistle(); S.later(function () { boom(innerWidth * rr(0.2, 0.8), innerHeight * rr(0.25, 0.6)); }, 320); }, t); });
    },
    dance: function (S, o) {
      var id = (o && o.animal && P.ANIMAL_IDS.indexOf(o.animal) >= 0) ? o.animal : rnd(P.ANIMAL_IDS);
      var wrap = mk("div", "rw-dwrap", S.area);
      var ph = mk("button", "rw-dancer", wrap, '<img alt="" draggable="false" src="' + ROOT + "img/" + id + '.jpg?v=1">');
      ph.type = "button"; ph.setAttribute("aria-label", id);
      mk("div", "rw-shadow", wrap);
      var NOTE = '<svg viewBox="0 0 40 50" aria-hidden="true"><path d="M14 38V8l22-5v29" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><ellipse cx="9" cy="39" rx="8" ry="6" fill="currentColor"/><ellipse cx="31" cy="33" rx="8" ry="6" fill="currentColor"/></svg>';
      function note() { var n = mk("div", "rw-note", S.area, NOTE); n.style.left = rr(8, 82) + "%"; n.style.color = rnd(PAL); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1800); }
      var lastB = 0;
      ph.addEventListener("pointerdown", function (e) {
        e.preventDefault(); var n = Date.now(); if (n - lastB < 250) return; lastB = n;
        ph.classList.remove("jump"); void ph.offsetWidth; ph.classList.add("jump");
        SFX.boing(); note(); RW.boings = (RW.boings || 0) + 1;
      });
      [300, 1250, 2200, 3150, 4100].forEach(function (t, i) { S.later(function () { if (i) SFX.boing(); note(); }, t); });
    }
  };
  RW.kinds = Object.keys(QUICK);
  var lastKind = null;
  // o: {animal, kind, light}
  RW.quick = function (next, o) {
    o = o || {};
    if (active) { if (next) next(); return; }
    var kind = o.kind && QUICK[o.kind] ? o.kind : null;
    if (!kind) { var ks = RW.kinds.filter(function (k) { return k !== lastKind; }); kind = rnd(ks); }
    lastKind = kind;
    var T = { balloons: "Pop the balloons!", bubbles: "Pop the bubbles!", fireworks: "Tap for fireworks!", dance: "Boing! Boing!" };
    var dur = o.light ? 4000 : 5200;
    var S = shell("rw-quick rw-" + kind, T[kind], { dur: dur });
    S.onClose = next || null;
    QUICK[kind](S, o);
    S.enableNext(900);
    S.setAuto(dur);
    P.playSeq([AU + ({ balloons: "balloons", bubbles: "bubbles", fireworks: "fireworks", dance: "dance" })[kind] + ".mp3"], null, 0);
    RW.last = kind; RW.count = (RW.count || 0) + 1;
    return S;
  };

  // ---------------- mini sparkle (non-blocking, e.g. a Match pair) ----------------
  RW.mini = function (x, y) {
    if (RW.getMode() === "off") return;
    var host = mk("div", "rw-mini", document.body);
    burst(host, x, y, ["#ffd23f", "#ffffff", "#ff5d8f", "#4cc9f0"], 14, 16, "spark");
    SFX.pop(1.3);
    setTimeout(function () { if (host.parentNode) host.parentNode.removeChild(host); }, 1100);
  };

  // ---------------- prize stickers ----------------
  var GOLD = '<defs><radialGradient id="rwg" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#fff6c2"/><stop offset=".65" stop-color="#ffd23f"/><stop offset="1" stop-color="#f4a300"/></radialGradient></defs>';
  var RAYS = (function () { var s = ""; for (var i = 0; i < 12; i++) s += '<path d="M50 50L' + (50 + 52 * Math.cos((i * 30 - 7) * Math.PI / 180)).toFixed(1) + " " + (50 + 52 * Math.sin((i * 30 - 7) * Math.PI / 180)).toFixed(1) + "L" + (50 + 52 * Math.cos((i * 30 + 7) * Math.PI / 180)).toFixed(1) + " " + (50 + 52 * Math.sin((i * 30 + 7) * Math.PI / 180)).toFixed(1) + 'z" fill="#ffe27a" opacity=".85"/>'; return s; })();
  var PFACE = '<circle cx="42" cy="60" r="3.6" fill="#3a2e5c"/><circle cx="58" cy="60" r="3.6" fill="#3a2e5c"/><path d="M44 68q6 5 12 0" fill="none" stroke="#3a2e5c" stroke-width="3" stroke-linecap="round"/>';
  var PRIZES = {
    crown: '<path d="M16 72L12 32l20 18 18-28 18 28 20-18-4 40z" fill="url(#rwg)" stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/><rect x="16" y="70" width="68" height="12" rx="4" fill="#f4a300" stroke="#fff" stroke-width="4" paint-order="stroke"/><circle cx="50" cy="52" r="6" fill="#ff4d6d"/><circle cx="30" cy="58" r="4.5" fill="#3a86ff"/><circle cx="70" cy="58" r="4.5" fill="#06d6a0"/><circle cx="12" cy="30" r="5" fill="#ffd23f"/><circle cx="50" cy="20" r="5" fill="#ffd23f"/><circle cx="88" cy="30" r="5" fill="#ffd23f"/>',
    trophy: '<path d="M30 16h40v18c0 16-9 26-20 26S30 50 30 34z" fill="url(#rwg)" stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/><path d="M30 22H16c0 14 8 20 16 20M70 22h14c0 14-8 20-16 20" fill="none" stroke="#f4a300" stroke-width="5"/><rect x="45" y="58" width="10" height="14" fill="#f4a300"/><rect x="30" y="72" width="40" height="12" rx="4" fill="#8338ec" stroke="#fff" stroke-width="4" paint-order="stroke"/><path d="M50 24l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff"/>',
    gem: '<path d="M26 22h48l16 20-40 44-40-44z" fill="#4cc9f0" stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/><path d="M10 42h80M26 22l12 20 12-20 12 20 12-20M38 42l12 44 12-44" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/><path d="M30 26l8 14H18z" fill="#fff" opacity=".45"/>',
    star: '<path d="M50 6l12.4 26.6 29 3.4-21.6 19.8 5.8 28.7L50 70.1 24.4 84.5l5.8-28.7L8.6 36l29-3.4z" fill="url(#rwg)" stroke="#fff" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>' + PFACE.replace(/cy="60"/g, 'cy="46"').replace("M44 68", "M44 54"),
    rainbowstar: '<path d="M50 6l12.4 26.6 29 3.4-21.6 19.8 5.8 28.7L50 70.1 24.4 84.5l5.8-28.7L8.6 36l29-3.4z" fill="#ff5d8f" stroke="#fff" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/><path d="M50 18l8 17 18 2-13 12 3.5 17.5L50 58l-16.5 8.5L37 49 24 37l18-2z" fill="#ffbe0b"/><path d="M50 30l4.5 9.5 10 1.2-7.4 6.8 2 9.8-9.1-5-9.1 5 2-9.8-7.4-6.8 10-1.2z" fill="#3a86ff"/>',
    unicorn: '<path d="M60 8l-6 28" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="M60 8l-6 28" stroke="#ffbe0b" stroke-width="6" stroke-linecap="round"/><ellipse cx="50" cy="56" rx="30" ry="28" fill="#fff" stroke="#e5d4ff" stroke-width="4"/><path d="M24 44c-6-14 6-22 14-18M76 44c6-14-6-22-14-18" fill="#ff7aa2"/><path d="M28 34c10-8 20-8 26-2" fill="none" stroke="#c77dff" stroke-width="8" stroke-linecap="round"/><path d="M26 42c8-4 14-4 18 0" fill="none" stroke="#4cc9f0" stroke-width="7" stroke-linecap="round"/>' + PFACE + '<circle cx="34" cy="66" r="4" fill="#ff8fab" opacity=".7"/><circle cx="66" cy="66" r="4" fill="#ff8fab" opacity=".7"/>'
  };
  var PKINDS = Object.keys(PRIZES);
  function prizeHTML(p) {
    var inner;
    if (p[1] === "a" && P.ANIMAL_IDS.indexOf(p[2]) >= 0) {
      return '<span class="pm-stk rw-prize-stk rw-prize-photo"><svg class="rw-rays" viewBox="0 0 100 100" aria-hidden="true">' + RAYS + '</svg>' +
        '<span class="rw-frame"><img src="' + ROOT + "img/" + p[2] + '.jpg" alt="' + p[2] + '" draggable="false"></span>' +
        '<svg class="rw-crown" viewBox="0 0 100 70" aria-hidden="true">' + GOLD + '<path d="M10 62L6 16l22 18 22-30 22 30 22-18-4 46z" fill="url(#rwg)" stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/><circle cx="50" cy="42" r="6" fill="#ff4d6d"/></svg></span>';
    }
    var k = PRIZES[p[1]] ? p[1] : "crown";
    inner = '<svg viewBox="0 0 100 100" aria-hidden="true">' + GOLD + RAYS + '<circle cx="50" cy="50" r="40" fill="#fff8d6" opacity=".6"/>' + PRIZES[k] + "</svg>";
    return '<span class="pm-stk rw-prize-stk">' + inner + "</span>";
  }
  var origHTML = P.stickerHTML;
  P.stickerHTML = function (id) { var p = String(id || "").split(":"); return p[0] === "p" ? prizeHTML(p) : origHTML(id); };
  RW.randomPrize = function (animal) {
    if (animal && P.ANIMAL_IDS.indexOf(animal) >= 0 && Math.random() < 0.5) return "p:a:" + animal;
    return Math.random() < 0.3 ? "p:a:" + rnd(P.ANIMAL_IDS) : "p:" + rnd(PKINDS);
  };
  RW.addPrize = function (id) {
    var list = P.stickers();
    list.push({ s: id, g: P.GAME ? P.GAME() : "game", t: Date.now(), prize: 1 });
    if (list.length > 3000) list = list.slice(-3000);
    P.saveJSON("play-stickers", list);
    if (P.renderCount) P.renderCount(true);
  };

  // ---------------- big reward: pick a present ----------------
  var BOX = [["#ff4d6d", "#ffd23f"], ["#3a86ff", "#ff7aa2"], ["#06d6a0", "#8338ec"], ["#ffbe0b", "#3a86ff"], ["#8338ec", "#06d6a0"]];
  function presentSVG(c) {
    return '<svg class="rw-box-body" viewBox="0 0 100 80" aria-hidden="true"><rect x="6" y="4" width="88" height="74" rx="8" fill="' + c[0] + '"/><rect x="6" y="4" width="88" height="74" rx="8" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="3"/>' +
      '<rect x="43" y="4" width="14" height="74" fill="' + c[1] + '"/><circle cx="22" cy="30" r="4" fill="#fff" opacity=".5"/><circle cx="76" cy="56" r="5" fill="#fff" opacity=".4"/><circle cx="26" cy="62" r="3" fill="#fff" opacity=".4"/><circle cx="74" cy="22" r="3" fill="#fff" opacity=".45"/></svg>' +
      '<svg class="rw-box-lid" viewBox="0 0 110 60" aria-hidden="true"><path d="M55 30C40 6 18 8 24 22s24 10 31 8zM55 30C70 6 92 8 86 22s-24 10-31 8z" fill="' + c[1] + '" stroke="rgba(0,0,0,.15)" stroke-width="3"/>' +
      '<rect x="2" y="28" width="106" height="28" rx="7" fill="' + c[0] + '"/><rect x="2" y="28" width="106" height="28" rx="7" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="3"/><rect x="47" y="28" width="16" height="28" fill="' + c[1] + '"/><circle cx="55" cy="30" r="7" fill="' + c[1] + '" stroke="rgba(0,0,0,.15)" stroke-width="2"/></svg>';
  }
  RW.prize = function (next, o) {
    o = o || {};
    if (active) { if (next) next(); return; }
    var S = shell("rw-prize", "Pick a present!", {});
    S.onClose = next || null;
    var row = mk("div", "rw-boxes", S.area);
    var cols = BOX.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3);
    var picked = false, prizeId = RW.randomPrize(o.animal);
    cols.forEach(function (c, i) {
      var b = mk("button", "rw-box", row, presentSVG(c));
      b.type = "button"; b.setAttribute("aria-label", "Present " + (i + 1));
      b.style.animationDelay = (i * 0.12) + "s, " + (0.6 + i * 0.35) + "s";
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (picked || Date.now() - S.shown < 500) return;
        picked = true; RW.picked = i;
        Array.prototype.forEach.call(row.children, function (x) { if (x !== b) x.classList.add("gone"); });
        b.classList.add("chosen");
        S.title.innerHTML = "Ooh!";
        SFX.rattle();
        S.later(function () {
          b.classList.add("open");
          SFX.chime();
          var c0 = ctr(b);
          burst(S.el, c0[0], c0[1], null, 26, 30);
          var rv = mk("div", "rw-reveal", S.el, P.stickerHTML(prizeId));
          RW.addPrize(prizeId); RW.lastPrize = prizeId;
          S.title.innerHTML = "You got a prize!";
          S.el.classList.add("revealed");
          S.later(function () { burst(S.el, innerWidth * 0.25, innerHeight * 0.35, null, 22, 26); }, 450);
          S.later(function () { burst(S.el, innerWidth * 0.75, innerHeight * 0.4, null, 22, 26); }, 850);
          S.later(function () { burst(S.el, innerWidth * 0.5, innerHeight * 0.25, ["#ffd23f", "#fff3b0", "#ffffff"], 26, 34); }, 1300);
          rv.addEventListener("click", function (ev) { ev.stopPropagation(); rv.classList.remove("hop"); void rv.offsetWidth; rv.classList.add("hop"); SFX.pop(1.4); });
          P.playSeq([AU + "prize.mp3"], null, 0);
          S.enableNext(1200);
          S.setAuto(6500);
        }, 1000);
      });
    });
    P.playSeq([AU + "present.mp3"], null, 0);
    RW.count = (RW.count || 0) + 1; RW.prizes = (RW.prizes || 0) + 1;
    return S;
  };

  // ---------------- decisions ----------------
  var answers = 0;
  // Called by the games after a correct answer: big = 5-sticker milestone reached.
  RW.after = function (big, o, next) {
    var m = RW.getMode();
    o = o || {};
    if (m === "off") { if (big && P.parade) P.parade(next); else if (next) next(); return; }
    answers++;
    if (big) { RW.prize(next, o); return; }
    if (m === "every" || answers % 3 === 0) RW.quick(next, o);
    else if (next) next();
  };
  // Learn mode: a light reward every 5th revealed card (cancelled if she taps on before it shows).
  var learnN = 0, learnPending = null;
  RW.learnReveal = function () {
    if (RW.getMode() === "off") return;
    learnN++;
    if (learnN % 5 !== 0) return;
    clearTimeout(learnPending);
    learnPending = setTimeout(function () {
      learnPending = null;
      if (document.body.classList.contains("pm-alt") || active) return;
      RW.quick(null, { light: true });
    }, 2400);
  };
  RW.learnCount = function () { return learnN; };
  P.warm && P.warm([AU + "balloons.mp3", AU + "present.mp3", AU + "prize.mp3"]);
})();
