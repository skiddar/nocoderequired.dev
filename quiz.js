/* No Code Required — Team Health Check
   Vanilla, no dependencies, fully client-side. Each option scores 2 / 1 / 0
   (strong / partial / blind spot). Each question maps to one chapter so the
   results can route the reader to where the book helps most. */

(function () {
  "use strict";

  var QUESTIONS = [
    {
      stem: "An engineer tells you a feature will take “two weeks.” What do you do?",
      chapter: { n: 8, title: "Realistic Expectations", focus: "telling when an estimate is a guess, and what to ask before you trust a date." },
      options: [
        { text: "Put the two-week date on the roadmap and move on.", points: 0 },
        { text: "Quietly pad it, because estimates always slip.", points: 1 },
        { text: "Ask them to walk you through what could make it take longer.", points: 2 }
      ]
    },
    {
      stem: "You disagree with a technical recommendation but can’t fully explain why. You…",
      chapter: { n: 5, title: "Establishing Trust & Respect", focus: "disagreeing without overruling, and keeping engineers bringing you the hard calls." },
      options: [
        { text: "Overrule it — it’s your call.", points: 0 },
        { text: "Go along with it quietly to avoid a fight.", points: 1 },
        { text: "Ask them to walk you through the trade-offs until it makes sense.", points: 2 }
      ]
    },
    {
      stem: "When something goes wrong on your team, you usually find out…",
      chapter: { n: 1, title: "Your Team’s Culture", focus: "building a culture where bad news travels to you early, not late." },
      options: [
        { text: "Late — once it’s already a real problem.", points: 0 },
        { text: "At the next status meeting.", points: 1 },
        { text: "Early — people raise problems without fear.", points: 2 }
      ]
    },
    {
      stem: "How often is the team waiting on a decision from you?",
      chapter: { n: 9, title: "Better and Faster Decisions", focus: "spotting when you’ve become the bottleneck, and deciding faster without deciding worse." },
      options: [
        { text: "Often — things pile up waiting on me.", points: 0 },
        { text: "Sometimes, on the bigger calls.", points: 1 },
        { text: "Rarely — they know what they’re empowered to decide.", points: 2 }
      ]
    },
    {
      stem: "A new capability is needed. How do you decide whether to build, buy, or outsource it?",
      chapter: { n: 7, title: "Outsourcing Development", focus: "deciding what’s core to build in-house versus buy or outsource — and the true cost of each." },
      options: [
        { text: "Build it — we build everything ourselves.", points: 0 },
        { text: "Whatever’s cheapest up front.", points: 1 },
        { text: "Weigh whether it’s core to us and what it costs to own over time.", points: 2 }
      ]
    },
    {
      stem: "When you hand work to the team, you give them…",
      chapter: { n: 6, title: "Directing Your Team", focus: "directing through problems and outcomes instead of dictating solutions." },
      options: [
        { text: "A solution and a deadline.", points: 0 },
        { text: "A detailed spec of exactly what to build.", points: 1 },
        { text: "The problem and the why — and let them design the how.", points: 2 }
      ]
    },
    {
      stem: "Do you know whether your team has the right mix of skills for what’s ahead?",
      chapter: { n: 2, title: "Your Team’s Composition", focus: "reading your team’s real shape — where it’s strong, where it’s thin." },
      options: [
        { text: "Not really — I can’t evaluate that.", points: 0 },
        { text: "Roughly, from the headcount.", points: 1 },
        { text: "Yes — I know where we’re strong and where we’re thin.", points: 2 }
      ]
    },
    {
      stem: "How do you know your team is actually being productive?",
      chapter: { n: 4, title: "Your Team’s Output", focus: "judging real output — shipped outcomes — over activity that just looks busy." },
      options: [
        { text: "Hours worked and how busy everyone looks.", points: 0 },
        { text: "Tickets closed and velocity charts.", points: 1 },
        { text: "Whether we’re shipping outcomes that matter.", points: 2 }
      ]
    },
    {
      stem: "You’re hiring an engineer whose skills you can’t technically vet. You…",
      chapter: { n: 10, title: "Hiring Great People", focus: "hiring engineers well when you can’t judge the code yourself." },
      options: [
        { text: "Go with your gut from the interview.", points: 0 },
        { text: "Lean entirely on the résumé and referrals.", points: 1 },
        { text: "Use a structured process and bring in technical help you trust.", points: 2 }
      ]
    },
    {
      stem: "Your best engineer has gone quiet lately. You…",
      chapter: { n: 11, title: "Motivating Your Team", focus: "noticing what actually drives — and keeps — your best people." },
      options: [
        { text: "Assume it’s fine as long as the work gets done.", points: 0 },
        { text: "Wait for the next review to check in.", points: 1 },
        { text: "Notice the change and have a real conversation.", points: 2 }
      ]
    }
  ];

  var MAX = QUESTIONS.length * 2; // 20

  var BANDS = [
    { min: 16, name: "Force multiplier",
      desc: "You lead engineers well without writing a line of code. You ask the right questions, push decisions to the right people, and judge work by what ships. The book is for sharpening the edges — and for the few areas below." },
    { min: 11, name: "Solid ground",
      desc: "Strong instincts with a few real blind spots. You’re already doing a lot right; closing the gaps below is what separates a capable manager from one engineers genuinely trust." },
    { min: 6, name: "Finding your footing",
      desc: "You can feel where the gaps are, even if you can’t always name them. That awareness is the hard part — here’s exactly where to focus first." },
    { min: 0, name: "Flying blind",
      desc: "Right now there’s a high risk of talking past your team — using the same words to mean different things. That’s fixable, and faster than you’d think. Start with the chapters below." }
  ];

  // Strong (all-2s) fallback recommendations
  var ADVANCED = [
    { n: 12, title: "Force Multipliers", focus: "turning a good team into one that compounds." },
    { n: 9, title: "Better and Faster Decisions", focus: "keeping decision speed high as the team grows." }
  ];

  // ---- State ----
  var idx = 0;
  var answers = []; // answers[i] = points chosen for question i (or undefined)

  // ---- Elements ----
  var elIntro, elQ, elResults;
  var elStart, elProgressLabel, elProgressTrack, elProgressFill, elStem, elOptions, elBack;
  var elBand, elScore, elBandDesc, elFocus, elRetake;

  function $(id) { return document.getElementById(id); }
  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }

  function bandFor(total) {
    for (var i = 0; i < BANDS.length; i++) { if (total >= BANDS[i].min) return BANDS[i]; }
    return BANDS[BANDS.length - 1];
  }

  function renderQuestion() {
    var q = QUESTIONS[idx];
    elProgressLabel.textContent = "Question " + (idx + 1) + " of " + QUESTIONS.length;
    elProgressFill.style.width = (idx / QUESTIONS.length * 100) + "%";
    if (elProgressTrack) {
      elProgressTrack.setAttribute("aria-valuenow", String(idx + 1));
      elProgressTrack.setAttribute("aria-valuetext", "Question " + (idx + 1) + " of " + QUESTIONS.length);
    }
    elStem.textContent = q.stem;
    elOptions.innerHTML = "";
    q.options.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "quiz-option";
      b.textContent = opt.text;
      if (answers[idx] === opt.points) b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", function () { choose(opt.points); });
      elOptions.appendChild(b);
    });
    elBack.hidden = idx === 0;
    // move focus to the new question so keyboard/screen-reader users keep their
    // place and the question is announced (the clicked button was just destroyed)
    elStem.focus({ preventScroll: true });
  }

  function choose(points) {
    answers[idx] = points;
    if (idx < QUESTIONS.length - 1) { idx++; renderQuestion(); }
    else { finish(); }
  }

  function back() {
    if (idx > 0) { idx--; renderQuestion(); }
  }

  function finish() {
    var total = answers.reduce(function (a, b) { return a + (b || 0); }, 0);
    var band = bandFor(total);

    // weakest areas: questions scored < 2, lowest first, distinct chapters, up to 3
    var ranked = QUESTIONS.map(function (q, i) { return { q: q, pts: answers[i] }; })
      .filter(function (r) { return r.pts < 2; })
      .sort(function (a, b) { return a.pts - b.pts; });

    var seen = {}, focus = [];
    for (var i = 0; i < ranked.length && focus.length < 3; i++) {
      var ch = ranked[i].q.chapter;
      if (!seen[ch.n]) { seen[ch.n] = true; focus.push(ch); }
    }
    if (focus.length === 0) focus = ADVANCED; // all-2s

    elScore.textContent = total + " / " + MAX;
    elBand.textContent = band.name;
    elBandDesc.textContent = band.desc;

    elFocus.innerHTML = "";
    focus.forEach(function (ch) {
      var li = document.createElement("li");
      var num = document.createElement("span");
      num.className = "quiz-focus__ch";
      num.textContent = "Chapter " + ch.n;
      var t = document.createElement("span");
      t.className = "quiz-focus__title";
      t.textContent = ch.title;
      var why = document.createElement("p");
      why.className = "quiz-focus__why";
      why.textContent = "For " + ch.focus;
      li.appendChild(num); li.appendChild(t); li.appendChild(why);
      elFocus.appendChild(li);
    });

    hide(elQ); show(elResults);
    elResults.scrollIntoView({ behavior: "smooth", block: "start" });
    elBand.focus({ preventScroll: true });
  }

  function start() {
    idx = 0; answers = [];
    hide(elIntro); hide(elResults); show(elQ);
    renderQuestion();
  }

  function init() {
    elIntro = $("q-intro"); elQ = $("q-question"); elResults = $("q-results");
    elStart = $("q-start"); elProgressLabel = $("q-progress-label");
    elProgressTrack = $("q-progress-track");
    elProgressFill = $("q-progress-fill"); elStem = $("q-stem");
    elOptions = $("q-options"); elBack = $("q-back");
    elBand = $("q-band"); elScore = $("q-score"); elBandDesc = $("q-band-desc");
    elFocus = $("q-focus"); elRetake = $("q-retake");
    if (!elIntro) return;
    elStart.addEventListener("click", start);
    elBack.addEventListener("click", back);
    elRetake.addEventListener("click", start);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
