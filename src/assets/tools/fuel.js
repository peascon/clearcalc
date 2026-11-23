(function () {
  "use strict";
  var root = document.getElementById("calc");
  var KM_PER_MI = 1.609344, L_PER_GAL_US = 3.785411784, L_PER_GAL_UK = 4.54609;

  /** Litres needed per km, from any efficiency unit. */
  function litresPerKm(eff, unit) {
    switch (unit) {
      case "l100": return eff / 100;
      case "kml": return 1 / eff;
      case "mpgus": return L_PER_GAL_US / (eff * KM_PER_MI);
      case "mpguk": return L_PER_GAL_UK / (eff * KM_PER_MI);
    }
  }

  function pricePerLitre(price, unit) {
    return unit === "galus" ? price / L_PER_GAL_US : unit === "galuk" ? price / L_PER_GAL_UK : price;
  }

  function calc() {
    var dist = CC.val("distance"), eff = CC.val("eff"), price = CC.val("price");
    var distUnit = document.getElementById("distUnit").value;
    var effUnit = document.getElementById("effUnit").value;
    var priceUnit = document.getElementById("priceUnit").value;
    var legs = Number(document.getElementById("trip").value);
    var people = Math.max(1, Math.round(CC.val("people") || 1));
    var perMonth = CC.val("perMonth");

    if (!(dist > 0) || !(eff > 0) || !(price > 0)) {
      ["outTrip", "outPerson", "outFuel", "outPerKm", "outMonth", "outYearCost"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", "Enter the distance, your vehicle's fuel efficiency and the fuel price.");
      return;
    }
    var km = dist * (distUnit === "mi" ? KM_PER_MI : 1) * legs;
    var litres = km * litresPerKm(eff, effUnit);
    var cost = litres * pricePerLitre(price, priceUnit);

    CC.set("outTrip", CC.money(cost));
    CC.set("outPerson", CC.money(cost / people));
    var showGal = priceUnit !== "l";
    var galSize = priceUnit === "galuk" ? L_PER_GAL_UK : L_PER_GAL_US;
    CC.set("outFuel", showGal ? CC.num(litres / galSize, 2) + " gal" : CC.num(litres, 1) + " L");
    var perUnitDist = distUnit === "mi" ? cost / (km / KM_PER_MI) : cost / km;
    CC.set("outPerKm", CC.money(perUnitDist));
    document.querySelector("#outPerKm").previousElementSibling.textContent = distUnit === "mi" ? "Cost per mile" : "Cost per km";

    var monthly = document.getElementById("monthly");
    if (perMonth > 1) {
      monthly.style.display = "";
      CC.set("outMonth", CC.money(cost * perMonth, true));
      CC.set("outYearCost", CC.money(cost * perMonth * 12, true));
    } else monthly.style.display = "none";

    var totalDist = CC.num(distUnit === "mi" ? km / KM_PER_MI : km, 0) + (distUnit === "mi" ? " miles" : " km");
    CC.set("outNote", "Based on " + totalDist + (legs === 2 ? " there and back" : " one way") +
      (people > 1 ? ", split between " + people + " people" : "") + ". Only fuel is included, not maintenance or tolls.");
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__fuel = { litresPerKm: litresPerKm, pricePerLitre: pricePerLitre };
})();
