(function () {
  "use strict";
  var root = document.getElementById("calc");

  function split(income, pn, pw) {
    var ps = 100 - pn - pw;
    return { needs: income * pn / 100, wants: income * pw / 100, save: income * ps / 100, pn: pn, pw: pw, ps: ps };
  }

  function compare(id, actual, target, isSave) {
    if (!(actual >= 0) || isNaN(actual)) { CC.set(id, ""); return; }
    var d = actual - target;
    if (Math.abs(d) < 0.5) CC.set(id, "On target ✓");
    else if (isSave) CC.set(id, d > 0 ? "You save " + CC.money(d, true) + " more ✓" : CC.money(-d, true) + " below target");
    else CC.set(id, d > 0 ? "You spend " + CC.money(d, true) + " over" : CC.money(-d, true) + " under ✓");
  }

  function calc() {
    var income = CC.val("income");
    var mode = document.getElementById("split").value;
    document.getElementById("customRow").style.display = mode === "custom" ? "" : "none";
    var pn, pw;
    if (mode === "custom") { pn = CC.val("pn"); pw = CC.val("pw"); }
    else { var p = mode.split("-").map(Number); pn = p[0]; pw = p[1]; }

    if (!(income > 0) || !(pn >= 0) || !(pw >= 0) || pn + pw > 100) {
      ["outSave", "outNeeds", "outWants", "outSave2", "outYear", "outEmergency"].forEach(function (id) { CC.set(id, "—"); });
      CC.set("outNote", pn + pw > 100 ? "Needs and wants can't add up to more than 100%." : "Enter your monthly take-home income.");
      return;
    }
    var s = split(income, pn, pw);
    CC.set("lblNeeds", "Needs (" + CC.num(s.pn, 1) + "%)");
    CC.set("lblWants", "Wants (" + CC.num(s.pw, 1) + "%)");
    CC.set("lblSave", "Savings (" + CC.num(s.ps, 1) + "%)");
    CC.set("outSave", CC.money(s.save));
    CC.set("outNeeds", CC.money(s.needs));
    CC.set("outWants", CC.money(s.wants));
    CC.set("outSave2", CC.money(s.save));
    CC.set("outYear", CC.money(s.save * 12, true));

    var an = CC.val("an"), aw = CC.val("aw");
    var hasActual = an >= 0 || aw >= 0;
    var needsBase = an > 0 ? an : s.needs;
    CC.set("outEmergency", CC.money(needsBase * 3, true));
    document.getElementById("bar").innerHTML =
      '<span style="width:' + s.pn + '%;background:#0f5e4b"></span>' +
      '<span style="width:' + s.pw + '%;background:#5b8def"></span>' +
      '<span style="width:' + s.ps + '%;background:#e9a23b"></span>';

    compare("cmpNeeds", an, s.needs, false);
    compare("cmpWants", aw, s.wants, false);
    var note = "";
    if (hasActual) {
      var actualSave = income - (an || 0) - (aw || 0);
      compare("cmpSave", actualSave, s.save, true);
      note = actualSave < 0
        ? "You're spending " + CC.money(-actualSave) + " more than you earn each month. Start with the biggest needs and wants."
        : "Based on your spending, you have " + CC.money(actualSave) + " left to save each month (" + CC.num(actualSave / income * 100, 0) + "% of income).";
    } else {
      CC.set("cmpSave", "");
      note = "Saving " + CC.money(s.save) + " a month builds a 3-month emergency fund in about " +
        CC.num(Math.ceil(needsBase * 3 / s.save), 0) + " months.";
      if (!(s.save > 0)) note = "This split leaves nothing for savings. Try to save at least a little each month.";
    }
    CC.set("outNote", note);
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__budget = { split: split };
})();
