/**
 * 刷题录入与刷题历史页面
 */
const PracticePage = {
  currentTab: 'xingce',
  chart: null,

  render() {
    let html = `<div class="page active" id="page-practice">`;
    html += `<div class="page-header">✎ 刷题记录</div>`;

    // 切换标签
    html += `
      <div class="tab-switch">
        <div class="tab-switch-item ${this.currentTab === 'xingce' ? 'active' : ''}" onclick="PracticePage.switchTab('xingce')">行测刷题录入</div>
        <div class="tab-switch-item ${this.currentTab === 'shenlun' ? 'active' : ''}" onclick="PracticePage.switchTab('shenlun')">申论刷题录入</div>
      </div>
    `;

    if (this.currentTab === 'xingce') {
      html += this.renderXingceForm();
    } else {
      html += this.renderShenlunForm();
    }

    // 趋势图（仅行测）
    if (this.currentTab === 'xingce') {
      html += this.renderChart();
    }

    // 刷题历史
    html += this.renderHistory();

    html += `</div>`;
    document.getElementById('page-container').innerHTML = html;

    if (this.currentTab === 'xingce') {
      this.renderChartChart();
    }
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  // ===== 行测录入表单 =====
  renderXingceForm() {
    const notebooks = Store.getData().xingceNotebooks.filter(n => !n.deleted);
    const subItems = Store.getData().xingceSubItems.filter(s => !s.deleted);
    
    let html = `<div class="card practice-form-card"><div class="card-title"><span class="left">行测刷题录入</span></div>`;
    
    html += `
      <div class="form-group">
        <label class="form-label">刷题类型</label>
        <select class="form-select" id="xc-type">
          <option value="模块题">模块题</option>
          <option value="套题">套题</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">归属刷题本</label>
        <select class="form-select" id="xc-notebook" onchange="PracticePage.updateXingceSubSelect()">
          <option value="">请选择</option>
    `;
    notebooks.forEach(n => {
      html += `<option value="${n.id}">${Utils.escape(n.name)}（${Utils.escape(n.module)}）</option>`;
    });
    html += `
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">二级子条目（知识点/题型）</label>
        <select class="form-select" id="xc-subitem">
          <option value="">请先选择刷题本</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">总题量</label>
          <input class="form-input" id="xc-total" type="number" inputmode="numeric" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">做对题量</label>
          <input class="form-input" id="xc-correct" type="number" inputmode="numeric" placeholder="0">
        </div>
      </div>
      <button class="btn btn-primary btn-block" onclick="PracticePage.submitXingce()">提交刷题记录</button>
    </div>`;
    
    return html;
  },

  updateXingceSubSelect() {
    const notebookId = document.getElementById('xc-notebook').value;
    const subItems = Store.getData().xingceSubItems.filter(s => !s.deleted && s.notebookId === notebookId);
    const sel = document.getElementById('xc-subitem');
    if (subItems.length === 0) {
      sel.innerHTML = '<option value="">该题本暂无二级条目</option>';
    } else {
      sel.innerHTML = '<option value="">请选择</option>' + subItems.map(s => 
        `<option value="${s.id}">${Utils.escape(s.name)}</option>`
      ).join('');
    }
  },

  submitXingce() {
    const type = document.getElementById('xc-type').value;
    const notebookId = document.getElementById('xc-notebook').value;
    const subItemId = document.getElementById('xc-subitem').value;
    const totalEl = document.getElementById('xc-total');
    const correctEl = document.getElementById('xc-correct');

    if (!notebookId) { Modal.toast('请选择刷题本'); return; }
    if (!subItemId) { Modal.toast('请选择二级子条目'); return; }

    const totalV = Utils.validateNumber(totalEl.value, true);
    if (!totalV.ok) { Modal.toast(totalV.msg); return; }
    const correctV = Utils.validateNumber(correctEl.value, true);
    if (!correctV.ok) { Modal.toast(correctV.msg); return; }
    if (totalV.num === 0) { Modal.toast('总题量不能为0'); return; }
    if (correctV.num > totalV.num) { Modal.toast('做对题量不能大于总题量'); return; }

    const record = {
      id: Store.genId(),
      type: 'xingce',
      date: Store.today(),
      practiceType: type,
      notebookId: notebookId,
      subItemId: subItemId,
      total: totalV.num,
      correct: correctV.num,
      rate: Utils.safeDivide(correctV.num, totalV.num),
      deleted: false,
      createdAt: new Date().toISOString(),
    };
    Store.getData().practiceRecords.push(record);

    // 更新二级条目统计
    this.updateXingceSubItemStats(subItemId, totalV.num, correctV.num, type);
    Store.save();

    Modal.toast('刷题记录已保存');
    this.render();
  },

  updateXingceSubItemStats(subItemId, total, correct, practiceType) {
    const sub = Store.getData().xingceSubItems.find(s => s.id === subItemId);
    if (!sub) return;
    const wrong = total - correct;
    if (practiceType === '模块题') {
      // 一刷
      sub.firstTotal = (sub.firstTotal || 0) + total;
      sub.firstDone = (sub.firstDone || 0) + total;
      sub.firstWrong = (sub.firstWrong || 0) + wrong;
    } else {
      // 套题 - 也算一刷
      sub.firstTotal = (sub.firstTotal || 0) + total;
      sub.firstDone = (sub.firstDone || 0) + total;
      sub.firstWrong = (sub.firstWrong || 0) + wrong;
    }
  },

  // ===== 申论录入表单 =====
  renderShenlunForm() {
    const notebooks = Store.getData().shenlunNotebooks.filter(n => !n.deleted);
    
    let html = `<div class="card practice-form-card"><div class="card-title"><span class="left">申论刷题录入</span></div>`;
    
    html += `
      <div class="form-group">
        <label class="form-label">归属申论刷题本</label>
        <select class="form-select" id="sl-notebook" onchange="PracticePage.updateShenlunSubSelect()">
          <option value="">请选择</option>
    `;
    notebooks.forEach(n => {
      html += `<option value="${n.id}">${Utils.escape(n.name)}</option>`;
    });
    html += `
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">二级题型</label>
        <select class="form-select" id="sl-subitem">
          <option value="">请先选择刷题本</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">刷题模式</label>
        <select class="form-select" id="sl-mode">
          <option value="专项小题">专项小题</option>
          <option value="整套申论套卷">整套申论套卷</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">作答类型</label>
        <select class="form-select" id="sl-round">
          <option value="一刷">一刷</option>
          <option value="二刷">二刷（重写复盘）</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">满分分值</label>
          <input class="form-input" id="sl-fullscore" type="number" inputmode="decimal" placeholder="如100">
        </div>
        <div class="form-group">
          <label class="form-label">自评得分</label>
          <input class="form-input" id="sl-score" type="number" inputmode="decimal" placeholder="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">漏写要点/问题记录（可留空）</label>
        <textarea class="form-textarea" id="sl-issues" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">复盘笔记（可留空）</label>
        <textarea class="form-textarea" id="sl-notes" rows="3"></textarea>
      </div>
      <button class="btn btn-primary btn-block" onclick="PracticePage.submitShenlun()">提交申论记录</button>
    </div>`;
    
    return html;
  },

  updateShenlunSubSelect() {
    const notebookId = document.getElementById('sl-notebook').value;
    const subItems = Store.getData().shenlunSubItems.filter(s => !s.deleted && s.notebookId === notebookId);
    const sel = document.getElementById('sl-subitem');
    if (subItems.length === 0) {
      sel.innerHTML = '<option value="">该题本暂无二级题型</option>';
    } else {
      sel.innerHTML = '<option value="">请选择</option>' + subItems.map(s =>
        `<option value="${s.id}">${Utils.escape(s.name)}</option>`
      ).join('');
    }
  },

  submitShenlun() {
    const notebookId = document.getElementById('sl-notebook').value;
    const subItemId = document.getElementById('sl-subitem').value;
    const mode = document.getElementById('sl-mode').value;
    const round = document.getElementById('sl-round').value;
    const fullScoreEl = document.getElementById('sl-fullscore');
    const scoreEl = document.getElementById('sl-score');
    const issues = document.getElementById('sl-issues').value.trim();
    const notes = document.getElementById('sl-notes').value.trim();

    if (!notebookId) { Modal.toast('请选择刷题本'); return; }
    if (!subItemId) { Modal.toast('请选择二级题型'); return; }

    const fullV = Utils.validateNumber(fullScoreEl.value, false);
    if (!fullV.ok) { Modal.toast('满分分值：' + fullV.msg); return; }
    const scoreV = Utils.validateNumber(scoreEl.value, true);
    if (!scoreV.ok) { Modal.toast('自评得分：' + scoreV.msg); return; }
    if (scoreV.num > fullV.num) { Modal.toast('自评得分不能大于满分'); return; }

    const record = {
      id: Store.genId(),
      type: 'shenlun',
      date: Store.today(),
      notebookId: notebookId,
      subItemId: subItemId,
      mode: mode,
      round: round,
      fullScore: fullV.num,
      score: scoreV.num,
      issues: issues,
      notes: notes,
      deleted: false,
      createdAt: new Date().toISOString(),
    };
    Store.getData().practiceRecords.push(record);

    // 更新申论二级题型统计
    this.updateShenlunSubItemStats(subItemId, round, scoreV.num);
    Store.save();

    Modal.toast('申论记录已保存');
    this.render();
  },

  updateShenlunSubItemStats(subItemId, round, score) {
    const sub = Store.getData().shenlunSubItems.find(s => s.id === subItemId);
    if (!sub) return;
    if (round === '一刷') {
      sub.firstCount = (sub.firstCount || 0) + 1;
      sub.firstScoreSum = (sub.firstScoreSum || 0) + score;
    } else {
      sub.secondCount = (sub.secondCount || 0) + 1;
      sub.secondScoreSum = (sub.secondScoreSum || 0) + score;
    }
  },

  // ===== 趋势图 =====
  renderChart() {
    return `
      <div class="card">
        <div class="card-title"><span class="left">▲ 行测刷题趋势</span></div>
        <div class="chart-container"><svg id="practice-chart" width="100%" height="200" viewBox="0 0 360 200" preserveAspectRatio="none"></svg></div>
      </div>
    `;
  },

  renderChartChart() {
    const svg = document.getElementById('practice-chart');
    if (!svg) return;

    const records = Store.getData().practiceRecords.filter(r => !r.deleted && r.type === 'xingce');
    
    // 按日期聚合
    const dateMap = {};
    records.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { total: 0, correct: 0 };
      dateMap[r.date].total += r.total;
      dateMap[r.date].correct += r.correct;
    });

    const dates = Object.keys(dateMap).sort();
    
    if (dates.length === 0) {
      svg.innerHTML = `<text x="180" y="100" text-anchor="middle" font-size="13" fill="#999">暂无刷题数据</text>`;
      return;
    }

    const totals = dates.map(d => dateMap[d].total);
    const rates = dates.map(d => Utils.safeDivide(dateMap[d].correct, dateMap[d].total) * 100);

    const W = 360, H = 200, PAD_L = 38, PAD_R = 38, PAD_T = 20, PAD_B = 36;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    
    const maxTotal = Math.max(...totals, 1);
    const yScale = plotH / maxTotal;
    const xScale = dates.length > 1 ? plotW / (dates.length - 1) : 0;
    
    // 构建路径
    const pointsTotal = totals.map((v, i) => `${PAD_L + i*xScale},${PAD_T + plotH - v * yScale}`).join(' ');
    const pointsRate = rates.map((v, i) => `${PAD_L + i*xScale},${PAD_T + plotH - v/100 * plotH}`).join(' ');

    let svgContent = '';
    // Y轴标签 - 题量
    for (let i = 0; i <= 4; i++) {
      const v = Math.round(maxTotal * i / 4);
      const y = PAD_T + plotH - v * yScale;
      svgContent += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
      svgContent += `<text x="${PAD_L-4}" y="${y+4}" font-size="10" fill="#999" text-anchor="end">${v}</text>`;
    }
    // Y轴标签 - 正确率
    for (let i = 0; i <= 4; i++) {
      const pct = 25 * i;
      const y = PAD_T + plotH - pct/100 * plotH;
      svgContent += `<text x="${W-PAD_R+4}" y="${y+4}" font-size="10" fill="#999">${pct}%</text>`;
    }
    
    // 题量曲线
    svgContent += `<polyline points="${pointsTotal}" fill="none" stroke="#9698E7" stroke-width="2"/>`;
    // 正确率曲线
    svgContent += `<polyline points="${pointsRate}" fill="none" stroke="#EECIDD" stroke-width="2" stroke-dasharray="3,2"/>`;
    
    // 数据点
    totals.forEach((v, i) => {
      const x = PAD_L + i*xScale;
      const y = PAD_T + plotH - v * yScale;
      svgContent += `<circle cx="${x}" cy="${y}" r="3" fill="#9698E7"/>`;
    });
    rates.forEach((v, i) => {
      const x = PAD_L + i*xScale;
      const y = PAD_T + plotH - v/100 * plotH;
      svgContent += `<circle cx="${x}" cy="${y}" r="3" fill="#EECIDD"/>`;
    });
    
    // X轴日期标签
    const showStep = Math.max(1, Math.ceil(dates.length / 6));
    dates.forEach((d, i) => {
      if (i % showStep === 0 || i === dates.length - 1) {
        const x = PAD_L + i*xScale;
        svgContent += `<text x="${x}" y="${H-10}" font-size="9" fill="#999" text-anchor="middle">${d.slice(5)}</text>`;
      }
    });

    // 图例
    svgContent += `
      <line x1="10" y1="14" x2="22" y2="14" stroke="#9698E7" stroke-width="2"/>
      <text x="26" y="17" font-size="10" fill="#666">题量</text>
      <line x1="60" y1="14" x2="72" y2="14" stroke="#EECIDD" stroke-width="2" stroke-dasharray="3,2"/>
      <text x="76" y="17" font-size="10" fill="#666">正确率%</text>
    `;

    svg.innerHTML = svgContent;
    this.chart = { destroy: () => {} };
  },

  // ===== 刷题历史 =====
  renderHistory() {
    const records = Store.getData().practiceRecords.filter(r => !r.deleted).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    let html = `<div class="card"><div class="card-title"><span class="left">≡ 刷题历史</span></div>`;
    
    if (records.length === 0) {
      html += `<div class="empty-state"><div class="icon">●</div>暂无刷题记录</div>`;
    } else {
      records.forEach(r => {
        const isXingce = r.type === 'xingce';
        let detail = '';
        let titleExtra = '';
        
        if (isXingce) {
          const notebook = Store.getData().xingceNotebooks.find(n => n.id === r.notebookId);
          const sub = Store.getData().xingceSubItems.find(s => s.id === r.subItemId);
          const ratePct = Math.round(r.rate * 100);
          titleExtra = `${r.practiceType}`;
          detail = `${notebook ? Utils.escape(notebook.name) : '已删除题本'} / ${sub ? Utils.escape(sub.name) : '已删除条目'} · ${r.correct}/${r.total} · 正确率${ratePct}%`;
        } else {
          const notebook = Store.getData().shenlunNotebooks.find(n => n.id === r.notebookId);
          const sub = Store.getData().shenlunSubItems.find(s => s.id === r.subItemId);
          titleExtra = `${r.round} · ${r.mode}`;
          detail = `${notebook ? Utils.escape(notebook.name) : '已删除题本'} / ${sub ? Utils.escape(sub.name) : '已删除条目'} · 得分${r.score}/${r.fullScore}`;
        }

        html += `
          <div class="practice-history-item">
            <div class="top">
              <span class="badge ${isXingce ? 'badge-primary' : 'badge-secondary'}">${isXingce ? '行测' : '申论'}</span>
              <span class="date">${r.date}</span>
            </div>
            <div class="title-line">${titleExtra}</div>
            <div class="detail">${detail}</div>
        `;
        if (!isXingce && r.issues) {
          html += `<div class="notes"><b>问题：</b>${Utils.escape(r.issues)}</div>`;
        }
        if (!isXingce && r.notes) {
          html += `<div class="notes"><b>复盘：</b>${Utils.escape(r.notes)}</div>`;
        }
        html += `
            <div class="actions">
              <button onclick="PracticePage.deleteRecord('${r.id}')">删除</button>
            </div>
          </div>
        `;
      });
    }
    
    html += `</div>`;
    return html;
  },

  deleteRecord(id) {
    Modal.confirm('删除记录', '确定将此刷题记录移入回收站？', () => {
      Store.softDelete('practiceRecords', id);
      this.render();
      Modal.toast('已移入回收站');
    }, { danger: true, confirmText: '删除' });
  },
};
