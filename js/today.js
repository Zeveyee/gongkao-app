/**
 * 今日计划页面
 */
const TodayPage = {
  pieChart: null,
  currentDate: null,

  render(dateStr) {
    this.currentDate = dateStr || Store.today();
    const isRest = Store.isRestDay(this.currentDate);
    const tasks = Store.getTasksByDate(this.currentDate);
    const activeTasks = tasks.filter(t => !t.deleted);
    const doneCount = activeTasks.filter(t => t.done).length;
    const undoneCount = activeTasks.length - doneCount;

    let html = `
      <div class="page active" id="page-today">
        <div class="today-date-label">
          <span>${Utils.formatDate(this.currentDate)}</span>
          <span class="go-calendar-btn" onclick="switchTab('today');showCalendar()">▦ 日历</span>
        </div>
    `;

    if (isRest) {
      html += `<div class="rest-notice">☾ 今日为休息日，任务不会自动顺延</div>`;
    }

    // 饼图
    html += `
      <div class="card">
        <div class="card-title"><span class="left">◆ 今日完成</span></div>
        <div class="today-pie-wrap">
          <canvas id="today-pie" width="140" height="140"></canvas>
          <div class="today-pie-detail">
            <div class="row"><span class="dot" style="background:var(--primary)"></span>总任务 ${activeTasks.length}</div>
            <div class="row"><span class="dot" style="background:var(--success)"></span>已完成 ${doneCount}</div>
            <div class="row"><span class="dot" style="background:var(--secondary)"></span>未完成 ${undoneCount}</div>
          </div>
        </div>
      </div>
    `;

    // 任务列表
    html += `<div class="card"><div class="card-title"><span class="left">● 今日任务</span></div>`;
    if (activeTasks.length === 0) {
      html += `<div class="empty-state"><div class="icon">▤</div>暂无任务，点击右下角添加</div>`;
    } else {
      activeTasks.forEach(task => {
        const badges = [];
        if (task.isFixed) badges.push('<span class="badge badge-fixed">固定</span>');
        if (task.delayCount > 0) badges.push(`<span class="badge badge-delay">已顺延${task.delayCount}次</span>`);
        if (task.done) badges.push('<span class="badge badge-done">完成</span>');

        html += `
          <div class="task-list-item ${task.done ? 'done' : ''}">
            <div class="task-checkbox ${task.done ? 'checked' : ''}" onclick="TodayPage.toggleDone('${task.id}', '${this.currentDate}')"></div>
            <div class="task-content">
              <div class="task-title">${Utils.escape(task.title)}</div>
              ${badges.length ? `<div class="task-badges">${badges.join('')}</div>` : ''}
            </div>
            ${!task.isFixed ? `
              <div class="task-actions">
                <button class="icon-btn" onclick="TodayPage.editTask('${task.id}')">✎</button>
                <button class="icon-btn" onclick="TodayPage.deleteTask('${task.id}')">×</button>
              </div>
            ` : ''}
          </div>
        `;
      });
    }
    html += `</div>`;

    html += `<button class="fab" onclick="TodayPage.addTask()">+</button>`;
    html += `</div>`;

    document.getElementById('page-container').innerHTML = html;
    this.renderPie(activeTasks.length, doneCount, undoneCount);
  },

  renderPie(total, done, undone) {
    const wrap = document.querySelector('.today-pie-wrap');
    if (!wrap) return;
    if (this.pieChart && typeof this.pieChart.destroy === 'function') {
      try { this.pieChart.destroy(); } catch(e) {}
    }

    if (total === 0) {
      wrap.innerHTML = `
        <div style="width:140px;height:140px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg viewBox="0 0 36 36" width="140" height="140">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E8E8E8" stroke-width="3"/>
          </svg>
        </div>
        <div class="today-pie-detail">
          <div class="row"><span class="dot" style="background:var(--primary)"></span>总任务 0</div>
          <div class="row"><span class="dot" style="background:var(--success)"></span>已完成 0</div>
          <div class="row"><span class="dot" style="background:var(--secondary)"></span>未完成 0</div>
        </div>
      `;
      this.pieChart = { destroy: () => {} };
      return;
    }

    const donePct = Math.round(Utils.safeDivide(done, total) * 100);
    
    wrap.innerHTML = `
      <div style="width:140px;height:140px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer" onclick="Modal.toast('已完成 ${done}个 / 未完成 ${undone}个')">
        <svg viewBox="0 0 36 36" width="140" height="140">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EECIDD" stroke-width="3"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#9698E7" stroke-width="3"
            stroke-dasharray="${donePct} ${100 - donePct}"
            stroke-dashoffset="25"
            transform="rotate(-90 18 18)"
            stroke-linecap="round"/>
          <text x="18" y="21" text-anchor="middle" font-size="8" font-weight="700" fill="#9698E7">${donePct}%</text>
        </svg>
      </div>
      <div class="today-pie-detail">
        <div class="row"><span class="dot" style="background:var(--primary)"></span>总任务 ${total}</div>
        <div class="row"><span class="dot" style="background:var(--success)"></span>已完成 ${done}</div>
        <div class="row"><span class="dot" style="background:var(--secondary)"></span>未完成 ${undone}</div>
      </div>
    `;
    this.pieChart = { destroy: () => {} };
  },

  toggleDone(taskId, dateStr) {
    Store.toggleTaskDone(taskId, dateStr);
    this.render(this.currentDate);
  },

  addTask() {
    const formHTML = `
      <div class="form-group">
        <label class="form-label">任务描述</label>
        <input class="form-input" name="title" placeholder="输入任务描述" required>
      </div>
    `;
    Modal.form('新增任务', formHTML, (form) => {
      const title = form.title.value.trim();
      if (!title) { Modal.toast('请输入任务描述'); return false; }
      Store.addTask(this.currentDate, title);
      this.render(this.currentDate);
      Modal.toast('任务已添加');
    });
  },

  editTask(taskId) {
    const task = Store.getData().tasks.find(t => t.id === taskId);
    if (!task) return;
    const formHTML = `
      <div class="form-group">
        <label class="form-label">任务描述</label>
        <input class="form-input" name="title" value="${Utils.escape(task.title)}" required>
      </div>
    `;
    Modal.form('编辑任务', formHTML, (form) => {
      const title = form.title.value.trim();
      if (!title) { Modal.toast('请输入任务描述'); return false; }
      Store.updateTask(taskId, { title });
      this.render(this.currentDate);
      Modal.toast('任务已更新');
    });
  },

  deleteTask(taskId) {
    Modal.confirm('删除任务', '确定将此任务移入回收站？', () => {
      Store.softDelete('tasks', taskId);
      this.render(this.currentDate);
      Modal.toast('已移入回收站');
    }, { danger: true, confirmText: '删除' });
  },
};
