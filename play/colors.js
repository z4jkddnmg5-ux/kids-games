/* Colors: Learn (existing) + Find it + Color hunt */
(function () {
  "use strict";
  var P = window.PLAY, R = P.root;
  var C = (window.__fc && window.__fc.cards) || [];
  var pool = C.map(function (c) { return { id: c.id, name: c.name, label: c.name, hex: c.hex, img: c.img }; });
  var BLOBS = [
    "M100 14C138 12 176 36 184 78C192 120 170 166 128 182C88 196 38 184 20 146C4 110 18 60 50 34C64 22 82 15 100 14Z",
    "M96 12C132 8 170 28 182 64C194 100 186 142 156 168C126 192 76 194 44 172C14 150 6 108 18 72C30 38 60 16 96 12Z",
    "M108 16C146 22 182 54 184 96C186 140 156 178 112 186C70 194 26 170 16 128C6 88 26 44 60 26C74 18 92 14 108 16Z",
    "M100 10C124 22 148 16 170 38C192 60 186 90 190 116C194 146 170 176 138 186C106 196 72 192 44 174C18 156 8 124 14 94C20 62 30 42 52 26C68 14 80 2 100 10Z"
  ];
  function blob(hex, i) {
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><path fill="' + hex + '" stroke="rgba(58,46,92,.3)" stroke-width="5" stroke-linejoin="round" d="' + BLOBS[i % BLOBS.length] + '"/>' +
      '<ellipse cx="70" cy="62" rx="22" ry="13" fill="#fff" opacity=".35" transform="rotate(-30 70 62)"/></svg>';
  }
  function word(t) { return '<em style="color:' + t.hex + ';-webkit-text-stroke:max(1.5px,.05em) #3a2e5c;paint-order:stroke fill">' + t.name.toLowerCase() + "</em>"; }
  var NEUTRAL = "#FFF6E0";
  var find = P.choiceMode({
    id: "find", label: "Find it", icon: P.ICON.find, pool: pool, maxChoices: 4,
    prompt: function (t) { return { html: "Tap the " + word(t) + " one!", audio: [R + "colors/audio/find/" + t.id + ".mp3"] }; },
    card: function (it, inner, round) { inner.innerHTML = '<div class="pm-sw">' + blob(it.hex, round.choices.indexOf(it) + Math.floor(Math.random() * 4)) + "</div>"; },
    correctAudio: function (t) { return [R + "colors/audio/name/" + t.id + ".mp3"]; },
    confetti: function (t) { return [t.hex, t.hex, "#ffffff", t.hex, "#ffbe0b"]; },
    sticker: function (t) { return P.randomSticker(t.hex); },
    onRound: function () { document.body.style.backgroundColor = NEUTRAL; }
  });
  // Color hunt: "Find something blue in your room!" -> big "I found it!" button (no timer)
  var hunt = (function () {
    var M = { id: "hunt", label: "Hunt", icon: P.ICON.hunt, title: "Color hunt: find it in your room" };
    var el, cur = null, recent = [], lastTap = 0, shownAt = 0, timer = null, active = false, found = false, going = false, sw, btn, q, say, skip;
    function pick() {
      var c = pool.filter(function (x) { return recent.indexOf(x.id) < 0; });
      var t = P.rnd(c); recent.push(t.id); if (recent.length > 4) recent.shift();
      return t;
    }
    function prompt() { P.playSeq([R + "colors/audio/hunt/" + cur.id + ".mp3"], null, 0); }
    function next() {
      clearTimeout(timer);
      if (!active) return;
      found = false; going = false; cur = pick(); shownAt = Date.now();
      document.body.style.backgroundColor = NEUTRAL;
      q.innerHTML = "Find something " + word(cur) + " in your room!";
      sw.innerHTML = blob(cur.hex, Math.floor(Math.random() * 4));
      sw.classList.remove("pop");
      btn.innerHTML = "I found it!"; btn.className = "pm-big-btn green";
      skip.style.visibility = "";
      prompt();
    }
    function tapFound() {
      var now = Date.now();
      if (now - lastTap < 500) return; lastTap = now;
      if (found) { proceed(); return; }
      if (now - shownAt < 800) return;
      found = true;
      sw.classList.remove("pop"); void sw.offsetWidth; sw.classList.add("pop");
      var c = P.center(sw);
      P.confetti(c[0], c[1], [cur.hex, cur.hex, "#ffffff", cur.hex, "#ffbe0b", "#ff5d8f"]);
      P.earnSticker(P.randomSticker(cur.hex), btn);
      btn.innerHTML = "Next color \u27A1"; btn.className = "pm-big-btn";
      skip.style.visibility = "hidden";
      var t0 = Date.now();
      P.playSeq([R + "colors/audio/found/" + cur.id + ".mp3"], function () {
        timer = setTimeout(function () { if (active && found) proceed(); }, Math.max(1500, 3200 - (Date.now() - t0)));
      }, 1500);
    }
    // reward (or parade) once, then the next color
    function proceed() {
      if (going) return;
      going = true; clearTimeout(timer);
      P.afterCorrect({ mode: "hunt" }, function () { going = false; if (active) next(); });
    }
    M.start = function (root) {
      active = true; going = false; el = root; el.innerHTML = "";
      var head = P.mk("div", "pm-head", el);
      say = P.mk("button", "pm-say", head, P.ICON.speaker); say.type = "button"; say.setAttribute("aria-label", "Hear it again");
      q = P.mk("div", "pm-q", head);
      var wrap = P.mk("div", "pm-hunt-wrap", el);
      sw = P.mk("div", "pm-hunt-sw", wrap);
      var bw = P.mk("div", "pm-hunt-btns", wrap);
      btn = P.mk("button", "pm-big-btn green", bw, "I found it!"); btn.type = "button";
      skip = P.mk("button", "pm-small-btn", bw, "Another color"); skip.type = "button";
      say.addEventListener("click", function (e) { e.stopPropagation(); prompt(); });
      sw.addEventListener("click", function (e) { e.stopPropagation(); var n = Date.now(); if (n - lastTap < 500) return; lastTap = n; prompt(); });
      btn.addEventListener("click", function (e) { e.stopPropagation(); tapFound(); btn.blur(); });
      skip.addEventListener("click", function (e) { e.stopPropagation(); var n = Date.now(); if (n - lastTap < 500) return; lastTap = n; next(); skip.blur(); });
      next();
    };
    M.stop = function () { active = false; clearTimeout(timer); };
    M.state = function () { return { cur: cur, found: found }; };
    return M;
  })();
  P.init({
    game: "colors", soundKey: "cfc-sound", rightButtons: 2,
    learnStop: function () { if (window.__learnStop) window.__learnStop(); },
    onLearn: function () { var b = document.body.style.getPropertyValue("--bg").trim(); if (b) document.body.style.backgroundColor = b; },
    modes: [{ id: "learn", label: "Learn", icon: P.ICON.learn, title: "Learn: flash cards" }, find, hunt]
  });
})();
