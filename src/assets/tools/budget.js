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
    if (Math.abs(d) < 0.5) CC.set(id, CC.tr("On target ✓", "Objectif atteint ✓"));
    else if (isSave) CC.set(id, d > 0 ? CC.tr("You save " + CC.money(d, true) + " more ✓", "Vous épargnez " + CC.money(d, true) + " de plus ✓")
      : CC.money(-d, true) + CC.tr(" below target", " sous l'objectif"));
    else CC.set(id, d > 0 ? CC.tr("You spend " + CC.money(d, true) + " over", "Vous dépensez " + CC.money(d, true) + " de trop")
      : CC.money(-d, true) + CC.tr(" under ✓", " de moins ✓"));
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
      CC.set("outNote", pn + pw > 100 ? CC.tr("Needs and wants can't add up to more than 100%.", "Les besoins et les envies ne peuvent pas dépasser 100 % au total.")
        : CC.tr("Enter your monthly take-home income.", "Saisissez votre revenu mensuel net."));
      return;
    }
    var s = split(income, pn, pw);
    CC.set("lblNeeds", CC.tr("Needs (", "Besoins (") + CC.num(s.pn, 1) + CC.tr("%)", " %)"));
    CC.set("lblWants", CC.tr("Wants (", "Envies (") + CC.num(s.pw, 1) + CC.tr("%)", " %)"));
    CC.set("lblSave", CC.tr("Savings (", "Épargne (") + CC.num(s.ps, 1) + CC.tr("%)", " %)"));
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
        ? CC.tr("You're spending " + CC.money(-actualSave) + " more than you earn each month. Start with the biggest needs and wants.",
            "Vous dépensez " + CC.money(-actualSave) + " de plus que ce que vous gagnez chaque mois. Commencez par les plus gros postes.")
        : CC.tr("Based on your spending, you have " + CC.money(actualSave) + " left to save each month (" + CC.num(actualSave / income * 100, 0) + "% of income).",
            "D'après vos dépenses, il vous reste " + CC.money(actualSave) + " à épargner chaque mois (" + CC.num(actualSave / income * 100, 0) + " % du revenu).");
    } else {
      CC.set("cmpSave", "");
      note = CC.tr("Saving " + CC.money(s.save) + " a month builds a 3-month emergency fund in about " + CC.num(Math.ceil(needsBase * 3 / s.save), 0) + " months.",
        "En épargnant " + CC.money(s.save) + " par mois, vous constituez une épargne de précaution de 3 mois en environ " + CC.num(Math.ceil(needsBase * 3 / s.save), 0) + " mois.");
      if (!(s.save > 0)) note = CC.tr("This split leaves nothing for savings. Try to save at least a little each month.",
        "Cette répartition ne laisse rien pour l'épargne. Essayez de mettre au moins un peu de côté chaque mois.");
    }
    CC.set("outNote", note);
  }

  CC.bind(root, calc);
  document.getElementById("share").addEventListener("click", function () { CC.shareLink(root, this); });
  window.__budget = { split: split };
})();
