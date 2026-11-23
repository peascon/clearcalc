(function () {
  "use strict";
  var root = document.getElementById("calc");

  function priceFor(cost, mode, pct) {
    if (mode === "margin") return cost / (1 - pct / 100);
    return cost * (1 + pct / 100); // markup
  }

  function calc() {
    var mode = document.getElementById("mode").value;
    var cost = CC.val("cost"), qty = CC.val("qty");
    var usePct = mode !== "price";
    document.getElementById("priceField").hidden = usePct;
    document.getElementById("pctField").hidden = !usePct;
    document.getElementById("pctLabel").textContent = mode === "markup" ? CC.tr("Target markup", "Majoration visée (% du coût)") : CC.tr("Target margin", "Marge visée (% du prix de vente)");
    CC.set("mainLabel", usePct ? CC.tr("Selling price you need", "Prix de vente nécessaire") : CC.tr("Profit margin", "Marge bénéficiaire"));

    var price, err = "";
    if (!(cost >= 0)) err = CC.tr("Enter the cost per item.", "Saisissez le coût par article.");
    else if (usePct) {
      var pct = CC.val("pct");
      if (mode === "margin" && !(pct >= 0 && pct < 100)) err = CC.tr("Margin must be between 0 and 100% (below 100).", "La marge doit être comprise entre 0 et 100 % (strictement inférieure à 100).");
      else if (mode === "markup" && !(pct >= 0)) err = CC.tr("Enter a markup of 0% or more.", "Saisissez une majoration de 0 % ou plus.");
      else price = priceFor(cost, mode, pct);
    } else {
      price = CC.val("price");
      if (!(price > 0)) err = CC.tr("Enter a selling price.", "Saisissez un prix de vente.");
    }
    if (err) {
      ["outMain", "outPrice", "outProfit", "outMargin", "outMarkup", "outRevenue", "outTotalProfit"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", err);
      return;
    }

    var profit = price - cost;
    var margin = price > 0 ? profit / price * 100 : NaN;
    var markup = cost > 0 ? profit / cost * 100 : NaN;
    var q = qty > 0 ? qty : 1;

    CC.set("outMain", usePct ? CC.money(price) : CC.num(margin, 1) + CC.tr("%", " %"));
    CC.set("outPrice", CC.money(price));
    CC.set("outProfit", CC.money(profit));
    CC.set("outMargin", isFinite(margin) ? CC.num(margin, 1) + CC.tr("%", " %") : "—");
    CC.set("outMarkup", isFinite(markup) ? CC.num(markup, 1) + CC.tr("%", " %") : "—");
    CC.set("outRevenue", CC.money(price * q, true));
    CC.set("outTotalProfit", CC.money(profit * q, true));
    document.getElementById("totals").style.display = qty > 1 ? "" : "none";

    var note;
    if (profit < 0) note = CC.tr("You're selling below cost and losing " + CC.money(-profit) + " on each item.",
      "Vous vendez à perte : vous perdez " + CC.money(-profit) + " sur chaque article.");
    else if (cost > 0) note = CC.tr("Break-even price is " + CC.money(cost) + ". Every item sold above that adds " + CC.money(profit) + " profit.",
      "Le seuil de rentabilité est de " + CC.money(cost) + ". À votre prix, chaque article vendu rapporte " + CC.money(profit) + " de bénéfice.");
    else note = CC.tr("With zero cost, the whole price is profit.", "Sans coût, tout le prix est du bénéfice.");
    CC.set("outNote", note);
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__margin = { priceFor: priceFor };
})();
