/* No Code Required — Team Health Check (forced-choice self-assessment)
   Each question pits two reasonable manager behaviors against each other, so
   there's no obviously "right" answer to game (the recognized way to reduce
   social-desirability bias). The better-per-the-book option alternates sides.
   Answers persist in localStorage so going back / reloading never wipes them.
   Fully client-side, no dependencies, no network. */

(function () {
  "use strict";

  var STORE = "ncr-healthcheck-v2";

  var PARTS = {
    1: { roman: "I", name: "Seeing Magic", sub: "Understanding your team" },
    2: { roman: "II", name: "Channeling Magic", sub: "Directing the work" },
    3: { roman: "III", name: "Amplifying Magic", sub: "Multiplying the team" }
  };

  var CHAPTERS = {
    1:  { part: 1, title: "Your Team’s Culture",          focus: "building a culture where bad news reaches you early, not late.",                       tip: "Ask your team this week: “What’s something you’ve been hesitant to tell me?” — then just listen." },
    2:  { part: 1, title: "Your Team’s Composition",      focus: "reading your team’s real shape before a big push, not during it.",                     tip: "List your roles and one risk if each person left. The gaps will jump out." },
    3:  { part: 1, title: "Your Team’s Process",          focus: "finding where work stalls instead of just pushing for speed.",                          tip: "Trace one feature from idea to shipped. Mark every place it sat waiting." },
    4:  { part: 1, title: "Your Team’s Output",           focus: "judging shipped outcomes over how busy the team looks.",                                tip: "Replace one “are you busy?” check-in with “what shipped that mattered?”" },
    5:  { part: 2, title: "Establishing Trust & Respect", focus: "understanding a decision before you override it.",                                       tip: "Next time you disagree, say “Walk me through the trade-offs” before you decide anything." },
    6:  { part: 2, title: "Directing Your Team",          focus: "directing through outcomes instead of dictating solutions.",                            tip: "On your next handoff, give the problem and the why — and let them design the how." },
    7:  { part: 2, title: "Outsourcing Development",      focus: "deciding what’s truly core before you build, buy, or outsource.",                        tip: "For the next build/buy call, ask: “Is this core to who we are, or just necessary?”" },
    8:  { part: 2, title: "Realistic Expectations",       focus: "probing an estimate instead of just padding it.",                                        tip: "On the next estimate, ask: “What would have to go right for this to land on time?”" },
    9:  { part: 3, title: "Better and Faster Decisions",  focus: "spotting when you’ve become the bottleneck for your own team.",                          tip: "Write down three decision types your team can make without you — and tell them today." },
    10: { part: 3, title: "Hiring Great People",          focus: "hiring engineers well when you can’t judge the code yourself.",                          tip: "Before your next hire, line up one technical person you trust to vet candidates." },
    11: { part: 3, title: "Motivating Your Team",         focus: "reading the signals your best people send before they leave.",                          tip: "Have a no-agenda 1:1 with your quietest strong performer this week." },
    12: { part: 3, title: "Force Multipliers",            focus: "designing yourself out of the work only you can do.",                                    tip: "Pick one thing only you can do today, and design a way for the team to do it without you." }
  };

  // 12 forced-choice items. Both options are defensible; `good` (the book's
  // better default) alternates sides so you can't just pick one column.
  var ITEMS = [
    { ch: 1,  good: "B", q: "You want a real read on how your team is doing.",
      A: "Lean on status reports and dashboards so nothing slips by.",
      B: "Invest in relationships where people bring you problems early." },
    { ch: 2,  good: "A", q: "A major new initiative just landed on your team.",
      A: "First gauge whether the team you have can do it — and where it can’t.",
      B: "Get moving now and add people if you hit a wall." },
    { ch: 3,  good: "B", q: "Delivery has felt slow lately.",
      A: "Press the team to pick up the pace.",
      B: "Find where the work is actually getting stuck before pushing." },
    { ch: 4,  good: "A", q: "You’re deciding whether the last month went well.",
      A: "Look at whether what shipped actually mattered.",
      B: "Look at how much got done and how hard people worked." },

    { ch: 5,  good: "B", q: "You think an engineer’s technical call is wrong, but can’t say why.",
      A: "Trust your experience and steer them another way — you’re accountable.",
      B: "Have them walk you through it until the trade-offs are clear." },
    { ch: 6,  good: "A", q: "You’re handing off an important piece of work.",
      A: "Give the problem and the outcome you need, and let them design the how.",
      B: "Give a clear spec of what to build and how to build it." },
    { ch: 7,  good: "A", q: "You need a capability you don’t have in-house.",
      A: "Ask first whether it’s core to you before you build, buy, or outsource.",
      B: "Build it yourselves so you fully own and control it." },
    { ch: 8,  good: "B", q: "An engineer estimates a feature at “two weeks.”",
      A: "Add a buffer and commit to a date you’re confident in.",
      B: "Ask what would have to go right for two weeks to hold." },

    { ch: 9,  good: "B", q: "Most decisions on your team flow through you.",
      A: "That’s appropriate — you’re responsible for the outcomes.",
      B: "That’s a risk — you’d rather push more decisions down to the team." },
    { ch: 10, good: "A", q: "You’re hiring an engineer whose skills you can’t judge yourself.",
      A: "Bring in technical help you trust to assess the craft.",
      B: "Trust your read on people and their track record." },
    { ch: 11, good: "A", q: "One of your strongest people has gone quiet.",
      A: "Check in directly — quiet is usually a signal.",
      B: "Give them space — strong people don’t need hovering." },
    { ch: 12, good: "B", q: "There’s something only you do really well.",
      A: "Keep owning it — that’s where you add the most value.",
      B: "Build a way for the team to do it without you." }
  ];

  var N = ITEMS.length;  // 12

  var BANDS = [
    { min: 11, name: "Force multiplier",
      desc: "Your instincts line up with how the strongest non-technical leaders run engineering teams — empower, probe, and design yourself out of the work. The weakest area below is where the last bit of leverage is." },
    { min: 8, name: "Solid ground",
      desc: "You lead well more often than not, with a few real default settings worth examining. The areas below are where your instinct diverges most from what tends to work." },
    { min: 5, name: "Finding your footing",
      desc: "Your instincts cut both ways — some help you, some quietly work against you. The areas below are where the leverage is concentrated." },
    { min: 0, name: "Flying blind",
      desc: "Several of your default moves are likely working against you right now. That’s common for non-technical managers and very fixable — start with the areas below." }
  ];
  var BAND_SCALE = ["Flying blind", "Finding your footing", "Solid ground", "Force multiplier"];
  var ADVANCED = [9, 12]; // if they ace it, point at the scaling chapters

  // ---- State ----
  var answers = {};   // index -> "A" | "B"
  var lastBand = null;

  // ---- Elements ----
  var elIntro, elForm, elItems, elError, elCount, elStart;
  var elResults, elBand, elScore, elBandDesc, elMeter, elBreakdown, elFocus, elShare, elEdit, elRestart;

  function $(id) { return document.getElementById(id); }
  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }
  function bandFor(t) { for (var i = 0; i < BANDS.length; i++) if (t >= BANDS[i].min) return BANDS[i]; return BANDS[BANDS.length - 1]; }
  function correct(i) { return answers[i] === ITEMS[i].good ? 1 : 0; }

  function save() { try { localStorage.setItem(STORE, JSON.stringify(answers)); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function clearStore() { try { localStorage.removeItem(STORE); } catch (e) {} }

  // ---- Build the form ----
  function renderForm() {
    elItems.innerHTML = "";
    [1, 2, 3].forEach(function (p) {
      var h = document.createElement("h2");
      h.className = "quiz-part-head";
      h.innerHTML = "Part " + PARTS[p].roman + " <span>· " + PARTS[p].sub + "</span>";
      elItems.appendChild(h);

      ITEMS.forEach(function (it, i) {
        if (CHAPTERS[it.ch].part !== p) return;
        var fs = document.createElement("fieldset");
        fs.className = "quiz-item"; fs.id = "item-" + i;
        var lg = document.createElement("legend");
        lg.className = "quiz-item__stem"; lg.textContent = it.q;
        fs.appendChild(lg);

        var choices = document.createElement("div");
        choices.className = "quiz-choices";
        ["A", "B"].forEach(function (letter) {
          var lab = document.createElement("label");
          lab.className = "quiz-choice";
          var inp = document.createElement("input");
          inp.type = "radio"; inp.name = "q" + i; inp.value = letter;
          if (answers[i] === letter) inp.checked = true;
          inp.addEventListener("change", function () {
            answers[i] = letter; fs.classList.remove("is-missing"); save(); updateCount();
          });
          var span = document.createElement("span");
          span.textContent = it[letter];
          lab.appendChild(inp); lab.appendChild(span);
          choices.appendChild(lab);
        });
        fs.appendChild(choices);
        elItems.appendChild(fs);
      });
    });
    updateCount();
  }

  function updateCount() {
    var n = Object.keys(answers).length;
    elCount.textContent = "Answered " + n + " of " + N;
  }

  function submit(e) {
    e.preventDefault();
    var missing = [];
    for (var i = 0; i < N; i++) {
      var fs = $("item-" + i);
      if (answers[i] === undefined) { missing.push(i); fs.classList.add("is-missing"); }
      else fs.classList.remove("is-missing");
    }
    if (missing.length) {
      elError.textContent = "Please answer every question — " + missing.length + " still " +
        (missing.length === 1 ? "needs" : "need") + " a choice.";
      show(elError);
      var first = $("item-" + missing[0]);
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      var r = first.querySelector("input[type=radio]");
      if (r) r.focus({ preventScroll: true });
      return;
    }
    hide(elError);
    finish();
  }

  // ---- Results ----
  function renderMeter(band) {
    elMeter.innerHTML = "";
    BAND_SCALE.forEach(function (name) {
      var seg = document.createElement("div");
      seg.className = "quiz-meter__seg" + (name === band.name ? " is-active" : "");
      var lbl = document.createElement("span");
      lbl.className = "quiz-meter__label"; lbl.textContent = name;
      seg.appendChild(lbl); elMeter.appendChild(seg);
    });
  }

  function renderBreakdown() {
    elBreakdown.innerHTML = "";
    [1, 2, 3].forEach(function (p) {
      var got = 0, max = 0;
      ITEMS.forEach(function (it, i) { if (CHAPTERS[it.ch].part === p) { got += correct(i); max += 1; } });
      var pct = max ? Math.round(got / max * 100) : 0;
      var word = pct >= 75 ? "Strong" : pct >= 50 ? "Mixed" : "Building";
      var row = document.createElement("div");
      row.className = "quiz-bd__row";
      var head = document.createElement("div");
      head.className = "quiz-bd__head";
      head.innerHTML = '<span class="quiz-bd__name">Part ' + PARTS[p].roman + " · " + PARTS[p].name +
        '</span><span class="quiz-bd__word quiz-bd__word--' + word.toLowerCase() + '">' + word + " · " + got + "/" + max + "</span>";
      var track = document.createElement("div");
      track.className = "quiz-bd__track";
      var fill = document.createElement("div");
      fill.className = "quiz-bd__fill"; fill.style.width = pct + "%";
      track.appendChild(fill);
      var sub = document.createElement("p");
      sub.className = "quiz-bd__sub"; sub.textContent = PARTS[p].sub;
      row.appendChild(head); row.appendChild(track); row.appendChild(sub);
      elBreakdown.appendChild(row);
    });
  }

  function focusChapters() {
    var missed = [];
    for (var i = 0; i < N; i++) if (!correct(i)) missed.push(ITEMS[i].ch);
    if (!missed.length) return ADVANCED.slice(0, 2);
    return missed.slice(0, 3);
  }

  function finish() {
    var total = 0;
    for (var i = 0; i < N; i++) total += correct(i);
    var band = bandFor(total);
    lastBand = band;

    elScore.textContent = total + " / " + N;
    elBand.textContent = band.name;
    elBandDesc.textContent = band.desc;
    renderMeter(band);
    renderBreakdown();

    elFocus.innerHTML = "";
    focusChapters().forEach(function (n) {
      var ch = CHAPTERS[n];
      var li = document.createElement("li");
      var num = document.createElement("span");
      num.className = "quiz-focus__ch"; num.textContent = "Chapter " + n;
      var t = document.createElement("span");
      t.className = "quiz-focus__title"; t.textContent = ch.title;
      var why = document.createElement("p");
      why.className = "quiz-focus__why"; why.textContent = "For " + ch.focus;
      var tip = document.createElement("p");
      tip.className = "quiz-focus__tip";
      var lab = document.createElement("strong"); lab.textContent = "Try this: ";
      tip.appendChild(lab); tip.appendChild(document.createTextNode(ch.tip));
      li.appendChild(num); li.appendChild(t); li.appendChild(why); li.appendChild(tip);
      elFocus.appendChild(li);
    });

    hide(elForm); hide(elIntro); show(elResults);
    elResults.scrollIntoView({ behavior: "smooth", block: "start" });
    elBand.focus({ preventScroll: true });
  }

  function share() {
    var url = "https://nocoderequired.dev/quiz";
    var text = "I scored “" + (lastBand ? lastBand.name : "") + "” on the Non-Technical Manager’s Team Health Check.";
    if (navigator.share) { navigator.share({ title: "Team Health Check", text: text, url: url }).catch(function () {}); return; }
    var full = text + " " + url;
    var done = function () { var o = elShare.textContent; elShare.textContent = "Copied ✓"; setTimeout(function () { elShare.textContent = o; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(full).then(done, function () { window.prompt("Copy your result:", full); });
    else window.prompt("Copy your result:", full);
  }

  function begin() {
    hide(elIntro); hide(elResults); show(elForm);
    elForm.scrollIntoView({ behavior: "smooth", block: "start" });
    var first = elItems.querySelector("input[type=radio]");
    if (first) first.focus({ preventScroll: true });
  }

  function editAnswers() {           // back to the form WITHOUT clearing
    hide(elResults); show(elForm);
    elForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function restart() {               // clear everything
    answers = {}; clearStore(); elForm.reset();
    for (var i = 0; i < N; i++) { var fs = $("item-" + i); if (fs) fs.classList.remove("is-missing"); }
    hide(elError); updateCount();
    hide(elResults); show(elForm);
    elForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function init() {
    elIntro = $("q-intro"); elForm = $("q-form"); elItems = $("q-items");
    elError = $("q-error"); elCount = $("q-count"); elStart = $("q-start");
    elResults = $("q-results"); elBand = $("q-band"); elScore = $("q-score");
    elBandDesc = $("q-band-desc"); elMeter = $("q-meter"); elBreakdown = $("q-breakdown");
    elFocus = $("q-focus"); elShare = $("q-share"); elEdit = $("q-edit"); elRestart = $("q-restart");
    if (!elIntro || !elForm) return;
    answers = load();              // restore any saved progress
    renderForm();
    elStart.addEventListener("click", begin);
    elForm.addEventListener("submit", submit);
    if (elShare) elShare.addEventListener("click", share);
    if (elEdit) elEdit.addEventListener("click", editAnswers);
    if (elRestart) elRestart.addEventListener("click", restart);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
