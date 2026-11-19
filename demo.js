(() => {
  "use strict";
  function mountAudit() {
    const host = document.getElementById("audit-demo");
    if (!host || host.querySelector(".audit-panel")) return;

    const scores = [[0, 0, 0, 0], [0, 1, 2, 3]];
    const systems = ["A", "B"];
    const size = scores[0].length;
    const cap = 25;
    const tolerance = 0.25;
    const threshold = size * tolerance;
    const revealed = new Set();
    let offset = 0;
    let firstCertificate = null;

    host.innerHTML = `
      <div class="audit-panel">
        <div class="audit-controls">
          <div class="audit-switch" role="group" aria-label="选择示意评分场景，切换后重新开始">
            <button type="button" data-offset="0" aria-pressed="true">原始评分</button>
            <button type="button" data-offset="10" aria-pressed="false">全部加 10 分</button>
          </div>
          <button class="audit-reset" type="button" data-reset><span aria-hidden="true">↺</span> 重新开始</button>
        </div>
        <div class="audit-workbench">
          <div class="audit-board">
            <p class="audit-board-label">示意评分</p>
            <p class="audit-instruction">点击方格查看人工罚分。每打开一格，就花费一次核验。</p>
            <table class="audit-cells" aria-label="两套翻译系统的逐条人工罚分，分数越低越好">
              <thead><tr><td></td>${scores[0].map((_, col) => `<th scope="col">译文 ${col + 1}</th>`).join("")}</tr></thead>
              <tbody>${systems.map((name, row) => `
                <tr><th scope="row">系统 ${name}</th>${scores[row].map((_, col) => `
                  <td><button type="button" class="audit-cell" data-cell="${row * size + col}" aria-label="核验系统 ${name} 的译文 ${col + 1}">?</button></td>`).join("")}</tr>
              `).join("")}</tbody>
            </table>
            <p class="audit-cost"><span>已核验</span> <b data-count>0</b> / 8 条</p>
          </div>
          <div class="audit-readout">
            <p class="audit-verdict" data-verdict>继续核验</p>
            <p class="audit-gap" data-gap>100</p>
            <p class="audit-gap-label">总罚分之差（A − B）的上界</p>
            <p class="audit-explain" data-explain></p>
          </div>
        </div>
        <details class="audit-details">
          <summary>什么时候可以停止核验？</summary>
          <p>罚分越低越好。把 A 未查的每条按 25 分算，得到 A 的总罚分上界。把 B 未查的每条按 0 分算，得到 B 的总罚分下界。两者之差 ≤ 1，就能保证 A 的平均罚分至多比 B 高 0.25 分。</p>
          <p>原始场景中，先查完 A 的四条就可停止。切换到「全部加 10 分」后，两套系统的平均分差仍是 1.5，但这次必须查完八条才能认证。两组示意评分取自论文附录。</p>
        </details>
        <span class="audit-live" role="status" aria-atomic="true"></span>
      </div>`;

    const select = (selector) => host.querySelector(selector);
    const cellButtons = Array.from(host.querySelectorAll("[data-cell]"));
    const modeButtons = Array.from(host.querySelectorAll("[data-offset]"));
    function redraw(announcement = "") {
      let upperA = size * cap;
      let lowerB = 0;
      for (const index of revealed) {
        const row = Math.floor(index / size);
        const value = scores[row][index % size] + offset;
        if (row === 0) upperA -= cap - value;
        else lowerB += value;
      }
      const gap = upperA - lowerB;
      const certified = gap <= threshold;
      if (certified && firstCertificate === null) firstCertificate = revealed.size;
      modeButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.offset) === offset));
      });
      cellButtons.forEach((button, index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        const value = scores[row][col] + offset;
        const isOpen = revealed.has(index);
        button.textContent = isOpen ? String(value) : "?";
        button.setAttribute("aria-disabled", String(isOpen));
        button.setAttribute("aria-label", isOpen
          ? `系统 ${systems[row]} 译文 ${col + 1} 已核验，罚分 ${value}`
          : `核验系统 ${systems[row]} 的译文 ${col + 1}`);
      });
      select("[data-count]").textContent = String(revealed.size);
      select("[data-gap]").textContent = String(gap).replace("-", "−");
      const verdict = certified ? "已认证 A 在容差内" : "继续核验";
      select("[data-verdict]").textContent = verdict;
      select(".audit-readout").classList.toggle("audit-certified", certified);
      select("[data-explain]").textContent = certified
        ? `第 ${firstCertificate} 次核验时，差值已降至 1 分以内，可以停止。`
        : `A 的上界 ${upperA} − B 的下界 ${lowerB} = ${gap}。差值 ≤ 1 时可以停止。`;
      if (announcement) {
        select(".audit-live").textContent = `${announcement}。已核验 ${revealed.size} 条。差值 ${gap}。${verdict}。`;
      }
    }

    host.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || !host.contains(button)) return;
      if (button.hasAttribute("data-cell")) {
        const index = Number(button.dataset.cell);
        if (revealed.has(index)) return;
        revealed.add(index);
        const row = Math.floor(index / size);
        const col = index % size;
        redraw(`系统 ${systems[row]} 译文 ${col + 1} 的罚分是 ${scores[row][col] + offset}`);
      } else if (button.hasAttribute("data-offset") || button.hasAttribute("data-reset")) {
        if (button.hasAttribute("data-offset")) {
          const next = Number(button.dataset.offset);
          if (next === offset) return;
          offset = next;
        }
        revealed.clear();
        firstCertificate = null;
        redraw(`已重新开始${offset === 0 ? "原始评分" : "全部加十分"}场景`);
      }
    });
    redraw();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAudit, { once: true });
  } else {
    mountAudit();
  }
})();
