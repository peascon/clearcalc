(function () {
  "use strict";
  var root = document.getElementById("calc");

  /** Monthly simulation. Contributions are added at the end of each month. */
  function grow(initial, monthly, ratePct, years, freq) {
    var mRate = Math.pow(1 + ratePct / 100 / freq, freq / 12) - 1;
    var bal = initial, contributed = initial, rows = [];
    for (var m = 1; m <= years * 12; m++) {
      bal = bal * (1 + mRate) + monthly;
      contributed += monthly;
      if (m % 12 === 0) rows.push({ contributed: contributed, balance: bal });
    }
    return { balance: bal, contributed: contributed, rows: rows };
  }

  function calc() {
    var initial = CC.val("initial") || 0, monthly = CC.val("monthly") || 0;
    var rate = CC.val("rate"), years = Math.round(CC.val("years"));
    var freq = Number(document.getElementById("freq").value);
    var infl = CC.val("inflation") || 0;
    if (!(rate >= 0) || !(years > 0 && years <= 100) || initial < 0 || monthly < 0 || initial + monthly <= 0) {
      CC.set("outFV", "—");
      CC.set("outNote", "Enter a starting amount or monthly contribution, a return and 1–100 years.");
      return;
    }
    var g = grow(initial, monthly, rate, years, freq);
    CC.set("outFV", CC.money(g.balance, true));
    CC.set("outIn", CC.money(g.contributed, true));
    CC.set("outInt", CC.money(g.balance - g.contributed, true));

    var realBox = document.getElementById("realBox");
    realBox.hidden = !(infl > 0);
    if (infl > 0) CC.set("outReal", CC.money(g.balance / Math.pow(1 + infl / 100, years), true));

    var share = (g.balance - g.contributed) / g.balance * 100;
    CC.set("outNote", rate > 0 ? "Interest makes up " + CC.num(share, 0) + "% of your final balance. At " + CC.num(rate, 2) +
      "% your money doubles roughly every " + CC.num(72 / rate, 1) + " years (rule of 72)." : "With a 0% return, your balance is only what you put in.");

    CC.stackedBars(document.getElementById("chart"), g.rows.map(function (_, i) { return "Y" + (i + 1); }), [
      { values: g.rows.map(function (r) { return r.contributed; }), color: "#0f5e4b" },
      { values: g.rows.map(function (r) { return r.balance - r.contributed; }), color: "#e9a23b" }
    ]);
    document.getElementById("table").innerHTML = g.rows.map(function (r, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + CC.money(r.contributed, true) + "</td><td>" +
        CC.money(r.balance - r.contributed, true) + "</td><td>" + CC.money(r.balance, true) + "</td></tr>";
    }).join("");
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__compound = { grow: grow };
})();
