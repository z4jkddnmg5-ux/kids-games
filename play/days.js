/* Days: "Today is ...!" opener + Learn (existing) + Find it + What comes after */
(function () {
  "use strict";
  var P = window.PLAY, R = P.root;
  var C = (window.__fc && window.__fc.cards) || [];
  var days = C.map(function (c, i) { return { id: c.id, name: c.name, label: c.name, ink: c.ink, bg: c.bg, img: R + "days/" + c.img, i: i }; });
  function dayCard(d) { return '<div class="pm-day" style="--dink:' + d.ink + '"><div class="pm-day-top">' + d.name + '</div><img alt="" draggable="false" src="' + d.img + '"></div>'; }
  function em(d) { return '<em style="color:' + d.ink + '">' + d.name + "</em>"; }
  function bg(d) { document.body.style.backgroundColor = d.bg; }
  var find = P.choiceMode({
    id: "find", label: "Find it", icon: P.ICON.find, pool: days, maxChoices: 4,
    prompt: function (t) { return { html: "Tap " + em(t) + "!", audio: [R + "days/audio/find/" + t.id + ".mp3"] }; },
    card: function (it, inner) { inner.innerHTML = dayCard(it); },
    correctAudio: function (t) { return [R + "days/audio/" + t.id + ".mp3"]; },
    confetti: function (t) { return [t.ink, t.ink, "#ffffff", "#ffbe0b"]; },
    sticker: function (t) { return P.randomSticker(t.ink); },
    onRound: function (t) { bg(t); }
  });
  var after = P.choiceMode({
    id: "after", label: "What's next", icon: P.ICON.after, title: "What comes after ...?", pool: days, maxChoices: 4,
    prompt: function (t) {
      return { html: "What comes after " + em(t) + "?", audio: [R + "days/audio/after/" + t.id + ".mp3"],
               visual: function (el) {
                 var m = P.mk("div", "pm-mini", el, dayCard(t));
                 P.mk("div", "pm-arrow", el, "\u2192");
                 P.mk("div", "pm-mini q", el, "?");
               } };
    },
    makeRound: function (t, n) {
      var ans = days[(t.i + 1) % days.length];
      var others = P.shuffle(days.filter(function (d) { return d !== t && d !== ans; }));
      return { choices: P.shuffle([ans].concat(others.slice(0, n - 1))), answer: ans };
    },
    card: function (it, inner) { inner.innerHTML = dayCard(it); },
    correctAudio: function (t, ans) { return [R + "days/audio/" + ans.id + ".mp3"]; },   // "Tuesday! Tuesday comes after Monday!"
    confetti: function (t) { return [t.ink, "#ffffff", "#ffbe0b", days[(t.i + 1) % 7].ink]; },
    sticker: function (t) { return P.randomSticker(days[(t.i + 1) % 7].ink); },
    onRound: function (t) { bg(days[(t.i + 1) % 7]); }
  });
  // "Today is Monday!" using the device date, every time the game is opened.
  function opener(done) {
    var d = days[new Date().getDay()];
    if (!d) { done(); return; }
    var played = false, card;
    var ov = P.overlay(function (el, api) {
      el.style.background = d.bg;
      el.style.backdropFilter = "none";
      P.mk("h2", "", el, "Today is " + em(d) + "!");
      card = P.mk("div", "pm-card pm-ready", el, '<div class="pm-in">' + dayCard(d) + "</div>");
      card.style.setProperty("--pm-cs", "min(62vw, 40vh)");
      card.style.cursor = "pointer";
      var go = P.mk("button", "pm-go", el, P.ICON.play); go.type = "button"; go.setAttribute("aria-label", "Play");
      go.style.width = go.style.height = "min(24vw, 15vh)";
      api.onTap = function () {
        if (played) { P.stop(); api.close(); return; }
        played = true;
        go.style.visibility = "hidden";
        card.classList.remove("pm-ready"); card.classList.add("pm-right");
        var c = P.center(card); P.confetti(c[0], c[1], [d.ink, d.ink, "#ffffff", "#ffbe0b"]);
        P.playSeq([R + "days/audio/today/" + d.id + ".mp3"], function () { setTimeout(api.close, 900); }, 1800);
      };
    }, done);
    ov.el.id = "pmToday";
  }
  P.init({
    game: "days", soundKey: "dfc-sound", rightButtons: 2,
    learnStop: function () { if (window.__learnStop) window.__learnStop(); },
    onLearn: function () { var b = document.body.style.getPropertyValue("--bg").trim(); if (b) document.body.style.backgroundColor = b; },
    opener: opener,
    modes: [{ id: "learn", label: "Learn", icon: P.ICON.learn, title: "Learn: flash cards" }, find, after]
  });
})();
