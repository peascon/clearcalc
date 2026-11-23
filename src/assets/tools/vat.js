(function () {
  "use strict";
  var root = document.getElementById("calc");

  // Standard VAT/GST rates. Last checked November 2026.
  var RATES = [
    ["RW", "Rwanda", 18, "Rwanda"], ["KE", "Kenya", 16, "Kenya"], ["UG", "Uganda", 18, "Ouganda"], ["TZ", "Tanzania", 18, "Tanzanie"],
    ["NG", "Nigeria", 7.5, "Nigeria"], ["ZA", "South Africa", 15, "Afrique du Sud"], ["SN", "Senegal", 18, "Sénégal"], ["CI", "Côte d'Ivoire", 18, "Côte d'Ivoire"],
    ["ZM", "Zambia", 16, "Zambie"], ["GB", "United Kingdom", 20, "Royaume-Uni"], ["IE", "Ireland", 23, "Irlande"], ["DE", "Germany", 19, "Allemagne"],
    ["FR", "France", 20, "France"], ["NL", "Netherlands", 21, "Pays-Bas"], ["BE", "Belgium", 21, "Belgique"], ["ES", "Spain", 21, "Espagne"],
    ["IT", "Italy", 22, "Italie"], ["AE", "United Arab Emirates", 5, "Émirats arabes unis"], ["SA", "Saudi Arabia", 15, "Arabie saoudite"],
    ["IN", "India (GST standard)", 18, "Inde (GST standard)"], ["SG", "Singapore (GST)", 9, "Singapour (GST)"], ["JP", "Japan", 10, "Japon"],
    ["AU", "Australia (GST)", 10, "Australie (GST)"], ["NZ", "New Zealand (GST)", 15, "Nouvelle-Zélande (GST)"], ["CA", "Canada (federal GST)", 5, "Canada (TPS fédérale)"]
  ];
  function cname(r) { return CC.tr(r[1], r[3]); }

  var sel = document.getElementById("country");
  var custom = document.createElement("option");
  custom.value = "custom"; custom.textContent = CC.tr("Other / custom rate", "Autre / taux personnalisé");
  RATES.forEach(function (r) {
    var o = document.createElement("option");
    o.value = r[0]; o.textContent = cname(r) + " – " + CC.num(r[2], 1) + " %";
    sel.appendChild(o);
  });
  sel.appendChild(custom);

  // Default country from the visitor's language region, else Rwanda.
  var region = ((navigator.language || "").split("-")[1] || "").toUpperCase();
  var match = RATES.filter(function (r) { return r[0] === region; })[0];
  var params = new URLSearchParams(location.search);
  if (!params.has("country")) {
    sel.value = match ? match[0] : "RW";
    document.getElementById("rate").value = (match || RATES[0])[2];
  }

  sel.addEventListener("change", function () {
    var r = RATES.filter(function (x) { return x[0] === sel.value; })[0];
    if (r) document.getElementById("rate").value = r[2];
  });
  document.getElementById("rate").addEventListener("input", function () {
    var r = RATES.filter(function (x) { return x[0] === sel.value; })[0];
    if (r && CC.val("rate") !== r[2]) sel.value = "custom";
  });

  document.getElementById("rateTable").innerHTML = RATES.map(function (r) {
    return "<tr><td>" + cname(r) + "</td><td>" + CC.num(r[2], 1) + " %</td></tr>";
  }).join("");

  function split(amount, rate, mode) {
    var net = mode === "add" ? amount : amount / (1 + rate / 100);
    var vat = net * rate / 100;
    return { net: net, vat: vat, gross: net + vat };
  }

  function calc() {
    var mode = document.getElementById("mode").value;
    var amount = CC.val("amount"), rate = CC.val("rate");
    document.getElementById("amountLabel").textContent = mode === "add" ? CC.tr("Price before VAT", "Prix hors TVA") : CC.tr("Price including VAT", "Prix TTC (TVA incluse)");
    CC.set("mainLabel", mode === "add" ? CC.tr("Price including VAT", "Prix TTC") : CC.tr("VAT included in this price", "TVA incluse dans ce prix"));
    if (!(amount > 0) || !(rate >= 0 && rate < 100)) {
      ["outMain", "outNet", "outVat", "outGross"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", CC.tr("Enter a price and a VAT rate between 0 and 100%.", "Saisissez un prix et un taux de TVA entre 0 et 100 %."));
      return;
    }
    var s = split(amount, rate, mode);
    CC.set("outMain", CC.money(mode === "add" ? s.gross : s.vat));
    CC.set("outNet", CC.money(s.net));
    CC.set("outVat", CC.money(s.vat));
    CC.set("outGross", CC.money(s.gross));
    document.getElementById("bar").innerHTML =
      '<span style="width:' + (s.net / s.gross * 100) + '%;background:#0f5e4b"></span>' +
      '<span style="width:' + (s.vat / s.gross * 100) + '%;background:#e9a23b"></span>';
    CC.set("outNote", CC.tr("VAT is " + CC.num(s.vat / s.gross * 100, 2) + "% of the total price (" + CC.num(rate, 2) + "% of the net price).",
      "La TVA représente " + CC.num(s.vat / s.gross * 100, 2) + " % du prix TTC (" + CC.num(rate, 2) + " % du prix HT)."));
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__vat = { split: split };
})();
