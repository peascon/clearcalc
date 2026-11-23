(function () {
  "use strict";
  var root = document.getElementById("calc");

  function grow(amount, rate, years) { return amount * Math.pow(1 + rate / 100, years); }

  function calc() {
    var mode = document.getElementById("mode").value;
    var amount = CC.val("amount"), rate = CC.val("rate"), years = CC.val("years");
    var future = mode === "future";
    CC.set("amountLabel", future ? "Price today" : "Amount in the past");
    CC.set("yearsLabel", future ? "Years from now" : "Years ago");
    CC.set("mainLabel", future ? "Price in " + (years > 0 ? CC.num(years, 1) : "…") + " years" : "Worth in today's money");
    CC.set("powerLabel", future ? "Buying power lost" : "Buying power lost since then");

    if (!(amount > 0) || !(rate > -100 && rate <= 1000) || !(years > 0 && years <= 100)) {
      ["outMain", "outIncrease", "outPower", "outDouble"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", "Enter an amount, an inflation rate and between 1 and 100 years.");
      return;
    }
    var result = grow(amount, rate, years);
    var factor = result / amount;
    CC.set("outMain", CC.money(result));
    CC.set("outIncrease", CC.num((factor - 1) * 100, 1) + "%");
    CC.set("outPower", CC.num((1 - 1 / factor) * 100, 1) + "%");
    CC.set("outDouble", rate > 0 ? CC.num(Math.log(2) / Math.log(1 + rate / 100), 1) + " years" : "Never");

    var n = Math.min(Math.ceil(years), 100), labels = [], vals = [];
    for (var y = 1; y <= n; y++) { labels.push("Y" + y); vals.push(grow(amount, rate, Math.min(y, years))); }
    if (!future) labels[labels.length - 1] = "Now";
    CC.stackedBars(document.getElementById("chart"), labels, [{ values: vals, color: "#0f5e4b" }]);

    CC.set("outNote", future
      ? "Something costing " + CC.money(amount) + " today will cost about " + CC.money(result) + " in " + CC.num(years, 1) +
        " years. Money kept as cash will buy " + CC.num(100 / factor, 0) + "% of what it buys today."
      : CC.money(amount) + " back then buys about the same as " + CC.money(result) + " today.");
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__inflation = { grow: grow };
})();
