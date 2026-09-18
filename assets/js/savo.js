(function () {
  "use strict";

  var LANG_KEY = "savo.lang";

  function rememberLang() {
    var html = document.documentElement;
    var current = html.getAttribute("lang");
    if (current) {
      try { localStorage.setItem(LANG_KEY, current); } catch (e) {}
    }
    var switches = document.querySelectorAll("[data-lang-switch]");
    for (var i = 0; i < switches.length; i++) {
      switches[i].addEventListener("click", function () {
        try { localStorage.setItem(LANG_KEY, this.getAttribute("data-lang-switch")); } catch (e) {}
      });
    }
  }

  function commitSectors() {
    var grid = document.querySelector(".sectors");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".sector"));
    if (!cards.length) return;

    function light(card) {
      grid.classList.add("committed");
      for (var i = 0; i < cards.length; i++) cards[i].classList.remove("lit");
      card.classList.add("lit");
    }

    function clear() {
      grid.classList.remove("committed");
      for (var i = 0; i < cards.length; i++) cards[i].classList.remove("lit");
    }

    cards.forEach(function (card, index) {
      card.addEventListener("mouseenter", function () { light(card); });
      card.addEventListener("focus", function () { light(card); });
      card.addEventListener("blur", function () {
        if (!grid.contains(document.activeElement)) clear();
      });
      card.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = cards[index + 1];
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = cards[index - 1];
        else if (event.key === "Escape") { clear(); card.blur(); return; }
        else return;
        if (next) { event.preventDefault(); next.focus(); }
      });
    });

    grid.addEventListener("mouseleave", function () {
      if (!grid.contains(document.activeElement)) clear();
    });
  }


  // hamburger menu toggle
  function setupMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var overlay = document.getElementById("menu-overlay");
    if (!toggle || !overlay) return;

    var closeBtn = overlay.querySelector(".menu-close");
    var links = overlay.querySelectorAll(".menu-nav a, .lang");
    var focusables = overlay.querySelectorAll("a[href], button");
    var lastFocus = null;

    for (var i = 0; i < links.length; i++) {
      links[i].style.setProperty("--d", (60 + i * 45) + "ms");
    }

    function onKey(event) {
      if (event.key === "Escape") { closeMenu(); return; }
      if (event.key !== "Tab" || !focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }

    function openMenu() {
      lastFocus = document.activeElement;
      overlay.hidden = false;
      void overlay.offsetWidth;
      overlay.classList.add("is-open");
      document.body.classList.add("menu-open");
      toggle.setAttribute("aria-expanded", "true");
      closeBtn.focus();
      document.addEventListener("keydown", onKey);
    }

    function closeMenu() {
      overlay.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", onKey);
      window.setTimeout(function () { overlay.hidden = true; }, 260);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    toggle.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    for (var k = 0; k < links.length; k++) {
      links[k].addEventListener("click", closeMenu);
    }
  }

  function initGlobe() {
    var host = document.querySelector(".hero-globe");
    if (!host) return;
    var mers = host.querySelectorAll(".mer");
    if (!mers.length) return;

    var R = 92, CX = 100, CY = 100;
    // single source of truth: the markup carries the tilt the paths were built with
    var TILT = (parseFloat(host.getAttribute("data-tilt")) || 18) * Math.PI / 180;
    var COS_T = Math.cos(TILT), SIN_T = Math.sin(TILT);
    var STEPS = 48, PERIOD = 34000, EASE = 0.22;

    function meridian(lon) {
      var d = "", i, lat, cl, x, y, z;
      for (i = 0; i <= STEPS; i++) {
        lat = -Math.PI / 2 + (Math.PI * i) / STEPS;
        cl = Math.cos(lat);
        x = R * cl * Math.cos(lon);
        y = R * Math.sin(lat);
        z = R * cl * Math.sin(lon);
        d += (i ? " L" : "M") +
             (CX + x).toFixed(2) + "," +
             (CY - (y * COS_T - z * SIN_T)).toFixed(2);
      }
      return d;
    }

    function draw(phase) {
      for (var i = 0; i < mers.length; i++) {
        mers[i].setAttribute("d", meridian(phase + (2 * Math.PI * i) / mers.length));
      }
    }

    var quiet = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (quiet && quiet.matches) return;

    var t0 = null;
    function frame(now) {
      if (t0 === null) t0 = now;
      var base = ((now - t0) % PERIOD) / PERIOD * Math.PI * 2;
      // modulating the phase by a sine of itself keeps velocity continuous
      // across the loop seam, so it breathes instead of lurching once a cycle
      draw(base + EASE * Math.sin(base));
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function boot() {
    var steps = [rememberLang, commitSectors, setupMenu, initGlobe];
    for (var i = 0; i < steps.length; i++) {
      try { steps[i](); } catch (e) { if (window.console) console.error(steps[i].name, e); }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
