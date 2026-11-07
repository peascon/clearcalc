(function () {
  "use strict";
  var root = document.getElementById("calc");

  // Standard VAT/GST rates. Last checked November 2026.
  var RATES = [
    ["RW", "Rwanda", 18], ["KE", "Kenya", 16], ["UG", "Uganda", 18], ["TZ", "Tanzania", 18],
    ["NG", "Nigeria", 7.5], ["ZA", "South Africa", 15], ["SN", "Senegal", 18], ["CI", "Côte d'Ivoire", 18],
    ["ZM", "Zambia", 16], ["GB", "United Kingdom", 20], ["IE", "Ireland", 23], ["DE", "Germany", 19],
    ["FR", "France", 20], ["NL", "Netherlands", 21], ["BE", "Belgium", 21], ["ES", "Spain", 21],
    ["IT", "Italy", 22], ["AE", "United Arab Emirates", 5], ["SA", "Saudi Arabia", 15],
    ["IN", "India (GST standard)", 18], ["SG", "Singapore (GST)", 9], ["JP", "Japan", 10],
    ["AU", "Australia (GST)", 10], ["NZ", "New Zealand (GST)", 15], ["CA", "Canada (federal GST)", 5]
  ];

  var sel = document.getElementById("country");
  var custom = document.createElement("option");
  custom.value = "custom"; custom.textContent = "Other / custom rate";
  RATES.forEach(function (r) {
    var o = document.createElement("option");
    o.value = r[0]; o.textContent = r[1] + " – " + r[2] + "%";
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
    return "<tr><td>" + r[1] + "</td><td>" + r[2] + "%</td></tr>";
  }).join("");

  function split(amount, rate, mode) {
    var net = mode === "add" ? amount : amount / (1 + rate / 100);
    var vat = net * rate / 100;
    return { net: net, vat: vat, gross: net + vat };
  }

  function calc() {
    var mode = document.getElementById("mode").value;
    var amount = CC.val("amount"), rate = CC.val("rate");
    document.getElementById("amountLabel").textContent = mode === "add" ? "Price before VAT" : "Price including VAT";
    CC.set("mainLabel", mode === "add" ? "Price including VAT" : "VAT included in this price");
    if (!(amount > 0) || !(rate >= 0 && rate < 100)) {
      ["outMain", "outNet", "outVat", "outGross"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", "Enter a price and a VAT rate between 0 and 100%.");
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
    CC.set("outNote", "VAT is " + CC.num(s.vat / s.gross * 100, 2) + "% of the total price (" + CC.num(rate, 2) +
      "% of the net price).");
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__vat = { split: split };
})();
