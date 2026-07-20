/* Further Reading — affiliate link toggle
   Set AFFILIATE_TAG to your Amazon Associates tag (e.g. "yourtag-20") once approved.
   When set, it appends ?tag=... to every Amazon link and shows the disclosure.
   Leave it empty until you're an Associate (no premature affiliate claims). */
(function () {
  "use strict";
  var AFFILIATE_TAG = ""; // <-- your Amazon Associates tag goes here

  if (!AFFILIATE_TAG) return;
  var links = document.querySelectorAll('a[href*="amazon."]');
  for (var i = 0; i < links.length; i++) {
    try { var u = new URL(links[i].href); u.searchParams.set("tag", AFFILIATE_TAG); links[i].href = u.toString(); }
    catch (e) {}
  }
  var d = document.getElementById("affiliate-disclosure");
  if (d) d.hidden = false;
})();
