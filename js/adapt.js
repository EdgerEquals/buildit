/* ADAPT (Danny's adaptive golden-ratio principle, 25 Oct 2026): ON-DEVICE usage loop + the shared data schema.
   - Records only WHICH parts of the page are opened / tapped / lingered on (fixed part ids like "dj", "chat", "pieces"),
     as counts and seconds. Never typed text, chat, answers, passwords or personal details. Never sent anywhere.
     Stored in this browser only: localStorage "buildit.adapt" (clear it with Adapt.reset()).
   - weight(id) = opens + taps x PHI^-1 + linger minutes x PHI^-2, decayed by PHI^-1 per week since last use, so habits fade.
   - LoadTiers asks Adapt.order(jobs) to load the parts used most first inside each tier.
   - Lite: Adapt.lite() / Adapt.setLite(on): the much lighter version of every rich view (html.lite). Default on for
     save-data / 2g connections.
   SHARED SCHEMA (one data, many faces), version 1:
     { v:1, site:"buildit", parts:{ <partId>:{ open:n, tap:n, linger:s, last:ms } }, prefs:{ lite:bool } }
   ADAPTER POINT: when the shared js/phi-adapt.js exists, load it BEFORE this file; if window.PhiAdapt is present every
   call below is forwarded to it (same method names), and this file only keeps the lite toggle. */
(function () {
  'use strict';
  var PHI = 1.6180339887, KEY = 'buildit.adapt', WEEK = 6048e5;
  var ext = window.PhiAdapt && typeof window.PhiAdapt.note === 'function' ? window.PhiAdapt : null;
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.v === 1) return d; } catch (e) {} return { v: 1, site: 'buildit', parts: {}, prefs: {} }; }
  var D = load(), dirty = 0;
  function save() { clearTimeout(dirty); dirty = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }, 382); }
  function part(id) { id = String(id).replace(/[^a-z0-9-]/gi, '').slice(0, 24); return id ? (D.parts[id] = D.parts[id] || { open: 0, tap: 0, linger: 0, last: 0 }) : null; }
  function note(id, kind, secs) {
    if (ext) return ext.note(id, kind, secs);
    var p = part(id); if (!p) return; if (kind === 'linger') p.linger = Math.round((p.linger + (+secs || 0)) * 10) / 10; else if (kind === 'open') p.open++; else p.tap++;
    p.last = Date.now(); save();
  }
  function weight(id) {
    if (ext && ext.weight) return ext.weight(id);
    var p = D.parts[id]; if (!p) return 0;
    return (p.open + p.tap / PHI + p.linger / 60 / (PHI * PHI)) * Math.pow(PHI, -(Date.now() - p.last) / WEEK);
  }
  // stable: ties keep the page's own order (most important first by design)
  function order(jobs) { if (ext && ext.order) return ext.order(jobs); return jobs.map(function (j, i) { return [j, i]; }).sort(function (a, b) { return (weight(b[0].name) - weight(a[0].name)) || (a[1] - b[1]); }).map(function (x) { return x[0]; }); }
  var c = navigator.connection || {}, slowNet = !!(c.saveData || /(^|-)2g$/.test(c.effectiveType || ''));
  function lite() { return D.prefs.lite == null ? slowNet : !!D.prefs.lite; }
  function setLite(on) { D.prefs.lite = !!on; save(); document.documentElement.classList.toggle('lite', !!on); }
  document.documentElement.classList.toggle('lite', lite());
  // taps on anything marked data-use="<partId>"; linger = seconds a [data-linger] part is on screen while the tab is visible
  document.addEventListener('click', function (e) { var t = e.target && e.target.closest && e.target.closest('[data-use]'); if (t) note(t.getAttribute('data-use'), 'tap'); }, true);
  var seen = {};
  function lingerWatch(el, id) {
    if (!window.IntersectionObserver) return;
    new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) seen[id] = Date.now(); else if (seen[id]) { note(id, 'linger', (Date.now() - seen[id]) / 1000); delete seen[id]; } }); }).observe(el);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) return; Object.keys(seen).forEach(function (id) { note(id, 'linger', (Date.now() - seen[id]) / 1000); seen[id] = Date.now(); }); });
  window.Adapt = { schema: 1, note: note, weight: weight, order: order, lite: lite, setLite: setLite, watch: lingerWatch,
    data: function () { return JSON.parse(JSON.stringify(D)); }, reset: function () { D = { v: 1, site: 'buildit', parts: {}, prefs: D.prefs }; save(); } };
})();
