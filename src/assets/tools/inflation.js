(function () {
  "use strict";
  var root = document.getElementById("calc");

  function grow(amount, rate, years) { return amount * Math.pow(1 + rate / 100, years); }

  function calc() {
    var mode = document.getElementById("mode").value;
    var amount = CC.val("amount"), rate = CC.val("rate"), years = CC.val("years");
    var future = mode === "future";
    CC.set("amountLabel", future ? CC.tr("Price today", "Prix aujourd'hui") : CC.tr("Amount in the past", "Montant dans le passé"));
    CC.set("yearsLabel", future ? CC.tr("Years from now", "Dans combien d'années") : CC.tr("Years ago", "Il y a combien d'années"));
    CC.set("mainLabel", future ? CC.tr("Price in ", "Prix dans ") + (years > 0 ? CC.num(years, 1) : "…") + CC.tr(" years", " ans")
      : CC.tr("Worth in today's money", "Valeur en argent d'aujourd'hui"));
    CC.set("powerLabel", future ? CC.tr("Buying power lost", "Pouvoir d'achat perdu") : CC.tr("Buying power lost since then", "Pouvoir d'achat perdu depuis"));

    if (!(amount > 0) || !(rate > -100 && rate <= 1000) || !(years > 0 && years <= 100)) {
      ["outMain", "outIncrease", "outPower", "outDouble"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", CC.tr("Enter an amount, an inflation rate and between 1 and 100 years.", "Saisissez un montant, un taux d'inflation et une durée de 1 à 100 ans."));
      return;
    }
    var result = grow(amount, rate, years);
    var factor = result / amount;
    CC.set("outMain", CC.money(result));
    CC.set("outIncrease", CC.num((factor - 1) * 100, 1) + CC.tr("%", " %"));
    CC.set("outPower", CC.num((1 - 1 / factor) * 100, 1) + CC.tr("%", " %"));
    CC.set("outDouble", rate > 0 ? CC.num(Math.log(2) / Math.log(1 + rate / 100), 1) + CC.tr(" years", " ans") : CC.tr("Never", "Jamais"));

    var n = Math.min(Math.ceil(years), 100), labels = [], vals = [];
    for (var y = 1; y <= n; y++) { labels.push(CC.yearLabel(y)); vals.push(grow(amount, rate, Math.min(y, years))); }
    if (!future) labels[labels.length - 1] = CC.tr("Now", "Auj.");
    CC.stackedBars(document.getElementById("chart"), labels, [{ values: vals, color: "#0f5e4b" }]);

    CC.set("outNote", future
      ? CC.tr("Something costing " + CC.money(amount) + " today will cost about " + CC.money(result) + " in " + CC.num(years, 1) +
          " years. Money kept as cash will buy " + CC.num(100 / factor, 0) + "% of what it buys today.",
        "Ce qui coûte " + CC.money(amount) + " aujourd'hui coûtera environ " + CC.money(result) + " dans " + CC.num(years, 1) +
          " ans. L'argent gardé en liquide n'achètera plus que " + CC.num(100 / factor, 0) + " % de ce qu'il achète aujourd'hui.")
      : CC.tr(CC.money(amount) + " back then buys about the same as " + CC.money(result) + " today.",
          CC.money(amount) + " à l'époque équivalent à environ " + CC.money(result) + " aujourd'hui."));
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__inflation = { grow: grow };
})();
