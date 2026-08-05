/**
 * 设置与数据管理页面
 */
const SettingsPage = {

  render() {
    let html = `<div class="page active" id="page-settings">`;
    html += `<div class="page-header">⚙ 设置与数据管理</div>`;

    // 任务顺延开关
    const autoDelay = Store.getData().settings.autoDelay;
    html += `
      <div class="settings-group-title">任务设置</div>
      <div class="settings-group">
        <div class="settings-item">
          <div class="left">
            <div class="label">自动顺延未完成任务</div>
            <div class="desc">未完成普通任务自动顺延到次日</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="setting-autoDelay" ${autoDelay ? 'checked' : ''} onchange="SettingsPage.toggleAutoDelay()">
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
    `;

    // 数据管理
    html += `
      <div class="settings-group-title">数据管理</div>
      <div class="settings-group">
        <div class="settings-item" onclick="SettingsPage.openRecycleBin()">
          <div class="left">
            <div class="label">× 回收站</div>
            <div class="desc">查看、复原、永久删除数据</div>
          </div>
          <div class="right">›</div>
        </div>
        <div class="settings-item" onclick="SettingsPage.exportData()">
          <div class="left">
            <div class="label">↑ 导出备份</div>
            <div class="desc">导出全部JSON备份文件</div>
          </div>
          <div class="right">›</div>
        </div>
        <div class="settings-item" onclick="SettingsPage.importData()">
          <div class="left">
            <div class="label">↓ 导入备份</div>
            <div class="desc">从JSON文件恢复全部数据</div>
          </div>
          <div class="right">›</div>
        </div>
        <div class="settings-item" onclick="SettingsPage.clearAll()">
          <div class="left">
            <div class="label" style="color:var(--danger)">! 一键清空全部数据</div>
            <div class="desc">不可恢复，请谨慎操作</div>
          </div>
          <div class="right">›</div>
        </div>
      </div>
    `;

    // APP说明
    html += `
      <div class="settings-group-title">关于</div>
      <div class="settings-group">
        <div class="app-info">
          <div class="title">考公备考助手</div>
          <div>备考周期：${Store.EXAM_START} ~ ${Store.EXAM_END}</div>
          <div>全部数据本地存储，断网可用</div>
          <div class="color-swatch">
            <div class="swatch" style="background:#9698E7" title="主色"></div>
            <div class="swatch" style="background:#EECIDD" title="辅助色"></div>
            <div class="swatch" style="background:#D1D0EF" title="次要浅紫"></div>
            <div class="swatch" style="background:#FCF8F8;border:1px solid #ddd" title="页面背景"></div>
          </div>
          <div style="font-size:11px;margin-top:4px">配色为固定不可修改</div>
        </div>
      </div>
    `;

    html += `</div>`;
    document.getElementById('page-container').innerHTML = html;
  },

  toggleAutoDelay() {
    Store.getData().settings.autoDelay = !Store.getData().settings.autoDelay;
    Store.save();
    Modal.toast(Store.getData().settings.autoDelay ? '自动顺延已开启' : '自动顺延已关闭');
  },

  // ===== 回收站 =====
  openRecycleBin() {
    const items = Store.getRecycleBin();
    let html = '';
    
    if (items.length === 0) {
      html = `<div class="empty-state"><div class="icon">×</div>回收站为空</div>`;
    } else {
      items.forEach(item => {
        let desc = '';
        switch(item.type) {
          case 'tasks': desc = item.data.title + ' (' + item.data.date + ')'; break;
          case 'restDays': desc = '休息日 ' + item.data.date; break;
          case 'practiceRecords': desc = (item.data.type === 'xingce' ? '行测' : '申论') + ' ' + item.data.date; break;
          case 'xingceNotebooks': desc = item.data.name + ' (' + item.data.module + ')'; break;
          case 'shenlunNotebooks': desc = item.data.name; break;
          case 'xingceSubItems': desc = item.data.name; break;
          case 'shenlunSubItems': desc = item.data.name; break;
          case 'weights': desc = '体重 ' + item.data.date; break;
          case 'stageModules': desc = item.data.name; break;
        }
        html += `
          <div class="recycle-item">
            <div class="info">
              <div class="type">${item.typeLabel}</div>
              <div class="desc">${Utils.escape(desc)}</div>
            </div>
            <div class="actions">
              <button class="restore-btn" onclick="SettingsPage.restoreItem('${item.type}', '${item.data.id}', '${item.stageId || ''}')">复原</button>
              <button class="delete-btn" onclick="SettingsPage.permanentDelete('${item.type}', '${item.data.id}', '${item.stageId || ''}')">彻底删除</button>
            </div>
          </div>
        `;
      });

      html += `
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-secondary btn-block" onclick="SettingsPage.restoreAll()">全部复原</button>
          <button class="btn btn-danger btn-block" onclick="SettingsPage.emptyRecycle()">清空回收站</button>
        </div>
      `;
    }

    Modal.showCustom('× 回收站 (' + items.length + '条)', html);
  },

  restoreItem(type, id, stageId) {
    if (type === 'stageModules') {
      const stage = Store.getData().stages.find(s => s.id === stageId);
      if (stage) {
        const m = stage.modules.find(x => x.id === id);
        if (m) { m.deleted = false; delete m.deletedAt; Store.save(); }
      }
    } else {
      Store.restore(type, id);
    }
    Modal.close();
    this.openRecycleBin();
    Modal.toast('已复原');
  },

  permanentDelete(type, id, stageId) {
    Modal.confirm('彻底删除', '此操作不可恢复，确定永久删除？', () => {
      if (type === 'stageModules') {
        const stage = Store.getData().stages.find(s => s.id === stageId);
        if (stage) {
          stage.modules = stage.modules.filter(m => m.id !== id);
          Store.save();
        }
      } else {
        Store.permanentDelete(type, id);
      }
      Modal.close();
      this.openRecycleBin();
      Modal.toast('已彻底删除');
    }, { danger: true, confirmText: '永久删除' });
  },

  restoreAll() {
    Modal.confirm('全部复原', '确定复原回收站中的全部数据？', () => {
      Store.restoreAll();
      Modal.close();
      this.openRecycleBin();
      Modal.toast('已全部复原');
    });
  },

  emptyRecycle() {
    Modal.confirm('清空回收站', '此操作将永久删除回收站中全部数据，不可恢复！确定？', () => {
      Store.emptyRecycleBin();
      Modal.close();
      this.openRecycleBin();
      Modal.toast('回收站已清空');
    }, { danger: true, confirmText: '清空' });
  },

  // ===== 导出 =====
  exportData() {
    const json = Store.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gongkao_backup_${Store.today()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Modal.toast('备份已导出');
  },

  // ===== 导入 =====
  importData() {
    Modal.confirm('导入备份', '! 导入将覆盖当前全部数据，请确保已备份！是否继续？', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = Store.importBackup(ev.target.result);
          if (result.ok) {
            Modal.toast('数据恢复成功');
            switchTab('today');
          } else {
            Modal.toast(result.msg);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }, { danger: true, confirmText: '继续' });
  },

  // ===== 一键清空 =====
  clearAll() {
    Modal.confirm('清空全部数据', '! 此操作将删除所有数据并恢复出厂设置，不可恢复！\n\n确定要清空全部数据吗？', () => {
      Modal.confirm('再次确认', '最后确认：真的要清空全部数据吗？', () => {
        Store.clearAll();
        Modal.toast('全部数据已清空');
        switchTab('today');
      }, { danger: true, confirmText: '确认清空' });
    }, { danger: true, confirmText: '继续' });
  },
};
