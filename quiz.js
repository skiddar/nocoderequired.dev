/* No Code Required — Team Health Check
   Vanilla, no dependencies, fully client-side. Each option scores 2 / 1 / 0
   (strong / partial / blind spot). Each question maps to one chapter (and the
   Part it lives in) so results can show a per-area breakdown, route the reader
   to the chapters that help most, and hand them a concrete quick win. */

(function () {
  "use strict";

  // Parts of the book (for the results breakdown)
  var PARTS = {
    1: { name: "Seeing Magic", sub: "Understanding your team" },
    2: { name: "Channeling Magic", sub: "Directing the work" },
    3: { name: "Amplifying Magic", sub: "Multiplying the team" }
  };

  var QUESTIONS = [
    {
      stem: "An engineer tells you a feature will take “two weeks.” What do you do?",
      chapter: { n: 8, part: 2, title: "Realistic Expectations",
        focus: "telling when an estimate is a guess, and what to ask before you trust a date.",
        tip: "On the next estimate you get, ask one question: “What would have to go right for this to land on time?”" },
      options: [
        { text: "Put the two-week date on the roadmap and move on.", points: 0 },
        { text: "Quietly pad it, because estimates always slip.", points: 1 },
        { text: "Ask them to walk you through what could make it take longer.", points: 2 }
      ]
    },
    {
      stem: "You disagree with a technical recommendation but can’t fully explain why. You…",
      chapter: { n: 5, part: 2, title: "Establishing Trust & Respect",
        focus: "disagreeing without overruling, and keeping engineers bringing you the hard calls.",
        tip: "Next time you disagree, say “Walk me through the trade-offs” before you decide anything." },
      options: [
        { text: "Overrule it — it’s your call.", points: 0 },
        { text: "Go along with it quietly to avoid a fight.", points: 1 },
        { text: "Ask them to walk you through the trade-offs until it makes sense.", points: 2 }
      ]
    },
    {
      stem: "When something goes wrong on your team, you usually find out…",
      chapter: { n: 1, part: 1, title: "Your Team’s Culture",
        focus: "building a culture where bad news travels to you early, not late.",
        tip: "Ask your team this week: “What’s something you’ve been hesitant to tell me?” — then just listen." },
      options: [
        { text: "Late — once it’s already a real problem.", points: 0 },
        { text: "At the next status meeting.", points: 1 },
        { text: "Early — people raise problems without fear.", points: 2 }
      ]
    },
    {
      stem: "How often is the team waiting on a decision from you?",
      chapter: { n: 9, part: 3, title: "Better and Faster Decisions",
        focus: "spotting when you’ve become the bottleneck, and deciding faster without deciding worse.",
        tip: "Write down three decision types your team can make without you — and tell them today." },
      options: [
        { text: "Often — things pile up waiting on me.", points: 0 },
        { text: "Sometimes, on the bigger calls.", points: 1 },
        { text: "Rarely — they know what they’re empowered to decide.", points: 2 }
      ]
    },
    {
      stem: "A new capability is needed. How do you decide whether to build, buy, or outsource it?",
      chapter: { n: 7, part: 2, title: "Outsourcing Development",
        focus: "deciding what’s core to build in-house versus buy or outsource — and the true cost of each.",
        tip: "For the next build/buy call, ask: “Is this core to who we are, or just necessary?”" },
      options: [
        { text: "Build it — we build everything ourselves.", points: 0 },
        { text: "Whatever’s cheapest up front.", points: 1 },
        { text: "Weigh whether it’s core to us and what it costs to own over time.", points: 2 }
      ]
    },
    {
      stem: "When you hand work to the team, you give them…",
      chapter: { n: 6, part: 2, title: "Directing Your Team",
        focus: "directing through problems and outcomes instead of dictating solutions.",
        tip: "On your next handoff, give the problem and the why — and let them design the how." },
      options: [
        { text: "A solution and a deadline.", points: 0 },
        { text: "A detailed spec of exactly what to build.", points: 1 },
        { text: "The problem and the why — and let them design the how.", points: 2 }
      ]
    },
    {
      stem: "Do you know whether your team has the right mix of skills for what’s ahead?",
      chapter: { n: 2, part: 1, title: "Your Team’s Composition",
        focus: "reading your team’s real shape — where it’s strong, where it’s thin.",
        tip: "List your team’s roles and one risk if each person left. The gaps will jump out." },
      options: [
        { text: "Not really — I can’t evaluate that.", points: 0 },
        { text: "Roughly, from the headcount.", points: 1 },
        { text: "Yes — I know where we’re strong and where we’re thin.", points: 2 }
      ]
    },
    {
      stem: "How do you know your team is actually being productive?",
      chapter: { n: 4, part: 1, title: "Your Team’s Output",
        focus: "judging real output — shipped outcomes — over activity that just looks busy.",
        tip: "Replace one “are you busy?” check-in with “what shipped that mattered?”" },
      options: [
        { text: "Hours worked and how busy everyone looks.", points: 0 },
        { text: "Tickets closed and velocity charts.", points: 1 },
        { text: "Whether we’re shipping outcomes that matter.", points: 2 }
      ]
    },
    {
      stem: "You’re hiring an engineer whose skills you can’t technically vet. You…",
      chapter: { n: 10, part: 3, title: "Hiring Great People",
        focus: "hiring engineers well when you can’t judge the code yourself.",
        tip: "Before your next hire, line up one technical person you trust to vet candidates for you." },
      options: [
        { text: "Go with your gut from the interview.", points: 0 },
        { text: "Lean entirely on the résumé and referrals.", points: 1 },
        { text: "Use a structured process and bring in technical help you trust.", points: 2 }
      ]
    },
    {
      stem: "Your best engineer has gone quiet lately. You…",
      chapter: { n: 11, part: 3, title: "Motivating Your Team",
        focus: "noticing what actually drives — and keeps — your best people.",
        tip: "Have a no-agenda 1:1 with your quietest strong performer this week." },
      options: [
        { text: "Assume it’s fine as long as the work gets done.", points: 0 },
        { text: "Wait for the next review to check in.", points: 1 },
        { text: "Notice the change and have a real conversation.", points: 2 }
      ]
    }
  ];

  var MAX = QUESTIONS.length * 2; // 20

  // Bands, ordered HIGH -> LOW for lookup
  var BANDS = [
    { min: 16, name: "Force multiplier",
      desc: "You lead engineers well without writing a line of code. You ask the right questions, push decisions to the right people, and judge work by what ships. The book is for sharpening the edges — starting with the area below." },
    { min: 11, name: "Solid ground",
      desc: "Strong instincts with a few real blind spots. You’re already doing a lot right; closing the gaps below is what separates a capable manager from one engineers genuinely trust." },
    { min: 6, name: "Finding your footing",
      desc: "You can feel where the gaps are, even if you can’t always name them. That awareness is the hard part — here’s exactly where to focus first." },
    { min: 0, name: "Flying blind",
      desc: "Right now there’s a high risk of talking past your team — using the same words to mean different things. That’s fixable, and faster than you’d think. Start with the areas below." }
  ];
  // Low -> high, for the meter
  var BAND_SCALE = ["Flying blind", "Finding your footing", "Solid ground", "Force multiplier"];

  // Strong (all-2s) fallback recommendations
  var ADVANCED = [
    { n: 12, part: 3, title: "Force Multipliers",
      focus: "turning a good team into one that compounds.",
      tip: "Pick one thing only you do today, and design a way for the team to do it without you." },
    { n: 9, part: 3, title: "Better and Faster Decisions",
      focus: "keeping decision speed high as the team grows.",
      tip: "Audit last week’s decisions: which ones really needed you?" }
  ];

  // ---- State ----
  var idx = 0;
  var answers = [];
  var lastBand = null, lastTotal = 0;

  // ---- Elements ----
  var elIntro, elQ, elResults;
  var elStart, elProgressLabel, elProgressTrack, elProgressFill, elStem, elOptions, elBack;
  var elBand, elScore, elBandDesc, elMeter, elBreakdown, elFocus, elRetake, elShare;

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
    elStem.focus({ preventScroll: true });
  }

  function choose(points) {
    answers[idx] = points;
    if (idx < QUESTIONS.length - 1) { idx++; renderQuestion(); }
    else { finish(); }
  }

  function back() { if (idx > 0) { idx--; renderQuestion(); } }

  function renderMeter(band) {
    elMeter.innerHTML = "";
    BAND_SCALE.forEach(function (name) {
      var seg = document.createElement("div");
      seg.className = "quiz-meter__seg" + (name === band.name ? " is-active" : "");
      var lbl = document.createElement("span");
      lbl.className = "quiz-meter__label";
      lbl.textContent = name;
      seg.appendChild(lbl);
      elMeter.appendChild(seg);
    });
  }

  function renderBreakdown() {
    elBreakdown.innerHTML = "";
    [1, 2, 3].forEach(function (p) {
      var got = 0, max = 0;
      QUESTIONS.forEach(function (q, i) {
        if (q.chapter.part === p) { got += (answers[i] || 0); max += 2; }
      });
      var pct = max ? Math.round(got / max * 100) : 0;
      var word = pct >= 80 ? "Strong" : pct >= 45 ? "Mixed" : "Building";

      var row = document.createElement("div");
      row.className = "quiz-bd__row";
      var head = document.createElement("div");
      head.className = "quiz-bd__head";
      head.innerHTML = '<span class="quiz-bd__name">Part ' + (p === 1 ? "I" : p === 2 ? "II" : "III") +
        " · " + PARTS[p].name + '</span><span class="quiz-bd__word quiz-bd__word--' +
        word.toLowerCase() + '">' + word + "</span>";
      var track = document.createElement("div");
      track.className = "quiz-bd__track";
      var fill = document.createElement("div");
      fill.className = "quiz-bd__fill";
      fill.style.width = pct + "%";
      track.appendChild(fill);
      var sub = document.createElement("p");
      sub.className = "quiz-bd__sub";
      sub.textContent = PARTS[p].sub;
      row.appendChild(head); row.appendChild(track); row.appendChild(sub);
      elBreakdown.appendChild(row);
    });
  }

  function finish() {
    var total = answers.reduce(function (a, b) { return a + (b || 0); }, 0);
    var band = bandFor(total);
    lastBand = band; lastTotal = total;

    // weakest areas: questions scored < 2, lowest first, distinct chapters, up to 3
    var ranked = QUESTIONS.map(function (q, i) { return { ch: q.chapter, pts: answers[i] }; })
      .filter(function (r) { return r.pts < 2; })
      .sort(function (a, b) { return a.pts - b.pts; });

    var seen = {}, focus = [];
    for (var i = 0; i < ranked.length && focus.length < 3; i++) {
      var ch = ranked[i].ch;
      if (!seen[ch.n]) { seen[ch.n] = true; focus.push(ch); }
    }
    if (focus.length === 0) focus = ADVANCED; // all-2s

    elScore.textContent = total + " / " + MAX;
    elBand.textContent = band.name;
    elBandDesc.textContent = band.desc;
    renderMeter(band);
    renderBreakdown();

    elFocus.innerHTML = "";
    focus.forEach(function (ch) {
      var li = document.createElement("li");
      var num = document.createElement("span");
      num.className = "quiz-focus__ch"; num.textContent = "Chapter " + ch.n;
      var t = document.createElement("span");
      t.className = "quiz-focus__title"; t.textContent = ch.title;
      var why = document.createElement("p");
      why.className = "quiz-focus__why"; why.textContent = "For " + ch.focus;
      var tip = document.createElement("p");
      tip.className = "quiz-focus__tip";
      var lab = document.createElement("strong");
      lab.textContent = "Try this: ";
      tip.appendChild(lab);
      tip.appendChild(document.createTextNode(ch.tip));
      li.appendChild(num); li.appendChild(t); li.appendChild(why); li.appendChild(tip);
      elFocus.appendChild(li);
    });

    hide(elQ); show(elResults);
    elResults.scrollIntoView({ behavior: "smooth", block: "start" });
    elBand.focus({ preventScroll: true });
  }

  function share() {
    var url = "https://nocoderequired.dev/quiz";
    var text = "I scored “" + (lastBand ? lastBand.name : "") +
      "” on the Non-Technical Manager’s Team Health Check.";
    if (navigator.share) {
      navigator.share({ title: "Team Health Check", text: text, url: url }).catch(function () {});
      return;
    }
    var full = text + " " + url;
    var done = function () {
      var orig = elShare.textContent;
      elShare.textContent = "Copied ✓";
      setTimeout(function () { elShare.textContent = orig; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(full).then(done, function () { window.prompt("Copy your result:", full); });
    } else { window.prompt("Copy your result:", full); }
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
    elMeter = $("q-meter"); elBreakdown = $("q-breakdown");
    elFocus = $("q-focus"); elRetake = $("q-retake"); elShare = $("q-share");
    if (!elIntro) return;
    elStart.addEventListener("click", start);
    elBack.addEventListener("click", back);
    elRetake.addEventListener("click", start);
    if (elShare) elShare.addEventListener("click", share);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
