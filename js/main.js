/* ==========================================================================
   main.js — shared behaviour for every page
   Navigation, scroll effects, reveal animations, skill bars, toast messages
   and the background music player. Vanilla JavaScript only.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Toast (used by every page) ---------- */
  var toastEl = document.getElementById("toast");
  var toastTimer;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 3200);
  }
  window.showToast = showToast; // shared with the page scripts

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navList = document.getElementById("nav-list");
  if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      navList.classList.toggle("is-open", !open);
    });
    navList.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        navToggle.setAttribute("aria-expanded", "false");
        navList.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        navToggle.setAttribute("aria-expanded", "false");
        navList.classList.remove("is-open");
      }
    });
  }

  /* ---------- Header border on scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Footer year ---------- */
  var years = document.querySelectorAll("[data-year]");
  years.forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Reveal on scroll + skill bars ---------- */
  var revealTargets = document.querySelectorAll(".reveal, [data-skills]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Simulated links (course project demos) ---------- */
  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-simulated]");
    if (!link) return;
    e.preventDefault();
    showToast(link.getAttribute("data-simulated") + " is a simulated link for this course project.");
  });

  /* ---------- Background music player ---------- */
  var audio = document.getElementById("bg-audio");
  var player = document.getElementById("player");
  var playBtn = document.getElementById("player-btn");
  var volume = document.getElementById("player-volume");
  var statusEl = document.getElementById("player-status");
  var hint = document.getElementById("player-hint");
  var STORE = "hoPortfolioMusic";

  if (audio && player && playBtn) {
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch (err) { saved = {}; }

    audio.volume = typeof saved.volume === "number" ? saved.volume : 0.5;
    if (volume) volume.value = audio.volume;

    function setPlayingUI(isPlaying) {
      player.classList.toggle("is-playing", isPlaying);
      playBtn.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
      if (statusEl) statusEl.textContent = isPlaying ? "Now playing" : "Background music";
    }

    function save() {
      try {
        sessionStorage.setItem(STORE, JSON.stringify({
          playing: !audio.paused,
          time: audio.currentTime || 0,
          volume: audio.volume,
          hintSeen: true
        }));
      } catch (err) { /* storage unavailable */ }
    }

    function play() {
      var attempt = audio.play();
      if (attempt && attempt.catch) {
        attempt.catch(function () {
          setPlayingUI(false);
          if (statusEl) statusEl.textContent = "Tap play to resume";
        });
      }
    }

    playBtn.addEventListener("click", function () {
      if (hint) hint.hidden = true;
      if (audio.paused) { play(); } else { audio.pause(); }
    });

    audio.addEventListener("play", function () { setPlayingUI(true); save(); });
    audio.addEventListener("pause", function () { setPlayingUI(false); save(); });

    if (volume) {
      volume.addEventListener("input", function () {
        audio.volume = parseFloat(volume.value);
        save();
      });
    }

    // keep the song going from the same spot when moving between pages
    window.addEventListener("pagehide", save);
    var lastSave = 0;
    audio.addEventListener("timeupdate", function () {
      if (Date.now() - lastSave > 2000) { lastSave = Date.now(); save(); }
    });

    if (saved.time) {
      audio.addEventListener("loadedmetadata", function () {
        try { audio.currentTime = saved.time; } catch (err) { /* ignore */ }
      }, { once: true });
      if (audio.readyState >= 1) { try { audio.currentTime = saved.time; } catch (err) {} }
    }
    if (saved.playing) { play(); }

    // a gentle invitation the first time someone visits
    if (hint && !saved.hintSeen) {
      setTimeout(function () { hint.hidden = false; }, 1800);
      setTimeout(function () { hint.hidden = true; }, 9000);
    }
  }
})();
