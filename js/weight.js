/**
 * 体重记录页面
 */
const WeightPage = {
  chart: null,

  render() {
    let html = `<div class="page active" id="page-weight">`;
    html += `<div class="page-header">⊕ 体重记录</div>`;

    // 录入表单
    html += this.renderForm();

    // 统计
    html += this.renderStats();

    // 趋势图
    html += this.renderChart();

    // 历史列表
    html += this.renderHistory();

    html += `</div>`;
    document.getElementById('page-container').innerHTML = html;
    this.renderChartChart();
  },

  renderForm() {
    const today = Store.today();
    return `
      <div class="card">
        <div class="card-title"><span class="left">录入体重</span></div>
        <div class="form-group">
          <label class="form-label">日期</label>
          <input class="form-input" id="w-date" type="date" value="${today}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">早上体重 (kg)</label>
            <input class="form-input" id="w-morning" type="number" inputmode="decimal" placeholder="可只填一项">
          </div>
          <div class="form-group">
            <label class="form-label">晚上体重 (kg)</label>
            <input class="form-input" id="w-evening" type="number" inputmode="decimal" placeholder="可只填一项">
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="WeightPage.submit()">保存记录</button>
      </div>
    `;
  },

  submit() {
    const date = document.getElementById('w-date').value;
    const morningEl = document.getElementById('w-morning');
    const eveningEl = document.getElementById('w-evening');
    
    if (!date) { Modal.toast('请选择日期'); return; }
    
    const morningVal = morningEl.value.trim();
    const eveningVal = eveningEl.value.trim();
    
    if (!morningVal && !eveningVal) { Modal.toast('至少填写一项体重'); return; }
    
    let morning = null, evening = null;
    if (morningVal) {
      const v = Utils.validateNumber(morningVal, false);
      if (!v.ok) { Modal.toast('早上体重：' + v.msg); return; }
      morning = v.num;
    }
    if (eveningVal) {
      const v = Utils.validateNumber(eveningVal, false);
      if (!v.ok) { Modal.toast('晚上体重：' + v.msg); return; }
      evening = v.num;
    }

    // 检查是否已有当天记录
    const existing = Store.getData().weights.find(w => w.date === date && !w.deleted);
    if (existing) {
      Modal.confirm('覆盖确认', `该日期已有记录，是否覆盖？`, () => {
        existing.morning = morning;
        existing.evening = evening;
        Store.save();
        this.render();
        Modal.toast('记录已更新');
      });
      return;
    }

    Store.getData().weights.push({
      id: Store.genId(),
      date,
      morning,
      evening,
      deleted: false,
      createdAt: new Date().toISOString(),
    });
    Store.save();
    this.render();
    Modal.toast('记录已保存');
  },

  renderStats() {
    const records = Store.getData().weights.filter(w => !w.deleted);
    let allValues = [];
    records.forEach(r => {
      if (r.morning) allValues.push(r.morning);
      if (r.evening) allValues.push(r.evening);
    });
    
    const maxW = allValues.length > 0 ? Math.max(...allValues) : '-';
    const minW = allValues.length > 0 ? Math.min(...allValues) : '-';
    const diff = allValues.length > 0 ? (maxW - minW).toFixed(1) : '-';
    
    return `
      <div class="card">
        <div class="card-title"><span class="left">◆ 统计</span></div>
        <div class="stat-grid stat-grid-3">
          <div class="stat-box"><div class="num">${maxW}</div><div class="label">最高(kg)</div></div>
          <div class="stat-box"><div class="num">${minW}</div><div class="label">最低(kg)</div></div>
          <div class="stat-box"><div class="num">${diff}</div><div class="label">差值(kg)</div></div>
        </div>
      </div>
    `;
  },

  renderChart() {
    return `
      <div class="card">
        <div class="card-title"><span class="left">▲ 体重趋势</span></div>
        <div class="chart-container"><svg id="weight-chart" width="100%" height="200" viewBox="0 0 360 200" preserveAspectRatio="none"></svg></div>
      </div>
    `;
  },

  renderChartChart() {
    const svg = document.getElementById('weight-chart');
    if (!svg) return;

    const records = Store.getData().weights.filter(w => !w.deleted).sort((a, b) => a.date.localeCompare(b.date));
    
    if (records.length === 0) {
      svg.innerHTML = `<text x="180" y="100" text-anchor="middle" font-size="13" fill="#999">暂无体重数据</text>`;
      return;
    }
    
    const dates = records.map(r => r.date);
    const mornings = records.map(r => r.morning);
    const evenings = records.map(r => r.evening);

    const allVals = mornings.concat(evenings).filter(v => v != null);
    if (allVals.length === 0) {
      svg.innerHTML = `<text x="180" y="100" text-anchor="middle" font-size="13" fill="#999">暂无体重数据</text>`;
      return;
    }

    const W = 360, H = 200, PAD_L = 38, PAD_R = 16, PAD_T = 28, PAD_B = 36;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    
    const minV = Math.min(...allVals) - 0.5;
    const maxV = Math.max(...allVals) + 0.5;
    const yScale = plotH / (maxV - minV);
    const xScale = dates.length > 1 ? plotW / (dates.length - 1) : 0;
    
    const yToPx = (v) => PAD_T + (maxV - v) * yScale;
    
    let svgContent = '';
    
    // 网格
    for (let i = 0; i <= 4; i++) {
      const v = minV + (maxV - minV) * i / 4;
      const y = yToPx(v);
      svgContent += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
      svgContent += `<text x="${PAD_L-4}" y="${y+4}" font-size="10" fill="#999" text-anchor="end">${v.toFixed(1)}</text>`;
    }
    
    // 早体重曲线
    const mPoints = mornings.map((v, i) => v != null ? `${PAD_L + i*xScale},${yToPx(v)}` : null).filter(p => p);
    if (mPoints.length > 1) {
      svgContent += `<polyline points="${mPoints.join(' ')}" fill="none" stroke="#9698E7" stroke-width="2"/>`;
    }
    mornings.forEach((v, i) => {
      if (v != null) {
        svgContent += `<circle cx="${PAD_L + i*xScale}" cy="${yToPx(v)}" r="3" fill="#9698E7"/>`;
      }
    });
    
    // 晚体重曲线
    const ePoints = evenings.map((v, i) => v != null ? `${PAD_L + i*xScale},${yToPx(v)}` : null).filter(p => p);
    if (ePoints.length > 1) {
      svgContent += `<polyline points="${ePoints.join(' ')}" fill="none" stroke="#EECIDD" stroke-width="2" stroke-dasharray="3,2"/>`;
    }
    evenings.forEach((v, i) => {
      if (v != null) {
        svgContent += `<circle cx="${PAD_L + i*xScale}" cy="${yToPx(v)}" r="3" fill="#EECIDD"/>`;
      }
    });
    
    // X轴
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
      <text x="26" y="17" font-size="10" fill="#666">早</text>
      <line x1="50" y1="14" x2="62" y2="14" stroke="#EECIDD" stroke-width="2" stroke-dasharray="3,2"/>
      <text x="66" y="17" font-size="10" fill="#666">晚</text>
    `;

    svg.innerHTML = svgContent;
    this.chart = { destroy: () => {} };
  },

  renderHistory() {
    const records = Store.getData().weights.filter(w => !w.deleted).sort((a, b) => b.date.localeCompare(a.date));
    let html = `<div class="card"><div class="card-title"><span class="left">▤ 历史记录</span></div>`;
    
    if (records.length === 0) {
      html += `<div class="empty-state"><div class="icon">⊕</div>暂无体重记录</div>`;
    } else {
      records.forEach(r => {
        let vals = '';
        if (r.morning) vals += `<span class="morning">${r.morning}</span><span class="unit">早</span> `;
        if (r.evening) vals += `<span class="evening">${r.evening}</span><span class="unit">晚</span>`;
        if (!r.morning && !r.evening) vals = '<span style="color:var(--text-light)">无数据</span>';
        
        html += `
          <div class="weight-history-item">
            <div class="date">
              <div class="d">${r.date}</div>
              <div class="w">周${Utils.getWeekDay(r.date)}</div>
            </div>
            <div class="vals">${vals}</div>
            <button class="del-btn" onclick="WeightPage.deleteRecord('${r.id}')">删除</button>
          </div>
        `;
      });
    }
    
    html += `</div>`;
    return html;
  },

  deleteRecord(id) {
    Modal.confirm('删除记录', '确定将此体重记录移入回收站？', () => {
      Store.softDelete('weights', id);
      this.render();
      Modal.toast('已移入回收站');
    }, { danger: true, confirmText: '删除' });
  },
};
