/**
 * 阶段备考总览页面
 */
const StagePage = {
  expandedStage: null,

  render() {
    let html = `<div class="page active" id="page-stage">`;
    html += `<div class="page-header">★ 阶段备考总览</div>`;

    // 备考倒计时
    const daysLeft = Utils.daysBetween(Store.today(), Store.EXAM_END);
    html += `
      <div class="countdown-box">
        <div class="num">${daysLeft > 0 ? daysLeft : 0}</div>
        <div class="label">距离备考结束还有（天）</div>
      </div>
    `;

    // 四大阶段
    const stages = Store.getData().stages;
    let totalModules = 0, totalLit = 0;

    stages.forEach(stage => {
      const modules = (stage.modules || []).filter(m => !m.deleted);
      const litCount = modules.filter(m => m.lit).length;
      totalModules += modules.length;
      totalLit += litCount;
      const pct = modules.length > 0 ? Math.round(litCount / modules.length * 100) : 0;
      const isExpanded = this.expandedStage === stage.id;

      html += `
        <div class="stage-card" onclick="StagePage.toggleExpand('${stage.id}')">
          <div class="header">
            <div>
              <div class="name">${Utils.escape(stage.name)}</div>
              <div class="range">${stage.start} ~ ${stage.end}</div>
            </div>
            <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-outline" onclick="StagePage.editStageName('${stage.id}')">改名</button>
            </div>
          </div>
          <div class="progress-section">
            <div class="progress-label"><span>阶段进度</span><span class="pct">${pct}% (${litCount}/${modules.length})</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="stage-modules ${isExpanded ? 'show' : ''}" id="stage-modules-${stage.id}">
      `;

      if (modules.length === 0) {
        html += `<div class="empty-state"><div class="icon">◇</div>暂无学习小模块</div>`;
      } else {
        modules.forEach(m => {
          html += `
            <div class="module-check-item ${m.lit ? 'lit' : ''}">
              <div class="check-circle ${m.lit ? 'lit' : ''}" onclick="StagePage.toggleModule('${stage.id}', '${m.id}')"></div>
              <div class="m-name">${Utils.escape(m.name)}</div>
              <div class="m-actions">
                <button onclick="StagePage.editModule('${stage.id}', '${m.id}')">✎</button>
                <button onclick="StagePage.deleteModule('${stage.id}', '${m.id}')">×</button>
              </div>
            </div>
          `;
        });
      }

      html += `
            <button class="btn btn-sm btn-secondary btn-block" style="margin-top:8px" onclick="StagePage.addModule('${stage.id}')">+ 新增学习小模块</button>
          </div>
        </div>
      `;
    });

    // 全局汇总
    const overallPct = totalModules > 0 ? Math.round(totalLit / totalModules * 100) : 0;
    html += `
      <div class="card">
        <div class="stage-global-summary">
          <div class="big-num">${overallPct}%</div>
          <div class="label">全局全部阶段完成进度（${totalLit}/${totalModules}）</div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${overallPct}%"></div></div>
      </div>
    `;

    html += `</div>`;
    document.getElementById('page-container').innerHTML = html;
  },

  toggleExpand(stageId) {
    this.expandedStage = this.expandedStage === stageId ? null : stageId;
    this.render();
  },

  toggleModule(stageId, moduleId) {
    const stage = Store.getData().stages.find(s => s.id === stageId);
    if (!stage) return;
    const m = stage.modules.find(x => x.id === moduleId);
    if (m) {
      m.lit = !m.lit;
      Store.save();
      this.render();
    }
  },

  addModule(stageId) {
    const formHTML = `
      <div class="form-group">
        <label class="form-label">学习小模块名称</label>
        <input class="form-input" name="name" placeholder="如：行测基础课第1讲" required>
      </div>
    `;
    Modal.form('新增学习小模块', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      const stage = Store.getData().stages.find(s => s.id === stageId);
      if (!stage.modules) stage.modules = [];
      stage.modules.push({
        id: Store.genId(),
        name,
        lit: false,
        deleted: false,
      });
      Store.save();
      this.expandedStage = stageId;
      this.render();
      Modal.toast('小模块已添加');
    });
  },

  editModule(stageId, moduleId) {
    const stage = Store.getData().stages.find(s => s.id === stageId);
    const m = stage.modules.find(x => x.id === moduleId);
    if (!m) return;
    const formHTML = `<div class="form-group"><label class="form-label">名称</label><input class="form-input" name="name" value="${Utils.escape(m.name)}" required></div>`;
    Modal.form('编辑小模块', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      m.name = name;
      Store.save();
      this.render();
      Modal.toast('已更新');
    });
  },

  deleteModule(stageId, moduleId) {
    Modal.confirm('删除小模块', '确定将此学习小模块移入回收站？', () => {
      const stage = Store.getData().stages.find(s => s.id === stageId);
      const m = stage.modules.find(x => x.id === moduleId);
      if (m) {
        m.deleted = true;
        m.deletedAt = new Date().toISOString();
        Store.save();
      }
      this.render();
      Modal.toast('已移入回收站');
    }, { danger: true, confirmText: '删除' });
  },

  editStageName(stageId) {
    const stage = Store.getData().stages.find(s => s.id === stageId);
    if (!stage) return;
    const formHTML = `<div class="form-group"><label class="form-label">阶段名称</label><input class="form-input" name="name" value="${Utils.escape(stage.name)}" required></div>`;
    Modal.form('编辑阶段名称', formHTML, (form) => {
      const name = form.name.value.trim();
      if (!name) { Modal.toast('请输入名称'); return false; }
      stage.name = name;
      Store.save();
      this.render();
      Modal.toast('已更新');
    });
  },
};
