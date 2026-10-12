/* Letters: Learn (existing, with tracing) + Find the letter + Starts with */
(function () {
  "use strict";
  var P = window.PLAY, R = P.root;
  var WORDS = [["A", "apple"], ["B", "ball"], ["C", "cat"], ["D", "dog"], ["E", "egg"], ["F", "fish"], ["G", "goat"], ["H", "hat"],
    ["I", "ice cream"], ["J", "juice"], ["K", "kite"], ["L", "lion"], ["M", "moon"], ["N", "nest"], ["O", "orange"], ["P", "pig"],
    ["Q", "queen"], ["R", "rabbit"], ["S", "sun"], ["T", "tree"], ["U", "umbrella"], ["V", "violin"], ["W", "watermelon"],
    ["X", "xylophone"], ["Y", "yo-yo"], ["Z", "zebra"]];
  var INKS = ["#e63971", "#ff6b00", "#1f6fd1", "#0e9a62", "#8338ec", "#d62828", "#c2185b", "#00838f"];
  var inkI = 0;
  var letters = WORDS.map(function (w) { return { id: w[0].toLowerCase(), L: w[0], label: "Letter " + w[0] }; });
  function lc(t) { return t.L.toLowerCase(); }
  var find = P.choiceMode({
    id: "find", label: "Find it", icon: P.ICON.find, pool: letters, maxChoices: 4,
    prompt: function (t) { return { html: "Find the letter <em>" + t.L + "</em>!", audio: [R + "letters/audio/find/" + lc(t) + ".mp3"] }; },
    card: function (it, inner) { inner.innerHTML = '<div class="pm-letter"><span>' + it.L + "</span><small>" + it.L.toLowerCase() + "</small></div>"; },
    correctAudio: function (t) { return [R + "letters/audio/" + lc(t) + ".mp3"]; },
    ink: function () { inkI = (inkI + 1 + Math.floor(Math.random() * (INKS.length - 1))) % INKS.length; return INKS[inkI]; }
  });
  // Photos for "Which one starts with B?": the letter-word photos + animal photos (from the Animals game).
  var PHOTOS = WORDS.map(function (w) {
    return { id: "w-" + w[0].toLowerCase(), init: w[0], word: w[1], img: R + "letters/img/" + w[0].toLowerCase() + ".jpg", audio: R + "letters/audio/" + w[0].toLowerCase() + ".mp3" };
  });
  ["bear", "bee", "bird", "bunny", "butterfly", "cow", "chicken", "duck", "dolphin", "elephant", "frog", "fox", "giraffe", "horse", "koala",
   "ladybug", "monkey", "mouse", "owl", "octopus", "panda", "penguin", "sheep", "snake", "snail", "tiger", "turtle", "whale"].forEach(function (a) {
    PHOTOS.push({ id: "a-" + a, animal: a, init: a.charAt(0).toUpperCase(), word: a, img: R + "img/" + a + ".jpg?v=1", audio: R + "letters/audio/startsw/" + a + ".mp3" });
  });
  var SAME = { C: "K", K: "C" };   // same first sound: never use as distractors for each other
  var starts = P.choiceMode({
    id: "starts", label: "Starts with", icon: P.ICON.starts, title: "Which one starts with ...?", pool: letters, maxChoices: 4,
    prompt: function (t) {
      return { html: "Which one starts with <em>" + t.L + "</em>?", audio: [R + "letters/audio/starts/" + lc(t) + ".mp3"],
               visual: function (el) { P.mk("div", "pm-bigletter", el, t.L + "<small>" + lc(t) + "</small>"); } };
    },
    makeRound: function (t, n) {
      var right = P.rnd(PHOTOS.filter(function (p) { return p.init === t.L; }));
      var used = {}; used[t.L] = 1; if (SAME[t.L]) used[SAME[t.L]] = 1;
      var d = [];
      P.shuffle(PHOTOS.slice()).forEach(function (p) {
        if (d.length < n - 1 && !used[p.init]) { used[p.init] = 1; d.push(p); }
      });
      return { choices: P.shuffle([right].concat(d)), answer: right };
    },
    card: function (it, inner) { inner.innerHTML = '<img class="pm-ph" alt="" draggable="false" src="' + it.img + '">'; },
    correctAudio: function (t, ans) { return [ans.audio]; },
    sticker: function (t, ans) { return ans.animal ? "a:" + ans.animal : null; },
    ink: function () { inkI = (inkI + 1 + Math.floor(Math.random() * (INKS.length - 1))) % INKS.length; return INKS[inkI]; },
    extraHead: function (head, getRound) {
      var h = P.mk("button", "pm-hintbtn", head, P.ICON.ear);
      h.type = "button"; h.title = "Letter sound hint"; h.setAttribute("aria-label", "Letter sound hint");
      var last = 0;
      h.addEventListener("click", function (e) {
        e.stopPropagation();
        var n = Date.now(); if (n - last < 500) return; last = n;
        var r = getRound(); if (r) P.playSeq([R + "letters/audio/hint/" + lc(r.target) + ".mp3"], null, 0);
      });
    }
  });
  P.init({
    game: "letters", soundKey: "lfc-sound", rightButtons: 2,
    learnStop: function () { if (window.__learnStop) window.__learnStop(); },
    modes: [{ id: "learn", label: "Learn", icon: P.ICON.learn, title: "Learn: flash cards + tracing" }, find, starts]
  });
})();
