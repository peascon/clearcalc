(function () {
  "use strict";
  var root = document.getElementById("calc");

  function fmtTo(n, cur) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n); }
    catch (e) { return CC.num(n, 2) + " " + cur; }
  }

  /** Returns what the recipient gets and the full cost, in the sending currency. */
  function compare(amount, mid, fee, rate, deduct) {
    var converted = deduct ? amount - fee : amount;
    if (converted <= 0) return null;
    var received = converted * rate;
    var paid = deduct ? amount : amount + fee;
    var hidden = converted * (mid - rate) / mid;
    var total = fee + hidden;
    return { received: received, paid: paid, total: total, pct: total / paid * 100 };
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function calc() {
    var amount = CC.val("amount"), mid = CC.val("mid");
    var to = document.getElementById("to").value;
    var deduct = document.getElementById("feeMode").value === "deduct";
    var tbody = document.getElementById("results");
    if (!(amount > 0) || !(mid > 0)) {
      CC.set("outBest", "—"); tbody.innerHTML = "";
      CC.set("outNote", "Enter the amount you send and today's market rate.");
      return;
    }
    var rows = [];
    for (var i = 1; i <= 3; i++) {
      var rate = CC.val("r" + i), fee = CC.val("f" + i) || 0;
      var name = document.getElementById("n" + i).value.trim() || "Provider " + i;
      if (!(rate > 0)) continue;
      var c = compare(amount, mid, fee, rate, deduct);
      if (c) { c.name = name; rows.push(c); }
    }
    if (!rows.length) {
      CC.set("outBest", "—"); tbody.innerHTML = "";
      CC.set("outNote", "Enter at least one provider's exchange rate.");
      return;
    }
    // Rank by money received per unit paid, so "added" and "deducted" fees compare fairly.
    rows.sort(function (a, b) { return b.received / b.paid - a.received / a.paid; });
    var best = rows[0];
    CC.set("bestLabel", "Best value: " + best.name);
    CC.set("outBest", fmtTo(best.received, to));
    tbody.innerHTML = rows.map(function (r, i) {
      return "<tr" + (i === 0 ? ' style="font-weight:700;background:#e5f1ed"' : "") + "><td>" + esc(r.name) +
        "</td><td>" + CC.money(r.paid) + "</td><td>" + fmtTo(r.received, to) + "</td><td>" + CC.money(r.total) + "</td><td>" + CC.num(r.pct, 1) + "%</td></tr>";
    }).join("");

    var note = "At the market rate with no fees, " + CC.money(amount) + " would be " + fmtTo(amount * mid, to) + ".";
    if (rows.length > 1) {
      var worst = rows[rows.length - 1];
      note += " " + best.name + " costs you " + CC.money(worst.total - best.total) + " less in total than " + worst.name + ". Best value means the most money received for every unit you pay.";
    }
    CC.set("outNote", note);
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__transfer = { compare: compare };
})();
