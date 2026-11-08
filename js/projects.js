/* ==========================================================================
   projects.js — project filters and the KeyStrength password demo
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Project filter ---------- */
  var chips = document.querySelectorAll("[data-filter]");
  var rows = document.querySelectorAll(".project-row");

  // show how many projects are in each category
  chips.forEach(function (chip) {
    var key = chip.getAttribute("data-filter");
    var count = key === "all" ? rows.length : Array.prototype.filter.call(rows, function (r) {
      return r.getAttribute("data-category").split(" ").indexOf(key) !== -1;
    }).length;
    var badge = document.createElement("span");
    badge.className = "count";
    badge.textContent = count;
    chip.appendChild(badge);

    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); });
      rows.forEach(function (row) {
        var cats = row.getAttribute("data-category").split(" ");
        var show = key === "all" || cats.indexOf(key) !== -1;
        row.classList.toggle("is-hidden", !show);
        if (show) row.classList.add("is-visible");
      });
    });
  });

  /* ---------- KeyStrength demo ---------- */
  var input = document.getElementById("pw-input");
  if (!input) return;
  var meter = document.getElementById("pw-meter");
  var label = document.getElementById("pw-label");
  var timeEl = document.getElementById("pw-time");
  var checks = document.querySelectorAll("#pw-checks li");

  var COMMON = ["password", "123456", "12345678", "qwerty", "abc123", "111111", "letmein", "iloveyou", "admin", "welcome", "password1", "123456789", "lagos", "nigeria", "football"];

  var rules = {
    length: function (p) { return p.length >= 12; },
    upper: function (p) { return /[A-Z]/.test(p); },
    lower: function (p) { return /[a-z]/.test(p); },
    number: function (p) { return /\d/.test(p); },
    symbol: function (p) { return /[^A-Za-z0-9]/.test(p); },
    common: function (p) {
      var lower = p.toLowerCase();
      return p.length > 0 && !COMMON.some(function (w) { return lower.indexOf(w) !== -1; });
    }
  };

  var levels = [
    { min: 0, text: "Very weak", color: "#b0392b" },
    { min: 2, text: "Weak", color: "#c45f3c" },
    { min: 4, text: "Okay", color: "#d29a4a" },
    { min: 5, text: "Strong", color: "#8aa070" },
    { min: 6, text: "Very strong", color: "#6f9a63" }
  ];

  function estimateCrackTime(p) {
    var pool = 0;
    if (/[a-z]/.test(p)) pool += 26;
    if (/[A-Z]/.test(p)) pool += 26;
    if (/\d/.test(p)) pool += 10;
    if (/[^A-Za-z0-9]/.test(p)) pool += 32;
    var seconds = Math.pow(pool || 1, p.length) / 1e10; // ~10 billion guesses per second
    if (!rules.common(p)) seconds = Math.min(seconds, 1);
    var units = [["centuries", 3153600000], ["years", 31536000], ["days", 86400], ["hours", 3600], ["minutes", 60]];
    for (var i = 0; i < units.length; i++) {
      if (seconds >= units[i][1]) {
        var n = Math.floor(seconds / units[i][1]);
        return "≈ " + (n > 1e6 ? "millions of" : n.toLocaleString()) + " " + units[i][0] + " to crack";
      }
    }
    return "cracked instantly";
  }

  input.addEventListener("input", function () {
    var p = input.value;
    var score = 0;
    checks.forEach(function (li) {
      var ok = rules[li.getAttribute("data-rule")](p);
      li.classList.toggle("ok", ok);
      if (ok) score++;
    });

    if (!p) {
      meter.style.width = "0";
      label.textContent = "Start typing…";
      timeEl.textContent = "";
      return;
    }
    var hasCommonWord = !rules.common(p);
    if (hasCommonWord) score = Math.min(score, 2); // common words make any password easy to guess
    var level = levels.filter(function (l) { return score >= l.min; }).pop();
    meter.style.width = Math.max(8, (score / 6) * 100) + "%";
    meter.style.background = level.color;
    label.textContent = level.text;
    timeEl.textContent = hasCommonWord ? "contains a common word" : estimateCrackTime(p);
  });
})();
