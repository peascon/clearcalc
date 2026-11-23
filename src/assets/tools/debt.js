(function () {
  "use strict";
  var root = document.getElementById("calc");
  var MAX_MONTHS = 600;

  /**
   * Simulates paying off debts. strategy: "avalanche" | "snowball" | "minimum".
   * Returns { months, interest, order: [names in payoff order] } or { stuck: true }.
   */
  function simulate(debts, extra, strategy) {
    var ds = debts.map(function (d) { return { name: d.name, bal: d.bal, r: d.rate / 100 / 12, min: d.min, rate: d.rate }; });
    var budget = ds.reduce(function (s, d) { return s + d.min; }, 0) + (strategy === "minimum" ? 0 : extra);
    var interest = 0, month = 0, order = [];
    while (ds.some(function (d) { return d.bal > 0.005; })) {
      month++;
      if (month > MAX_MONTHS) return { stuck: true };
      ds.forEach(function (d) { if (d.bal > 0) { var i = d.bal * d.r; d.bal += i; interest += i; } });
      var left = strategy === "minimum" ? Infinity : budget;
      // pay minimums
      ds.forEach(function (d) {
        if (d.bal <= 0) return;
        var p = Math.min(d.min, d.bal);
        d.bal -= p; left -= p;
      });
      if (strategy !== "minimum") {
        var active = ds.filter(function (d) { return d.bal > 0.005; });
        active.sort(strategy === "avalanche"
          ? function (a, b) { return b.rate - a.rate || a.bal - b.bal; }
          : function (a, b) { return a.bal - b.bal || b.rate - a.rate; });
        for (var k = 0; k < active.length && left > 0.005; k++) {
          var p2 = Math.min(left, active[k].bal);
          active[k].bal -= p2; left -= p2;
        }
      }
      ds.forEach(function (d) {
        if (d.bal <= 0.005 && order.indexOf(d.name) === -1) { d.bal = 0; order.push(d.name); }
      });
    }
    return { months: month, interest: interest, order: order };
  }

  var fmtTime = CC.duration;

  function dateIn(m) {
    var d = new Date(); d.setMonth(d.getMonth() + m);
    return d.toLocaleDateString(CC.lang === "fr" ? "fr" : undefined, { month: "long", year: "numeric" });
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function calc() {
    var debts = [], warn = [];
    for (var i = 1; i <= 5; i++) {
      var bal = CC.val("b" + i), rate = CC.val("a" + i) || 0, min = CC.val("m" + i) || 0;
      if (!(bal > 0)) continue;
      var name = document.getElementById("n" + i).value.trim() || CC.tr("Debt ", "Dette ") + i;
      debts.push({ name: name, bal: bal, rate: rate, min: min });
      if (rate > 0 && min <= bal * rate / 100 / 12) warn.push(name);
    }
    var extra = CC.val("extra") || 0;
    var ids = ["outMain", "outAva", "outSnow", "outMin"];
    if (!debts.length) {
      ids.forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", CC.tr("Enter at least one debt with a balance.", "Saisissez au moins une dette avec un solde."));
      document.getElementById("order").innerHTML = "";
      return;
    }
    var ava = simulate(debts, extra, "avalanche");
    var snow = simulate(debts, extra, "snowball");
    var mins = simulate(debts, 0, "minimum");

    function show(id, r) {
      CC.set(id, r.stuck ? CC.tr("Never", "Jamais") : fmtTime(r.months));
      CC.set(id + "Int", r.stuck ? CC.tr("Payments don't cover interest", "Les paiements ne couvrent pas les intérêts") : CC.money(r.interest, true) + CC.tr(" interest", " d'intérêts"));
    }
    show("outAva", ava); show("outSnow", snow); show("outMin", mins);

    if (ava.stuck) {
      CC.set("mainLabel", CC.tr("Debt-free in", "Libéré de vos dettes dans"));
      CC.set("outMain", CC.tr("Not with these payments", "Pas avec ces paiements"));
      CC.set("outNote", CC.tr("Your payments don't cover the interest. Increase the extra amount or the minimum on: ",
        "Vos paiements ne couvrent pas les intérêts. Augmentez le montant supplémentaire ou le minimum de : ") + warn.join(", ") + ".");
      document.getElementById("order").innerHTML = "";
      return;
    }
    var bestIsSnow = !snow.stuck && snow.interest < ava.interest - 0.5;
    var best = bestIsSnow ? snow : ava;
    CC.set("mainLabel", CC.tr("Debt-free by ", "Sans dettes en ") + dateIn(best.months));
    CC.set("outMain", fmtTime(best.months));
    CC.set("orderName", bestIsSnow ? CC.tr("snowball", "boule de neige") : "avalanche");
    document.getElementById("order").innerHTML = best.order.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("");

    var note = "";
    if (!snow.stuck) {
      var diff = snow.interest - ava.interest;
      note = Math.abs(diff) < 1
        ? CC.tr("Both methods cost about the same here, so choose whichever keeps you motivated.",
            "Les deux méthodes coûtent à peu près pareil ici : choisissez celle qui vous motive le plus.")
        : CC.tr("The avalanche method saves " + CC.money(diff, true) + " in interest compared with the snowball.",
            "La méthode avalanche économise " + CC.money(diff, true) + " d'intérêts par rapport à la boule de neige.");
    }
    if (!mins.stuck) note += CC.tr(
      " Paying " + CC.money(extra) + " extra each month saves " + CC.money(mins.interest - ava.interest, true) +
        " and gets you debt-free " + fmtTime(mins.months - ava.months) + " sooner than paying minimums only.",
      " Payer " + CC.money(extra) + " de plus chaque mois économise " + CC.money(mins.interest - ava.interest, true) +
        " et vous libère de vos dettes " + fmtTime(mins.months - ava.months) + " plus tôt qu'en payant seulement les minimums.");
    if (warn.length) note += CC.tr(" Warning: the minimum on " + warn.join(", ") + " doesn't cover its monthly interest.",
      " Attention : le minimum de " + warn.join(", ") + " ne couvre pas ses intérêts mensuels.");
    CC.set("outNote", note.trim());
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__debt = { simulate: simulate };
})();
