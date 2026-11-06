(function () {
  "use strict";
  var root = document.getElementById("calc");

  /** Converts any pay figure to a yearly amount, then back out to every period. */
  function convert(pay, period, hours, days, unpaid) {
    var weeks = 52 - unpaid;
    var hourly;
    switch (period) {
      case "hour": hourly = pay; break;
      case "day": hourly = pay / (hours / days); break;
      case "week": hourly = pay / hours; break;
      case "biweek": hourly = pay / (hours * 2); break;
      case "month": hourly = pay * 12 / (hours * weeks); break;
      default: hourly = pay / (hours * weeks);
    }
    var yearly = hourly * hours * weeks;
    return {
      hour: hourly, day: hourly * hours / days, week: hourly * hours,
      biweek: hourly * hours * 2, month: yearly / 12, year: yearly
    };
  }

  function calc() {
    var pay = CC.val("pay"), period = document.getElementById("period").value;
    var hours = CC.val("hours"), days = CC.val("days"), unpaid = CC.val("unpaid") || 0;
    if (!(pay > 0) || !(hours > 0 && hours <= 168) || !(days > 0 && days <= 7) || !(unpaid >= 0 && unpaid < 52)) {
      ["outHour", "outDay", "outWeek", "outBiweek", "outMonth", "outYear"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", "Enter your pay, hours per week (1–168), days per week (1–7) and unpaid weeks (0–51).");
      return;
    }
    var c = convert(pay, period, hours, days, unpaid);
    CC.set("outHour", CC.money(c.hour));
    CC.set("outDay", CC.money(c.day));
    CC.set("outWeek", CC.money(c.week));
    CC.set("outBiweek", CC.money(c.biweek));
    CC.set("outMonth", CC.money(c.month));
    CC.set("outYear", CC.money(c.year, true));
    CC.set("outNote", "Based on " + CC.num(hours * (52 - unpaid), 0) + " paid hours a year (" + CC.num(hours, 1) +
      " hours × " + CC.num(52 - unpaid, 1) + " weeks). Weekly and daily figures are for weeks you work.");
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__salary = { convert: convert };
})();
