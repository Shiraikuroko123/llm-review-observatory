'use strict';
const studies = {
  2022: {
    note: '预先固定查询策略后，在四个翻译方向上比较自动评分和人工评分如何引导复核。',
    labels: ['仅凭已查人评', 'COMET 自动分引导'],
    panels: [
      ['EN–DE', '英语 → 德语', 12507.75, 7688],
      ['EN–RU', '英语 → 俄语', 10525.4375, 6303],
      ['EN–ZH', '英语 → 中文', 16692.0625, 11855],
      ['ZH–EN', '中文 → 英语', 14505.9375, 9409]
    ]
  },
  2021: {
    note: '把每个系统的初始平均预测拉平，只保留系统内部的译文排序，检验排序本身的作用。',
    labels: ['所有译文相同预测', '仅用系统内排序'],
    panels: [
      ['EN–DE', '英语 → 德语', 4042.875, 2876.6875],
      ['ZH–EN', '中文 → 英语', 4506.125, 3349]
    ]
  }
};
const number = new Intl.NumberFormat('zh-CN', {maximumFractionDigits: 2});
const element = id => document.getElementById(id);
const savings = (base, guided, year) => ((1-guided/base)*100).toFixed(year === '2022' ? 1 : 2) + '%';
const language = element('language');
const yearButtons = Array.from(document.querySelectorAll('[data-study]'));
let year;
function displayPanel() {
  const study = studies[year];
  const panel = study.panels.find(item => item[0] === language.value);
  const [code, title, baseline, guided] = panel;
  element('chart-code').textContent = `WMT ${year}  /  ${code}`;
  element('chart-title').textContent = title;
  element('chart-saving').textContent = `少查 ${savings(baseline, guided, year)}`;
  element('bars').replaceChildren(...[baseline, guided].map((value, i) => {
    const row = document.createElement('div');
    row.className = 'bars-row';
    row.innerHTML = '<div class="bar-caption"><span></span><strong></strong></div><div class="track" aria-hidden="true"><div class="bar"></div></div>';
    row.querySelector('span').textContent = study.labels[i];
    row.querySelector('strong').textContent = number.format(value) + ' 条';
    const bar = row.querySelector('.bar');
    bar.classList.toggle('guided', i === 1);
    bar.style.width = `${100*value/baseline}%`;
    return row;
  }));
}
function displayStudy(nextYear) {
  const previousDirection = language.value;
  year = nextYear;
  for (const button of yearButtons) button.setAttribute('aria-pressed', String(button.dataset.study === year));
  const study = studies[year];
  language.replaceChildren(...study.panels.map(([code, title]) => new Option(title, code)));
  if (study.panels.some(panel => panel[0] === previousDirection)) language.value = previousDirection;
  element('study-note').textContent = study.note;
  displayPanel();
}
for (const button of yearButtons) button.addEventListener('click', () => displayStudy(button.dataset.study));
language.addEventListener('change', displayPanel);
displayStudy('2022');
const table = element('all-rows');
for (const y of ['2022', '2021']) {
  for (const [, title, base, guided] of studies[y].panels) {
    const row = document.createElement('tr');
    for (const cell of [`WMT${y}`, title, number.format(base), number.format(guided), savings(base, guided, y)]) {
      row.insertCell().textContent = cell;
    }
    table.append(row);
  }
}
