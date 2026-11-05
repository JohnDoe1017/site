// Same math as the Rental & Flip Deal Analyzer workbook.
(function (root) {
  function payment(loan, annualRate, years) {
    if (loan <= 0 || years <= 0) return 0;
    var n = years * 12, i = annualRate / 12;
    return i === 0 ? loan / n : loan * i / (1 - Math.pow(1 + i, -n));
  }
  function flip(d) {
    var repairs = d.repairs * (1 + d.contingency), hold = d.holding * d.months;
    var sell = d.arv * d.sellCost, buy = d.price * d.buyCost, loan = d.price * d.loanShare;
    var interest = loan * d.rate * d.months / 12, points = loan * d.points;
    var total = d.price + repairs + buy + sell + hold + interest + points;
    var profit = d.arv - total;
    var cash = d.price - loan + repairs + buy + hold + interest + points;
    var maxOffer = (d.arv * (1 - d.sellCost) - repairs - hold - d.target) /
      (1 + d.buyCost + d.loanShare * d.rate * d.months / 12 + d.loanShare * d.points);
    return { profit: profit, cash: cash, roi: cash > 0 ? profit / cash : 0, maxOffer: maxOffer,
             room: maxOffer - d.price, seventy: d.arv * 0.7 - d.repairs, total: total };
  }
  function rental(d) {
    var loan = d.price * (1 - d.down), pay = payment(loan, d.rate, d.years);
    var vacancy = d.rent * d.vacancy;
    var expenses = d.rent * (d.repairs + d.capex + d.mgmt) + d.taxes / 12 + d.insurance / 12 + d.other;
    var noi = d.rent - vacancy - expenses, flow = noi - pay;
    var cash = d.price * d.down + d.rehab + d.closing;
    return { loan: loan, pay: pay, noi: noi, flow: flow, cash: cash,
             coc: cash > 0 ? flow * 12 / cash : 0, cap: d.price > 0 ? noi * 12 / d.price : 0,
             dscr: pay > 0 ? noi / pay : null };
  }
  function brrrr(d) {
    var allIn = d.price + d.rehab + d.closing + d.holding;
    var loan = d.value * d.ltv, back = loan - d.refiCost;
    var left = Math.max(0, allIn - back), pay = payment(loan, d.rate, d.years);
    var flow = d.rent - d.expenses - pay;
    return { allIn: allIn, loan: loan, left: left, extra: Math.max(0, back - allIn),
             share: allIn > 0 ? Math.min(1, back / allIn) : 0, pay: pay, flow: flow,
             equity: d.value - loan, coc: left > 0 ? flow * 12 / left : null };
  }
  var api = { payment: payment, flip: flip, rental: rental, brrrr: brrrr };
  if (typeof module !== 'undefined') module.exports = api;
  root.DealMath = api;

  if (typeof document === 'undefined') return;
  var usd = function (v) {
    var s = '$' + Math.abs(Math.round(v)).toLocaleString('en-US');
    return v < -0.5 ? '(' + s + ')' : s;
  };
  var pct = function (v) { return (v * 100).toFixed(1) + '%'; };
  root.DealUI = function (calc, render) {
    var form = document.querySelector('form'), out = document.getElementById('results');
    function update() {
      var d = {};
      form.querySelectorAll('input').forEach(function (el) {
        var v = parseFloat(el.value);
        if (isNaN(v)) v = 0;
        d[el.name] = el.dataset.pct !== undefined ? v / 100 : v;
      });
      var rows = render(calc(d), usd, pct);
      out.innerHTML = rows.map(function (r) {
        return '<div class="row' + (r[2] ? ' key' : '') + '"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div>';
      }).join('');
    }
    form.addEventListener('input', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  };
})(typeof window !== 'undefined' ? window : globalThis);
