(function () {
  "use strict";
  var root = document.getElementById("calc");

  function rate(income, expenses, taxPct, hours, weeks, bufferPct) {
    var revenue = (income / (1 - taxPct / 100) + expenses) * (1 + bufferPct / 100);
    return { revenue: revenue, hourly: revenue / (hours * weeks) };
  }

  function calc() {
    var income = CC.val("income"), expenses = CC.val("expenses") || 0, tax = CC.val("tax") || 0;
    var hours = CC.val("hours"), weeks = CC.val("weeks"), buffer = CC.val("buffer") || 0;
    if (!(income > 0) || !(hours > 0 && hours <= 100) || !(weeks > 0 && weeks <= 52) || !(tax >= 0 && tax < 100) || expenses < 0 || buffer < 0) {
      ["outHourly", "outDay", "outWeek", "outMonth", "outYear"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", "Enter your income goal, a tax rate under 100%, billable hours (1–100) and working weeks (1–52).");
      return;
    }
    var r = rate(income, expenses, tax, hours, weeks, buffer);
    var dayHours = Math.min(8, hours / 5);
    CC.set("outHourly", CC.money(r.hourly));
    CC.set("outDay", CC.money(r.hourly * dayHours, true));
    CC.set("outWeek", CC.money(r.hourly * hours, true));
    CC.set("outMonth", CC.money(r.revenue / 12, true));
    CC.set("outYear", CC.money(r.revenue, true));
    var naive = income / 2080;
    CC.set("outNote", "Day rate assumes " + CC.num(dayHours, 1) + " billable hours a day. Simply dividing your income goal by 2,080 hours would give " +
      CC.money(naive) + " an hour, which is " + CC.num((1 - naive / r.hourly) * 100, 0) + "% too low once taxes, expenses and unbilled time are counted.");
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__freelance = { rate: rate };
})();
