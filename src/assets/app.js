/* Shared helpers for every ClearCalc page. Exposed as window.CC */
(function () {
  "use strict";

  var CURRENCIES = [
    ["USD", "US Dollar ($)"], ["EUR", "Euro (€)"], ["GBP", "British Pound (£)"],
    ["CAD", "Canadian Dollar"], ["AUD", "Australian Dollar"], ["INR", "Indian Rupee (₹)"],
    ["RWF", "Rwandan Franc"], ["KES", "Kenyan Shilling"], ["UGX", "Ugandan Shilling"],
    ["TZS", "Tanzanian Shilling"], ["NGN", "Nigerian Naira"], ["ZAR", "South African Rand"],
    ["GHS", "Ghanaian Cedi"], ["XOF", "West African CFA"], ["AED", "UAE Dirham"],
    ["JPY", "Japanese Yen"], ["CNY", "Chinese Yuan"], ["BRL", "Brazilian Real"]
  ];

  // Guess a sensible default from the visitor's locale (e.g. en-GB -> GBP).
  var REGION_TO_CUR = {
    US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", IN: "INR", RW: "RWF", KE: "KES", UG: "UGX",
    TZ: "TZS", NG: "NGN", ZA: "ZAR", GH: "GHS", SN: "XOF", CI: "XOF", AE: "AED", JP: "JPY",
    CN: "CNY", BR: "BRL", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", IE: "EUR",
    BE: "EUR", PT: "EUR", AT: "EUR", FI: "EUR"
  };

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function guessCurrency() {
    var saved = store("cc-currency");
    if (saved) return saved;
    var lang = (navigator.language || "en-US").split("-");
    return REGION_TO_CUR[(lang[1] || "").toUpperCase()] || "USD";
  }

  var currency = guessCurrency();
  var listeners = [];
  var formatter, formatter0;

  function buildFormatters() {
    try {
      formatter = new Intl.NumberFormat(undefined, { style: "currency", currency: currency });
      formatter0 = new Intl.NumberFormat(undefined, { style: "currency", currency: currency, maximumFractionDigits: 0 });
    } catch (e) {
      formatter = formatter0 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
    }
  }
  buildFormatters();

  var CC = {
    currency: function () { return currency; },

    /** Format money. whole=true drops decimals (good for big totals). */
    money: function (n, whole) {
      if (!isFinite(n)) return "—";
      return (whole ? formatter0 : formatter).format(n);
    },

    num: function (n, digits) {
      if (!isFinite(n)) return "—";
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits == null ? 2 : digits }).format(n);
    },

    /** Read a number from an input by id. Accepts "1,200" and "1 200". */
    val: function (id) {
      var el = document.getElementById(id);
      if (!el) return NaN;
      var v = String(el.value).replace(/[\s,]/g, "");
      return v === "" ? NaN : Number(v);
    },

    set: function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    },

    onCurrencyChange: function (fn) { listeners.push(fn); },

    /**
     * Run `calc` on load and whenever any input/select inside `root` changes.
     * Also restores inputs from the URL (?amount=...) so results are shareable.
     */
    bind: function (root, calc) {
      var params = new URLSearchParams(location.search);
      root.querySelectorAll("input, select").forEach(function (el) {
        if (el.id && params.has(el.id)) el.value = params.get(el.id);
        el.addEventListener("input", calc);
        el.addEventListener("change", calc);
      });
      listeners.push(calc);
      calc();
    },

    /** Copy a link that reproduces the current inputs. */
    shareLink: function (root, btn) {
      var params = new URLSearchParams();
      root.querySelectorAll("input, select").forEach(function (el) {
        if (el.id && el.value !== "") params.set(el.id, el.value);
      });
      var url = location.origin + location.pathname + "?" + params.toString();
      var done = function () { var t = btn.textContent; btn.textContent = "Link copied ✓"; setTimeout(function () { btn.textContent = t; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { prompt("Copy this link:", url); });
      } else { prompt("Copy this link:", url); }
    },

    /**
     * Stacked bar chart on a <canvas>. series = [{values:[], color:"#..", label:".."}]
     */
    stackedBars: function (canvas, labels, series) {
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var n = labels.length;
      if (!n) return;
      var totals = labels.map(function (_, i) {
        return series.reduce(function (s, se) { return s + Math.max(0, se.values[i] || 0); }, 0);
      });
      var max = Math.max.apply(null, totals) || 1;
      var padL = 8, padR = 8, padT = 10, padB = 22;
      var plotW = w - padL - padR, plotH = h - padT - padB;
      var gap = n > 30 ? 1 : 3;
      var bw = Math.max(1, plotW / n - gap);

      ctx.strokeStyle = "#e3e9e6"; ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var gy = padT + plotH * g / 4;
        ctx.beginPath(); ctx.moveTo(padL, gy + .5); ctx.lineTo(w - padR, gy + .5); ctx.stroke();
      }
      for (var i = 0; i < n; i++) {
        var x = padL + i * (bw + gap), y = padT + plotH;
        series.forEach(function (se) {
          var bh = Math.max(0, se.values[i] || 0) / max * plotH;
          ctx.fillStyle = se.color;
          ctx.fillRect(x, y - bh, bw, bh);
          y -= bh;
        });
      }
      ctx.fillStyle = "#6a7a74"; ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "center";
      var step = Math.ceil(n / 8);
      for (var j = 0; j < n; j += step) {
        ctx.fillText(labels[j], padL + j * (bw + gap) + bw / 2, h - 6);
      }
      if ((n - 1) % step !== 0) ctx.fillText(labels[n - 1], padL + (n - 1) * (bw + gap) + bw / 2, h - 6);
      ctx.textAlign = "right";
      ctx.fillText(CC.money(max, true), w - padR, padT + 10);
    }
  };

  window.CC = CC;

  document.addEventListener("DOMContentLoaded", function () {
    var sel = document.getElementById("currency");
    if (!sel) return;
    var known = CURRENCIES.some(function (c) { return c[0] === currency; });
    if (!known) { currency = "USD"; buildFormatters(); }
    CURRENCIES.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c[0]; o.textContent = c[0]; o.title = c[1];
      if (c[0] === currency) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () {
      currency = sel.value;
      store("cc-currency", currency);
      buildFormatters();
      document.querySelectorAll("[data-cur]").forEach(function (el) { el.textContent = currencySymbol(); });
      listeners.forEach(function (fn) { fn(); });
    });
    document.querySelectorAll("[data-cur]").forEach(function (el) { el.textContent = currencySymbol(); });
  });

  function currencySymbol() {
    try {
      var parts = new Intl.NumberFormat(undefined, { style: "currency", currency: currency }).formatToParts(0);
      var p = parts.find(function (x) { return x.type === "currency"; });
      return p ? p.value : currency;
    } catch (e) { return currency; }
  }

  // Redraw charts on resize
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { listeners.forEach(function (fn) { fn(); }); }, 150);
  });
})();
