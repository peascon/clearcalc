(function () {
  "use strict";
  var root = document.getElementById("calc");

  function payment(P, r, n) {
    if (r === 0) return P / n;
    var f = Math.pow(1 + r, n);
    return P * r * f / (f - 1);
  }

  function schedule(P, r, n, M, extra) {
    var bal = P, months = 0, totalInt = 0, years = [];
    while (bal > 0.005 && months < 1200) {
      var interest = bal * r;
      var principal = Math.min(bal, M + extra - interest);
      if (principal <= 0) return null; // payment doesn't cover interest
      bal -= principal;
      totalInt += interest;
      var y = Math.floor(months / 12);
      if (!years[y]) years[y] = { p: 0, i: 0, bal: 0 };
      years[y].p += principal; years[y].i += interest; years[y].bal = Math.max(0, bal);
      months++;
    }
    return { months: months, interest: totalInt, years: years };
  }

  var fmtTime = CC.duration;

  function calc() {
    var P = CC.val("amount"), rate = CC.val("rate"), term = CC.val("term");
    var extra = CC.val("extra") || 0;
    var n = Math.round(document.getElementById("termUnit").value === "years" ? term * 12 : term);
    if (!(P > 0) || !(rate >= 0) || !(n > 0) || extra < 0) {
      ["outPayment", "outInterest", "outTotal", "outTime"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outSaving", CC.tr("Enter a loan amount, rate and term to see results.", "Saisissez un montant, un taux et une durée pour voir les résultats."));
      return;
    }
    var r = rate / 100 / 12;
    var M = payment(P, r, n);
    var base = schedule(P, r, n, M, 0);
    var s = extra > 0 ? schedule(P, r, n, M, extra) : base;

    CC.set("outPayment", CC.money(M + extra));
    CC.set("outInterest", CC.money(s.interest, true));
    CC.set("outTotal", CC.money(P + s.interest, true));
    CC.set("outTime", fmtTime(s.months));
    if (extra > 0) {
      CC.set("outSaving", CC.tr(
        "Paying " + CC.money(extra) + " extra each month saves " + CC.money(base.interest - s.interest, true) +
          " in interest and clears the loan " + fmtTime(base.months - s.months) + " early. (Required payment: " + CC.money(M) + ")",
        "Payer " + CC.money(extra) + " de plus chaque mois économise " + CC.money(base.interest - s.interest, true) +
          " d'intérêts et rembourse le prêt " + fmtTime(base.months - s.months) + " plus tôt. (Mensualité minimale : " + CC.money(M) + ")"));
    } else {
      CC.set("outSaving", CC.tr("Interest is " + CC.num(s.interest / P * 100, 1) + "% of the amount you borrow.",
        "Les intérêts représentent " + CC.num(s.interest / P * 100, 1) + " % du montant emprunté."));
    }

    var labels = s.years.map(function (_, i) { return CC.yearLabel(i + 1); });
    CC.stackedBars(document.getElementById("chart"), labels, [
      { values: s.years.map(function (y) { return y.p; }), color: "#0f5e4b" },
      { values: s.years.map(function (y) { return y.i; }), color: "#e9a23b" }
    ]);
    document.getElementById("schedule").innerHTML = s.years.map(function (y, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + CC.money(y.p) + "</td><td>" + CC.money(y.i) +
        "</td><td>" + CC.money(y.bal) + "</td></tr>";
    }).join("");
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });

  // exported for tests
  window.__loan = { payment: payment, schedule: schedule };
})();
