(function () {
  "use strict";
  var root = document.getElementById("calc");

  function needed(goal, have, ratePct, months) {
    var i = ratePct / 100 / 12;
    var grown = have * Math.pow(1 + i, months);
    var rest = goal - grown;
    if (rest <= 0) return { pmt: 0, grown: grown };
    var pmt = i === 0 ? rest / months : rest * i / (Math.pow(1 + i, months) - 1);
    return { pmt: pmt, grown: grown };
  }

  function calc() {
    var goal = CC.val("goal"), have = CC.val("have") || 0, years = CC.val("years"), rate = CC.val("rate") || 0;
    var months = Math.round(years * 12);
    if (!(goal > 0) || !(months > 0) || have < 0 || rate < 0) {
      ["outMonthly", "outWeekly", "outDaily", "outDeposits", "outInterest"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", "Enter a goal and how long you have to reach it.");
      return;
    }
    var r = needed(goal, have, rate, months);
    if (r.pmt === 0) {
      CC.set("outMonthly", CC.money(0));
      ["outWeekly", "outDaily", "outDeposits"].forEach(function (id) { CC.set(id, CC.money(0)); });
      CC.set("outInterest", CC.money(r.grown - have, true));
      CC.set("outNote", "You're already on track: your current savings grow to about " + CC.money(r.grown, true) + " by then.");
      return;
    }
    var deposits = r.pmt * months;
    CC.set("outMonthly", CC.money(r.pmt));
    CC.set("outWeekly", CC.money(r.pmt * 12 / 52));
    CC.set("outDaily", CC.money(r.pmt * 12 / 365));
    CC.set("outDeposits", CC.money(deposits, true));
    CC.set("outInterest", CC.money(goal - deposits - have, true));
    var noInt = needed(goal, have, 0, months).pmt;
    CC.set("outNote", rate > 0
      ? "Without interest you'd need " + CC.money(noInt) + " a month, so interest saves you " + CC.money(noInt - r.pmt) + " each month."
      : "Add an interest rate to see how a savings account would lower the monthly amount.");
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__savings = { needed: needed };
})();
