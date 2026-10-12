/* Animals: Learn (existing flash cards) + Find it + Sounds */
(function () {
  "use strict";
  var P = window.PLAY, R = P.root, V = "?v=1";
  var A = (window.__afc && window.__afc.animals) || [];
  var pool = A.map(function (a) { return { id: a.id, name: a.name, label: a.name }; });
  function photo(it, inner) { inner.innerHTML = '<img class="pm-ph" alt="" draggable="false" src="' + R + "img/" + it.id + ".jpg" + V + '">'; }
  function nameClip(t) { return [R + "audio/" + t.id + ".mp3" + V]; }
  var BG = ["#FFE08A", "#FFC8DD", "#BDE0FE", "#CDEAC0", "#FFD6A5", "#E2CFFF", "#A8E6CF", "#FDFFB6", "#FFADAD", "#9BF6FF", "#CAFFBF", "#FFC6FF"];
  var bgI = 0;
  function nextBg() { bgI = (bgI + 1 + Math.floor(Math.random() * (BG.length - 1))) % BG.length; document.body.style.backgroundColor = BG[bgI]; }
  var find = P.choiceMode({
    id: "find", label: "Find it", icon: P.ICON.find, pool: pool, maxChoices: 4,
    prompt: function (t) { return { html: "Where's the <em>" + t.name.toLowerCase() + "</em>?", audio: [R + "audio/find/" + t.id + ".mp3"] }; },
    card: photo, correctAudio: nameClip,
    sticker: function (t) { return "a:" + t.id; },
    onRound: nextBg,
    warmNext: function () { return []; }
  });
  // Sound-first: hear "Moo! Moo! Who says moo?" and pick the animal.
  var SOUNDS = { dog: "woof", cat: "meow", cow: "moo", pig: "oink", horse: "neigh", sheep: "baa", chicken: "cluck", duck: "quack",
                 mouse: "squeak", lion: "roar", elephant: "toot", monkey: "ooh ooh ah ah", frog: "ribbit", snake: "hiss",
                 bird: "tweet", owl: "hoo", bee: "buzz", bear: "grrr" };
  var spool = pool.filter(function (a) { return SOUNDS[a.id]; }).map(function (a) { return { id: a.id, name: a.name, label: a.name, w: SOUNDS[a.id] }; });
  var sound = P.choiceMode({
    id: "sound", label: "Sounds", icon: P.ICON.sound, pool: spool, maxChoices: 4,
    prompt: function (t) { return { html: "Who says <em>" + t.w + "</em>?", audio: [R + "audio/who/" + t.id + ".mp3"] }; },
    card: photo, correctAudio: nameClip,
    sticker: function (t) { return "a:" + t.id; },
    onRound: nextBg
  });
  P.init({
    game: "animals", soundKey: "afc-sound", rightButtons: 1,
    learnStop: function () { if (window.__learnStop) window.__learnStop(); },
    onLearn: function () { var b = document.body.style.getPropertyValue("--bg").trim(); if (b) document.body.style.backgroundColor = b; },
    modes: [
      { id: "learn", label: "Learn", icon: P.ICON.learn, title: "Learn: flash cards" },
      find, sound
    ]
  });
})();
