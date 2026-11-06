(function () {
  "use strict";
  var root = document.getElementById("calc");
  var COLORS = ["#0f5e4b", "#e9a23b", "#5b8def", "#b06ab3", "#8aa098"];

  function calc() {
    var price = CC.val("price"), downPct = CC.val("down"), rate = CC.val("rate");
    var years = CC.val("years");
    var tax = CC.val("tax") || 0, ins = CC.val("ins") || 0, fees = CC.val("fees") || 0;
    if (!(price > 0) || !(downPct >= 0 && downPct < 100) || !(rate >= 0)) {
      CC.set("outMonthly", "—");
      CC.set("outNote", "Enter a home price, a down payment below 100% and an interest rate.");
      return;
    }
    var down = price * downPct / 100, loan = price - down;
    var n = years * 12, r = rate / 100 / 12;
    var pi = r === 0 ? loan / n : loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    var firstInterest = loan * r;
    var parts = [
      ["Principal", pi - firstInterest],
      ["Interest", firstInterest],
      ["Property tax", tax / 12],
      ["Insurance", ins / 12],
      ["Fees", fees]
    ];
    var monthly = pi + tax / 12 + ins / 12 + fees;
    var totalInterest = pi * n - loan;

    CC.set("outMonthly", CC.money(monthly));
    CC.set("outLoan", CC.money(loan, true));
    CC.set("outDown", CC.money(down, true));
    CC.set("outInterest", CC.money(totalInterest, true));
    CC.set("outTotal", CC.money(down + pi * n + (tax + ins + fees * 12) * years, true));

    document.getElementById("bar").innerHTML = parts.map(function (p, i) {
      return p[1] > 0 ? '<span style="width:' + (p[1] / monthly * 100) + "%;background:" + COLORS[i] + '" title="' + p[0] + '"></span>' : "";
    }).join("");
    document.getElementById("barLegend").innerHTML = parts.map(function (p, i) {
      return p[1] > 0 ? '<span><i style="background:' + COLORS[i] + '"></i>' + p[0] + " " + CC.money(p[1]) + "</span>" : "";
    }).join("");

    var note = "Principal and interest: " + CC.money(pi) + " per month. Shown split for the first month — the interest share falls over time.";
    if (downPct < 20) note += " With less than 20% down, your lender may also require mortgage insurance.";
    CC.set("outNote", note);
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
})();
