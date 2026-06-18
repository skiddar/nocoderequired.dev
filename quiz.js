/* No Code Required — Team Health Check (serious self-assessment)
   Frequency self-report (Never…Always) with reverse-scored items, modeled on
   validated instruments (MindTools, MLQ) to reduce social-desirability bias.
   Fully client-side, no dependencies, no network. */

(function () {
  "use strict";

  var SCALE = ["Never", "Rarely", "Sometimes", "Often", "Always"]; // raw 0..4
  var PER_ITEM_MAX = 4;

  var PARTS = {
    1: { roman: "I", name: "Seeing Magic", sub: "Understanding your team" },
    2: { roman: "II", name: "Channeling Magic", sub: "Directing the work" },
    3: { roman: "III", name: "Amplifying Magic", sub: "Multiplying the team" }
  };

  // Chapters (for the breakdown + recommendations + quick wins)
  var CHAPTERS = {
    1:  { part: 1, title: "Your Team’s Culture",        focus: "building a culture where bad news travels to you early, not late.",                    tip: "Ask your team this week: “What’s something you’ve been hesitant to tell me?” — then just listen." },
    2:  { part: 1, title: "Your Team’s Composition",    focus: "reading your team’s real shape — where it’s strong, where it’s thin.",                 tip: "List your roles and one risk if each person left. The gaps will jump out." },
    3:  { part: 1, title: "Your Team’s Process",        focus: "seeing how work really flows, and where it quietly stalls.",                           tip: "Trace one feature from idea to shipped. Mark every place it sat waiting." },
    4:  { part: 1, title: "Your Team’s Output",         focus: "judging real output — shipped outcomes — over activity that just looks busy.",         tip: "Replace one “are you busy?” check-in with “what shipped that mattered?”" },
    5:  { part: 2, title: "Establishing Trust & Respect", focus: "disagreeing without overruling, and keeping engineers bringing you the hard calls.",  tip: "Next time you disagree, say “Walk me through the trade-offs” before you decide anything." },
    6:  { part: 2, title: "Directing Your Team",        focus: "directing through problems and outcomes instead of dictating solutions.",             tip: "On your next handoff, give the problem and the why — and let them design the how." },
    7:  { part: 2, title: "Outsourcing Development",    focus: "deciding what’s core to build in-house versus buy or outsource — and the true cost.",  tip: "For the next build/buy call, ask: “Is this core to who we are, or just necessary?”" },
    8:  { part: 2, title: "Realistic Expectations",     focus: "telling when an estimate is a guess, and what to ask before you trust a date.",        tip: "On the next estimate, ask: “What would have to go right for this to land on time?”" },
    9:  { part: 3, title: "Better and Faster Decisions", focus: "spotting when you’ve become the bottleneck, and deciding faster without deciding worse.", tip: "Write down three decision types your team can make without you — and tell them today." },
    10: { part: 3, title: "Hiring Great People",        focus: "hiring engineers well when you can’t judge the code yourself.",                        tip: "Before your next hire, line up one technical person you trust to vet candidates for you." },
    11: { part: 3, title: "Motivating Your Team",       focus: "noticing what actually drives — and keeps — your best people.",                        tip: "Have a no-agenda 1:1 with your quietest strong performer this week." },
    12: { part: 3, title: "Force Multipliers",          focus: "turning a good team into one that compounds, instead of one that depends on you.",     tip: "Pick one thing only you can do today, and design a way for the team to do it without you." }
  };

  // 18 behavioral statements. reverse:true means frequent = worse (score = 4 - raw).
  var ITEMS = [
    { ch: 1,  reverse: false, text: "When something goes wrong, my team tells me early — before it becomes a crisis." },
    { ch: 1,  reverse: true,  text: "People on my team hold back problems until I ask directly." },
    { ch: 2,  reverse: false, text: "I can say specifically where my team is strong and where it’s dangerously thin." },
    { ch: 3,  reverse: false, text: "I understand how work actually flows on my team, from idea to shipped." },
    { ch: 4,  reverse: true,  text: "I gauge how productive my team is by how busy people seem." },
    { ch: 4,  reverse: false, text: "I judge the team by the outcomes we ship, not the activity we generate." },

    { ch: 5,  reverse: true,  text: "I overrule technical recommendations that feel wrong, even when I can’t explain why." },
    { ch: 5,  reverse: false, text: "When I disagree with my engineers, I have them walk me through the trade-offs before I decide." },
    { ch: 6,  reverse: false, text: "When I hand off work, I give the problem and the why, and let the team design the how." },
    { ch: 6,  reverse: true,  text: "I specify exactly how things should be built rather than the outcome I need." },
    { ch: 7,  reverse: false, text: "For build-vs-buy-vs-outsource calls, I weigh what’s core to us against the long-term cost of owning it." },
    { ch: 8,  reverse: true,  text: "I commit to deadlines before asking the team how long the work will really take." },

    { ch: 9,  reverse: true,  text: "Decisions pile up waiting on me." },
    { ch: 9,  reverse: false, text: "My team knows which decisions they can make without checking with me." },
    { ch: 10, reverse: false, text: "When hiring engineers I can’t technically evaluate, I use a structured process and bring in technical help I trust." },
    { ch: 11, reverse: false, text: "I notice when a strong performer’s energy changes, and I follow up." },
    { ch: 11, reverse: true,  text: "I assume people are fine as long as the work keeps getting done." },
    { ch: 12, reverse: false, text: "I deliberately build ways for the team to do things that currently depend on me." }
  ];

  var N = ITEMS.length;          // 18
  var MAX = N * PER_ITEM_MAX;    // 72

  // Bands, HIGH -> LOW. Thresholds are deliberately demanding.
  var BANDS = [
    { min: 61, name: "Force multiplier",
      desc: "Rare territory. You consistently do the things that let a team you can’t out-code do its best work. Use the weakest area below to find the last few points of leverage." },
    { min: 49, name: "Solid ground",
      desc: "You lead well more often than not, with specific, real gaps. Closing the lowest area below is what separates a capable manager from one engineers fully trust." },
    { min: 36, name: "Finding your footing",
      desc: "The instincts are forming but inconsistent — some habits help you, some quietly work against you. The areas below are where the leverage is." },
    { min: 0, name: "Flying blind",
      desc: "Right now you’re likely talking past your team more than you realize. That’s common for non-technical managers, and it’s fixable faster than you’d think. Start with the areas below." }
  ];
  var BAND_SCALE = ["Flying blind", "Finding your footing", "Solid ground", "Force multiplier"];

  // ---- State ----
  var answers = {};      // index -> raw 0..4
  var lastBand = null;

  // ---- Elements ----
  var elIntro, elForm, elItems, elError, elCount;
  var elStart, elResults, elBand, elScore, elBandDesc, elMeter, elBreakdown, elFocus, elRetake, elShare;

  function $(id) { return document.getElementById(id); }
  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }
  function bandFor(t) { for (var i = 0; i < BANDS.length; i++) if (t >= BANDS[i].min) return BANDS[i]; return BANDS[BANDS.length - 1]; }
  function scoreOf(i) { var raw = answers[i]; return ITEMS[i].reverse ? (PER_ITEM_MAX - raw) : raw; }

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
        fs.className = "quiz-item";
        fs.id = "item-" + i;
        var lg = document.createElement("legend");
        lg.className = "quiz-item__stem";
        lg.textContent = it.text;
        fs.appendChild(lg);

        var scale = document.createElement("div");
        scale.className = "quiz-scale";
        SCALE.forEach(function (word, v) {
          var lab = document.createElement("label");
          lab.className = "quiz-scale__opt";
          var inp = document.createElement("input");
          inp.type = "radio"; inp.name = "q" + i; inp.value = String(v);
          inp.addEventListener("change", function () {
            answers[i] = v;
            fs.classList.remove("is-missing");
            updateCount();
          });
          var span = document.createElement("span");
          span.textContent = word;
          lab.appendChild(inp); lab.appendChild(span);
          scale.appendChild(lab);
        });
        fs.appendChild(scale);
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
      elError.textContent = "Please answer every statement — " + missing.length + " still " +
        (missing.length === 1 ? "needs" : "need") + " a response.";
      show(elError);
      var firstMissing = $("item-" + missing[0]);
      firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
      var r = firstMissing.querySelector("input[type=radio]");
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
      ITEMS.forEach(function (it, i) { if (CHAPTERS[it.ch].part === p) { got += scoreOf(i); max += PER_ITEM_MAX; } });
      var pct = max ? Math.round(got / max * 100) : 0;
      var word = pct >= 80 ? "Strong" : pct >= 50 ? "Mixed" : "Building";
      var row = document.createElement("div");
      row.className = "quiz-bd__row";
      var head = document.createElement("div");
      head.className = "quiz-bd__head";
      head.innerHTML = '<span class="quiz-bd__name">Part ' + PARTS[p].roman + " · " + PARTS[p].name +
        '</span><span class="quiz-bd__word quiz-bd__word--' + word.toLowerCase() + '">' + word + " · " + pct + "%</span>";
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

  function weakestChapters() {
    var got = {}, max = {};
    ITEMS.forEach(function (it, i) {
      got[it.ch] = (got[it.ch] || 0) + scoreOf(i);
      max[it.ch] = (max[it.ch] || 0) + PER_ITEM_MAX;
    });
    return Object.keys(got)
      .map(function (n) { return { n: +n, pct: got[n] / max[n] }; })
      .sort(function (a, b) { return a.pct - b.pct; })
      .slice(0, 3);
  }

  function finish() {
    var total = 0;
    for (var i = 0; i < N; i++) total += scoreOf(i);
    var band = bandFor(total);
    lastBand = band;

    elScore.textContent = total + " / " + MAX;
    elBand.textContent = band.name;
    elBandDesc.textContent = band.desc;
    renderMeter(band);
    renderBreakdown();

    elFocus.innerHTML = "";
    weakestChapters().forEach(function (w) {
      var ch = CHAPTERS[w.n];
      var li = document.createElement("li");
      var num = document.createElement("span");
      num.className = "quiz-focus__ch"; num.textContent = "Chapter " + w.n;
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
    // move focus into the form (the Begin button is now hidden, so focus would
    // otherwise fall to <body> and keyboard/SR users would lose their place)
    var first = elItems.querySelector("input[type=radio]");
    if (first) first.focus({ preventScroll: true });
  }

  function retake() {
    answers = {};
    elForm.reset();
    for (var i = 0; i < N; i++) { var fs = $("item-" + i); if (fs) fs.classList.remove("is-missing"); }
    hide(elResults); hide(elError); updateCount();
    show(elForm);
    elForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function init() {
    elIntro = $("q-intro"); elForm = $("q-form"); elItems = $("q-items");
    elError = $("q-error"); elCount = $("q-count"); elStart = $("q-start");
    elResults = $("q-results"); elBand = $("q-band"); elScore = $("q-score");
    elBandDesc = $("q-band-desc"); elMeter = $("q-meter"); elBreakdown = $("q-breakdown");
    elFocus = $("q-focus"); elRetake = $("q-retake"); elShare = $("q-share");
    if (!elIntro || !elForm) return;
    renderForm();
    elStart.addEventListener("click", begin);
    elForm.addEventListener("submit", submit);
    elRetake.addEventListener("click", retake);
    if (elShare) elShare.addEventListener("click", share);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
