/**
 * 刷题题本库页面
 */
const NotebookPage = {
  currentTab: 'xingce',
  viewMode: 'list', // list | detail
  detailNotebookId: null,

  render() {
    let html = `<div class="page active" id="page-notebook">`;
    
    if (this.viewMode === 'detail') {
      html += this.renderDetail();
    } else {
      html += `<div class="page-header">▤ 题本库</div>`;
      html += `
        <div class="tab-switch">
          <div class="tab-switch-item ${this.currentTab === 'xingce' ? 'active' : ''}" onclick="NotebookPage.switchTab('xingce')">行测题本</div>
          <div class="tab-switch-item ${this.currentTab === 'shenlun' ? 'active' : ''}" onclick="NotebookPage.switchTab('shenlun')">申论题本</div>
        </div>
      `;
      if (this.currentTab === 'xingce') {
        html += this.renderXingceList();
      } else {
        html += this.renderShenlunList();
      }
    }
    
    html += `</div>`;
    document.getElementById('page-container').innerHTML = html;
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  // ===== 行测题本列表 =====
  renderXingceList() {
    let html = '';
    
    // 全局汇总看板
    html += this.renderXingceOverview();
    
    // 题本列表
    const notebooks = Store.getData().xingceNotebooks.filter(n => !n.deleted);
    html += `<div class="card"><div class="card-title"><span class="left">行测题本列表</span><button class="btn btn-sm btn-primary" onclick="NotebookPage.addXingceNotebook()">+ 新增</button></div>`;
    
    if (notebooks.length === 0) {
      html += `<div class="empty-state"><div class="icon">▤</div>暂无题本，点击新增</div>`;
    } else {
      notebooks.forEach(n => {
        const subItems = Store.getData().xingceSubItems.filter(s => !s.deleted && s.notebookId === n.id);
        const stats = this.calcNotebookXingceProgress(subItems);
        html += `
          <div class="notebook-item" onclick="NotebookPage.viewDetail('${n.id}', 'xingce')">
            <div class="name">
              <span>${Utils.escape(n.name)}</span>
              <span class="module-tag">${Utils.escape(n.module)}</span>
            </div>
            <div class="progress-info">
              <span>一刷 ${stats.firstDone}/${stats.firstTotal} <span class="pct">${stats.firstPct}%</span></span>
              <span>二刷 ${stats.secondDone}/${stats.secondTotal} <span class="pct">${stats.secondPct}%</span></span>
            </div>
            <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${stats.firstPct}%"></div></div>
          </div>
        `;
      });
    }
    html += `</div>`;

    // 薄弱知识点排行
    html += this.renderXingceWeakness();
    
    // 新增题本浮动按钮
    html += `<button class="fab" onclick="NotebookPage.addXingceNotebook()">+</button>`;
    
    return html;
  },

  renderXingceOverview() {
    const notebooks = Store.getData().xingceNotebooks.filter(n => !n.deleted);
    const allSubItems = Store.getData().xingceSubItems.filter(s => !s.deleted);
    
    let totalTotal = 0, totalDone = 0;
    const moduleStats = {};
    
    Store.XINGCE_MODULES.forEach(m => { moduleStats[m] = { total: 0, done: 0 }; });
    
    notebooks.forEach(n => {
      if (!moduleStats[n.module]) moduleStats[n.module] = { total: 0, done: 0 };
      const subs = allSubItems.filter(s => s.notebookId === n.id);
      subs.forEach(s => {
        const t = s.firstTotal || 0;
        const d = s.firstDone || 0;
        totalTotal += t;
        totalDone += d;
        moduleStats[n.module].total += t;
        moduleStats[n.module].done += d;
      });
    });

    const overallPct = Utils.safeDivide(totalDone, totalTotal) * 100;
    
    let html = `<div class="card">
      <div class="card-title"><span class="left">◆ 行测全局汇总</span></div>
      <div class="stat-grid stat-grid-3">
        <div class="stat-box"><div class="num">${totalTotal}</div><div class="label">总任务量</div></div>
        <div class="stat-box"><div class="num">${totalDone}</div><div class="label">累计完成</div></div>
        <div class="stat-box"><div class="num">${Math.round(overallPct)}%</div><div class="label">完成率</div></div>
      </div>
    `;
    
    // 各模块进度
    html += `<div style="margin-top:8px">`;
    Object.keys(moduleStats).forEach(m => {
      const s = moduleStats[m];
      const pct = Utils.safeDivide(s.done, s.total) * 100;
      html += `
        <div class="module-progress-item">
          <div class="label"><span>${Utils.escape(m)}</span><span class="pct">${Math.round(pct)}%</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    });
    html += `</div></div>`;
    
    return html;
  },

  renderXingceWeakness() {
    const subItems = Store.getData().xingceSubItems.filter(s => !s.deleted);
    const notebooks = Store.getData().xingceNotebooks;
    
    const weakList = subItems.map(s => {
      const total = s.firstTotal || 0;
      const wrong = s.firstWrong || 0;
      const rate = total > 0 ? Utils.safeDivide(wrong, total) : 0;
      const nb = notebooks.find(n => n.id === s.notebookId);
      return {
        name: s.name,
        notebookName: nb ? nb.name : '',
        module: nb ? nb.module : '',
        total,
        wrong,
        rate,
      };
    }).filter(x => x.total > 0).sort((a, b) => b.rate - a.rate);

    let html = `<div class="card"><div class="card-title"><span class="left">! 薄弱知识点排行</span></div>`;
    if (weakList.length === 0) {
      html += `<div class="empty-state"><div class="icon">★</div>暂无数据</div>`;
    } else {
      weakList.forEach((w, i) => {
        const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
        html += `
          <div class="weakness-item">
            <div class="rank ${rankClass}">${i+1}</div>
            <div class="info">
              <div class="name">${Utils.escape(w.name)}</div>
              <div class="stat">${Utils.escape(w.notebookName)} · 刷题${w.total}题 · 错${w.wrong}题</div>
            </div>
            <div class="rate">${Math.round(w.rate * 100)}%</div>
          </div>
        `;
      });
    }
    html += `</div>`;
    return html;
  },

  calcNotebookXingceProgress(subItems) {
    let firstTotal = 0, firstDone = 0, firstWrong = 0;
    let secondTotal = 0, secondDone = 0, secondWrong = 0;
    
    subItems.forEach(s => {
      firstTotal += (s.firstTotal || 0);
      firstDone += (s.firstDone || 0);
      firstWrong += (s.firstWrong || 0);
      secondTotal += (s.secondTotal || 0);
      secondDone += (s.secondDone || 0);
      secondWrong += (s.secondWrong || 0);
    });

    return {
      firstTotal, firstDone, firstWrong,
      secondTotal, secondDone, secondWrong,
      firstPct: Math.round(Utils.safeDivide(firstDone, firstTotal) * 100),
      secondPct: Math.round(Utils.safeDivide(secondDone, secondTotal) * 100),
    };
  },

  // ===== 行测题本详情 =====
  renderDetail() {
    if (this.currentTab === 'xingce') {
      return this.renderXingceDetail();
    } else {
      return this.renderShenlunDetail();
    }
  },

  renderXingceDetail() {
    const nb = Store.getData().xingceNotebooks.find(n => n.id === this.detailNotebookId);
    if (!nb) { this.viewMode = 'list'; return this.render(); }
    
    const subItems = Store.getData().xingceSubItems.filter(s => !s.deleted && s.notebookId === nb.id);
    const stats = this.calcNotebookXingceProgress(subItems);
    
    let html = `
      <div class="back-btn" onclick="NotebookPage.backToList()">← 返回列表</div>
      <div class="page-header">${Utils.escape(nb.name)}</div>
      <div class="card">
        <div class="card-title">
          <span class="left">题本概览 <span class="module-tag">${Utils.escape(nb.module)}</span></span>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-outline" onclick="NotebookPage.editXingceNotebook('${nb.id}')">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="NotebookPage.deleteXingceNotebook('${nb.id}')">删除</button>
          </div>
        </div>
        <div class="stat-grid stat-grid-3">
          <div class="stat-box"><div class="num">${stats.firstDone}/${stats.firstTotal}</div><div class="label">一刷完成</div></div>
          <div class="stat-box"><div class="num">${stats.firstWrong}</div><div class="label">一刷错题</div></div>
          <div class="stat-box"><div class="num">${stats.firstPct}%</div><div class="label">一刷进度</div></div>
        </div>
        <div style="margin-top:6px"><div class="progress-bar"><div class="progress-fill" style="width:${stats.firstPct}%"></div></div></div>
        <div class="stat-grid stat-grid-3" style="margin-top:10px">
          <div class="stat-box"><div class="num">${stats.secondDone}/${stats.secondTotal}</div><div class="label">二刷完成</div></div>
          <div class="stat-box"><div class="num">${stats.secondWrong}</div><div class="label">二刷错题</div></div>
          <div class="stat-box"><div class="num">${stats.secondPct}%</div><div class="label">二刷进度</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">
          <span class="left">二级子条目</span>
          <button class="btn btn-sm btn-primary" onclick="NotebookPage.addXingceSubItem('${nb.id}')">+ 新增</button>
        </div>
    `;
    
    if (subItems.length === 0) {
      html += `<div class="empty-state"><div class="icon">○</div>暂无二级条目</div>`;
    } else {
      subItems.forEach(s => {
        const firstPct = Math.round(Utils.safeDivide(s.firstDone, s.firstTotal) * 100);
        const secondPct = Math.round(Utils.safeDivide(s.secondDone, s.secondTotal) * 100);
        html += `
          <div class="subitem-row">
            <div class="left">
              <div class="name">${Utils.escape(s.name)}</div>
              <div class="stats">一刷 ${s.firstDone||0}/${s.firstTotal||0}(${firstPct}%) 错${s.firstWrong||0} · 二刷 ${s.secondDone||0}/${s.secondTotal||0}(${secondPct}%) 错${s.secondWrong||0}</div>
            </div>
            <div class="actions">
              <button onclick="NotebookPage.editXingceSubItem('${s.id}')">编辑</button>
              <button class="del-btn" onclick="NotebookPage.deleteXingceSubItem('${s.id}')">删除</button>
            </div>
          </div>
          <div class="progress-bar" style="margin-bottom:8px"><div class="progress-fill" style="width:${firstPct}%"></div></div>
        `;
      });
    }
    
    html += `</div>`;
    return html;
  },

  // ===== 行测题本操作 =====
  addXingceNotebook() {
    let moduleOptions = Store.XINGCE_MODULES.map(m => `<option value="${m}">${m}</option>`).join('');
    const formHTML = `
      <div class="form-group">
        <label class="form-label">题本名称</label>
        <input class="form-input" name="name" placeholder="如：行测5000题" required>
      </div>
      <div class="form-group">
        <label class="form-label">归属模块</label>
        <select class="form-select" name="module">
          ${moduleOptions}
          <option value="自定义">自定义...</option>
        </select>
      </div>
      <div class="form-group" id="custom-module-group" style="display:none">
        <label class="form-label">自定义模块名</label>
        <input class="form-input" name="customModule" placeholder="输入自定义模块名">
      </div>
    `;
    Modal.form('新增行测题本', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入题本名称'); return false; }
      let module = form.module.value;
      if (module === '自定义') {
        module = form.customModule.value.trim();
        if (!module) { Modal.toast('请输入自定义模块名'); return false; }
        if (!Store.XINGCE_MODULES.includes(module)) {
          Store.XINGCE_MODULES.push(module);
        }
      }
      Store.getData().xingceNotebooks.push({
        id: Store.genId(),
        name,
        module,
        custom: module === '自定义',
        deleted: false,
      });
      Store.save();
      this.render();
      Modal.toast('题本已创建');
    });
    
    // 动态显示自定义模块输入框
    setTimeout(() => {
      const sel = document.querySelector('#modal-form select[name="module"]');
      if (sel) {
        sel.onchange = function() {
          document.getElementById('custom-module-group').style.display = this.value === '自定义' ? 'block' : 'none';
        };
      }
    }, 50);
  },

  editXingceNotebook(id) {
    const nb = Store.getData().xingceNotebooks.find(n => n.id === id);
    if (!nb) return;
    let moduleOptions = Store.XINGCE_MODULES.map(m => `<option value="${m}" ${nb.module===m?'selected':''}>${m}</option>`).join('');
    const formHTML = `
      <div class="form-group">
        <label class="form-label">题本名称</label>
        <input class="form-input" name="name" value="${Utils.escape(nb.name)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">归属模块</label>
        <select class="form-select" name="module">${moduleOptions}<option value="自定义">自定义...</option></select>
      </div>
    `;
    Modal.form('编辑题本', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      nb.name = name;
      nb.module = form.module.value;
      Store.save();
      this.render();
      Modal.toast('已更新');
    });
  },

  deleteXingceNotebook(id) {
    Modal.confirm('删除题本', '删除后题本及二级条目将移入回收站，历史刷题记录保留但不再参与统计。确定？', () => {
      Store.softDelete('xingceNotebooks', id);
      Store.getData().xingceSubItems.filter(s => s.notebookId === id).forEach(s => {
        Store.softDelete('xingceSubItems', s.id);
      });
      Store.save();
      this.viewMode = 'list';
      this.render();
      Modal.toast('已移入回收站');
    }, { danger: true, confirmText: '删除' });
  },

  addXingceSubItem(notebookId) {
    const formHTML = `
      <div class="form-group">
        <label class="form-label">子条目名称（知识点/题型）</label>
        <input class="form-input" name="name" placeholder="如：基期计算" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">一刷总题量</label>
          <input class="form-input" name="firstTotal" type="number" inputmode="numeric" value="0">
        </div>
        <div class="form-group">
          <label class="form-label">一刷已完成</label>
          <input class="form-input" name="firstDone" type="number" inputmode="numeric" value="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">一刷错题数</label>
          <input class="form-input" name="firstWrong" type="number" inputmode="numeric" value="0">
        </div>
        <div class="form-group">
          <label class="form-label">二刷完成量</label>
          <input class="form-input" name="secondDone" type="number" inputmode="numeric" value="0">
        </div>
      </div>
    `;
    Modal.form('新增二级条目', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      const ft = Utils.validateNumber(form.firstTotal.value, true);
      const fd = Utils.validateNumber(form.firstDone.value, true);
      const fw = Utils.validateNumber(form.firstWrong.value, true);
      const sd = Utils.validateNumber(form.secondDone.value, true);
      if (!ft.ok || !fd.ok || !fw.ok || !sd.ok) { Modal.toast('请输入有效数字'); return false; }
      if (fd.num > ft.num) { Modal.toast('已完成不能大于总题量'); return false; }
      if (fw.num > ft.num) { Modal.toast('错题数不能大于总题量'); return false; }
      
      Store.getData().xingceSubItems.push({
        id: Store.genId(),
        notebookId,
        name,
        firstTotal: ft.num,
        firstDone: fd.num,
        firstWrong: fw.num,
        secondTotal: 0,
        secondDone: sd.num,
        secondWrong: 0,
        deleted: false,
      });
      Store.save();
      this.render();
      Modal.toast('条目已创建');
    });
  },

  editXingceSubItem(id) {
    const s = Store.getData().xingceSubItems.find(x => x.id === id);
    if (!s) return;
    const formHTML = `
      <div class="form-group">
        <label class="form-label">子条目名称</label>
        <input class="form-input" name="name" value="${Utils.escape(s.name)}" required>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">一刷总题量</label><input class="form-input" name="firstTotal" type="number" value="${s.firstTotal||0}"></div>
        <div class="form-group"><label class="form-label">一刷已完成</label><input class="form-input" name="firstDone" type="number" value="${s.firstDone||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">一刷错题</label><input class="form-input" name="firstWrong" type="number" value="${s.firstWrong||0}"></div>
        <div class="form-group"><label class="form-label">二刷完成</label><input class="form-input" name="secondDone" type="number" value="${s.secondDone||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">二刷总题量</label><input class="form-input" name="secondTotal" type="number" value="${s.secondTotal||0}"></div>
        <div class="form-group"><label class="form-label">二刷错题</label><input class="form-input" name="secondWrong" type="number" value="${s.secondWrong||0}"></div>
      </div>
    `;
    Modal.form('编辑条目', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      const ft = Utils.validateNumber(form.firstTotal.value, true);
      const fd = Utils.validateNumber(form.firstDone.value, true);
      const fw = Utils.validateNumber(form.firstWrong.value, true);
      const sd = Utils.validateNumber(form.secondDone.value, true);
      const st = Utils.validateNumber(form.secondTotal.value, true);
      const sw = Utils.validateNumber(form.secondWrong.value, true);
      if (!ft.ok || !fd.ok || !fw.ok || !sd.ok || !st.ok || !sw.ok) { Modal.toast('请输入有效数字'); return false; }
      if (fd.num > ft.num) { Modal.toast('一刷已完成大于总量'); return false; }
      if (sd.num > st.num) { Modal.toast('二刷完成大于总量'); return false; }
      s.name = name;
      s.firstTotal = ft.num; s.firstDone = fd.num; s.firstWrong = fw.num;
      s.secondTotal = st.num; s.secondDone = sd.num; s.secondWrong = sw.num;
      Store.save();
      this.render();
      Modal.toast('已更新');
    });
  },

  deleteXingceSubItem(id) {
    Modal.confirm('删除条目', '删除后历史刷题记录保留但不再参与薄弱统计。确定？', () => {
      Store.softDelete('xingceSubItems', id);
      Store.save();
      this.render();
      Modal.toast('已移入回收站');
    }, { danger: true, confirmText: '删除' });
  },

  // ===== 申论题本列表 =====
  renderShenlunList() {
    let html = '';
    
    const notebooks = Store.getData().shenlunNotebooks.filter(n => !n.deleted);
    html += `<div class="card"><div class="card-title"><span class="left">申论题本列表</span><button class="btn btn-sm btn-primary" onclick="NotebookPage.addShenlunNotebook()">+ 新增</button></div>`;
    
    if (notebooks.length === 0) {
      html += `<div class="empty-state"><div class="icon">▤</div>暂无题本，点击新增</div>`;
    } else {
      notebooks.forEach(n => {
        const subItems = Store.getData().shenlunSubItems.filter(s => !s.deleted && s.notebookId === n.id);
        const stats = this.calcShenlunNotebookStats(subItems);
        html += `
          <div class="notebook-item" onclick="NotebookPage.viewDetail('${n.id}', 'shenlun')">
            <div class="name"><span>${Utils.escape(n.name)}</span></div>
            <div class="progress-info">
              <span>一刷 ${stats.firstCount}次 均分${stats.firstAvg}</span>
              <span>二刷 ${stats.secondCount}次 均分${stats.secondAvg}</span>
            </div>
          </div>
        `;
      });
    }
    html += `</div>`;

    // 申论薄弱题型排行
    html += this.renderShenlunWeakness();
    
    html += `<button class="fab" onclick="NotebookPage.addShenlunNotebook()">+</button>`;
    
    return html;
  },

  renderShenlunWeakness() {
    const subItems = Store.getData().shenlunSubItems.filter(s => !s.deleted);
    const notebooks = Store.getData().shenlunNotebooks;
    
    const weakList = subItems.map(s => {
      const firstCount = s.firstCount || 0;
      const firstAvg = firstCount > 0 ? Utils.safeDivide(s.firstScoreSum || 0, firstCount) : 0;
      const secondCount = s.secondCount || 0;
      const secondAvg = secondCount > 0 ? Utils.safeDivide(s.secondScoreSum || 0, secondCount) : 0;
      const nb = notebooks.find(n => n.id === s.notebookId);
      const allAvg = firstCount + secondCount > 0 ? Utils.safeDivide((s.firstScoreSum||0) + (s.secondScoreSum||0), firstCount + secondCount) : 0;
      return {
        name: s.name,
        notebookName: nb ? nb.name : '',
        firstCount, firstAvg, secondCount, secondAvg,
        allAvg,
      };
    }).filter(x => x.firstCount + x.secondCount > 0).sort((a, b) => a.allAvg - b.allAvg);

    let html = `<div class="card"><div class="card-title"><span class="left">! 申论薄弱题型排行</span></div>`;
    if (weakList.length === 0) {
      html += `<div class="empty-state"><div class="icon">★</div>暂无数据</div>`;
    } else {
      weakList.forEach((w, i) => {
        const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
        html += `
          <div class="weakness-item">
            <div class="rank ${rankClass}">${i+1}</div>
            <div class="info">
              <div class="name">${Utils.escape(w.name)}</div>
              <div class="stat">${Utils.escape(w.notebookName)} · 一刷${w.firstCount}次均${w.firstAvg.toFixed(1)} · 二刷${w.secondCount}次均${w.secondAvg.toFixed(1)}</div>
            </div>
            <div class="rate" style="color:var(--secondary)">${w.allAvg.toFixed(1)}</div>
          </div>
        `;
      });
    }
    html += `</div>`;
    return html;
  },

  calcShenlunNotebookStats(subItems) {
    let firstCount = 0, firstScoreSum = 0;
    let secondCount = 0, secondScoreSum = 0;
    subItems.forEach(s => {
      firstCount += (s.firstCount || 0);
      firstScoreSum += (s.firstScoreSum || 0);
      secondCount += (s.secondCount || 0);
      secondScoreSum += (s.secondScoreSum || 0);
    });
    return {
      firstCount, secondCount,
      firstAvg: firstCount > 0 ? (firstScoreSum / firstCount).toFixed(1) : '-',
      secondAvg: secondCount > 0 ? (secondScoreSum / secondCount).toFixed(1) : '-',
    };
  },

  renderShenlunDetail() {
    const nb = Store.getData().shenlunNotebooks.find(n => n.id === this.detailNotebookId);
    if (!nb) { this.viewMode = 'list'; return this.render(); }
    
    const subItems = Store.getData().shenlunSubItems.filter(s => !s.deleted && s.notebookId === nb.id);
    const stats = this.calcShenlunNotebookStats(subItems);
    
    let html = `
      <div class="back-btn" onclick="NotebookPage.backToList()">← 返回列表</div>
      <div class="page-header">${Utils.escape(nb.name)}</div>
      <div class="card">
        <div class="card-title">
          <span class="left">题本概览</span>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-outline" onclick="NotebookPage.editShenlunNotebook('${nb.id}')">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="NotebookPage.deleteShenlunNotebook('${nb.id}')">删除</button>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat-box"><div class="num">${stats.firstCount}</div><div class="label">一刷次数</div></div>
          <div class="stat-box"><div class="num">${stats.firstAvg}</div><div class="label">一刷均分</div></div>
          <div class="stat-box"><div class="num">${stats.secondCount}</div><div class="label">二刷次数</div></div>
          <div class="stat-box"><div class="num">${stats.secondAvg}</div><div class="label">二刷均分</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">
          <span class="left">二级题型</span>
          <button class="btn btn-sm btn-primary" onclick="NotebookPage.addShenlunSubItem('${nb.id}')">+ 新增</button>
        </div>
    `;
    
    if (subItems.length === 0) {
      html += `<div class="empty-state"><div class="icon">○</div>暂无二级题型</div>`;
    } else {
      subItems.forEach(s => {
        const fAvg = (s.firstCount||0) > 0 ? ((s.firstScoreSum||0)/(s.firstCount||0)).toFixed(1) : '-';
        const sAvg = (s.secondCount||0) > 0 ? ((s.secondScoreSum||0)/(s.secondCount||0)).toFixed(1) : '-';
        html += `
          <div class="subitem-row">
            <div class="left">
              <div class="name">${Utils.escape(s.name)}</div>
              <div class="stats">一刷${s.firstCount||0}次 均${fAvg} · 二刷${s.secondCount||0}次 均${sAvg}</div>
            </div>
            <div class="actions">
              <button onclick="NotebookPage.editShenlunSubItem('${s.id}')">编辑</button>
              <button class="del-btn" onclick="NotebookPage.deleteShenlunSubItem('${s.id}')">删除</button>
            </div>
          </div>
        `;
      });
    }
    
    html += `</div>`;
    return html;
  },

  // ===== 申论题本操作 =====
  addShenlunNotebook() {
    const formHTML = `
      <div class="form-group">
        <label class="form-label">题本名称</label>
        <input class="form-input" name="name" placeholder="如：国考申论真题" required>
      </div>
    `;
    Modal.form('新增申论题本', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      Store.getData().shenlunNotebooks.push({
        id: Store.genId(),
        name,
        deleted: false,
      });
      Store.save();
      this.render();
      Modal.toast('题本已创建');
    });
  },

  editShenlunNotebook(id) {
    const nb = Store.getData().shenlunNotebooks.find(n => n.id === id);
    if (!nb) return;
    const formHTML = `<div class="form-group"><label class="form-label">题本名称</label><input class="form-input" name="name" value="${Utils.escape(nb.name)}" required></div>`;
    Modal.form('编辑题本', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      nb.name = name;
      Store.save();
      this.render();
      Modal.toast('已更新');
    });
  },

  deleteShenlunNotebook(id) {
    Modal.confirm('删除题本', '删除后题本及二级题型将移入回收站。确定？', () => {
      Store.softDelete('shenlunNotebooks', id);
      Store.getData().shenlunSubItems.filter(s => s.notebookId === id).forEach(s => {
        Store.softDelete('shenlunSubItems', s.id);
      });
      Store.save();
      this.viewMode = 'list';
      this.render();
      Modal.toast('已移入回收站');
    }, { danger: true, confirmText: '删除' });
  },

  addShenlunSubItem(notebookId) {
    const defaultTypes = Store.SHENLUN_DEFAULT_TYPES;
    const formHTML = `
      <div class="form-group">
        <label class="form-label">题型名称</label>
        <input class="form-input" name="name" placeholder="如：单一概括题" list="sl-default-types" required>
        <datalist id="sl-default-types">
          ${defaultTypes.map(t => `<option value="${t}">`).join('')}
        </datalist>
      </div>
    `;
    Modal.form('新增申论题型', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      Store.getData().shenlunSubItems.push({
        id: Store.genId(),
        notebookId,
        name,
        firstCount: 0, firstScoreSum: 0,
        secondCount: 0, secondScoreSum: 0,
        deleted: false,
      });
      Store.save();
      this.render();
      Modal.toast('题型已创建');
    });
  },

  editShenlunSubItem(id) {
    const s = Store.getData().shenlunSubItems.find(x => x.id === id);
    if (!s) return;
    const formHTML = `<div class="form-group"><label class="form-label">题型名称</label><input class="form-input" name="name" value="${Utils.escape(s.name)}" required></div>`;
    Modal.form('编辑题型', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      s.name = name;
      Store.save();
      this.render();
      Modal.toast('已更新');
    });
  },

  deleteShenlunSubItem(id) {
    Modal.confirm('删除题型', '删除后历史记录保留但不再参与统计。确定？', () => {
      Store.softDelete('shenlunSubItems', id);
      Store.save();
      this.render();
      Modal.toast('已移入回收站');
    }, { danger: true, confirmText: '删除' });
  },

  // ===== 通用 =====
  viewDetail(notebookId, type) {
    this.detailNotebookId = notebookId;
    this.currentTab = type;
    this.viewMode = 'detail';
    this.render();
  },

  backToList() {
    this.viewMode = 'list';
    this.render();
  },
};
