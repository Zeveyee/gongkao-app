/**
 * 备考日历页面
 */
const CalendarPage = {
  selectedDate: null,

  render() {
    this.selectedDate = Store.today();
    let html = `<div class="page active" id="page-calendar">`;
    html += `<div class="page-header">▦ 备考日历</div>`;

    // 统计汇总
    const stats = Store.getCalendarStats();
    html += `
      <div class="card">
        <div class="calendar-summary">
          <div class="item"><div class="num" style="color:var(--primary)">${stats.completedDays}</div><div class="label">完成天数</div></div>
          <div class="item"><div class="num" style="color:var(--secondary)">${stats.incompleteDays}</div><div class="label">未完成天数</div></div>
          <div class="item"><div class="num" style="color:var(--tertiary)">${stats.restDays}</div><div class="label">休息日数</div></div>
        </div>
        <div class="calendar-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--primary)"></div>全部完成</div>
          <div class="legend-item"><div class="legend-color" style="background:var(--secondary)"></div>有未完成</div>
          <div class="legend-item"><div class="legend-color" style="background:var(--tertiary)"></div>休息日</div>
          <div class="legend-item"><div class="legend-color" style="background:#E8E8E8"></div>周期外</div>
        </div>
      </div>
    `;

    // 日历：8月~11月
    const months = [
      { y: 2026, m: 7, name: '2026年8月' },
      { y: 2026, m: 8, name: '2026年9月' },
      { y: 2026, m: 9, name: '2026年10月' },
      { y: 2026, m: 10, name: '2026年11月' },
    ];

    months.forEach(mon => {
      html += this.renderMonth(mon.y, mon.m, mon.name);
    });

    html += `</div>`;
    document.getElementById('page-container').innerHTML = html;
    this.bindLongPress();
  },

  renderMonth(year, month, name) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = Utils.getDaysInMonth(year, month);
    let html = `<div class="card calendar-month"><div class="calendar-month-title">${name}</div>`;
    
    // 星期标题
    html += `<div class="calendar-weekdays">`;
    ['日','一','二','三','四','五','六'].forEach(w => html += `<div>${w}</div>`);
    html += `</div><div class="calendar-grid">`;

    // 空白
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day empty"></div>`;
    }

    const today = Store.today();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const inRange = Store.dateInRange(dateStr);
      const status = Store.getDayStatus(dateStr);
      const isToday = dateStr === today;
      
      let classes = 'cal-day';
      let extra = '';
      if (!inRange) {
        classes += ' out';
      } else {
        if (status === 'rest') classes += ' rest';
        else if (status === 'complete') classes += ' complete';
        else if (status === 'incomplete') classes += ' incomplete';
      }
      if (isToday) classes += ' today';
      
      html += `<div class="${classes}" data-date="${dateStr}" onclick="CalendarPage.selectDate('${dateStr}')"><span class="num">${d}</span></div>`;
    }

    html += `</div></div>`;
    return html;
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    // 跳转到该日期的任务列表
    TodayPage.render(dateStr);
    switchTab('today');
  },

  // 长按标记休息日
  bindLongPress() {
    document.querySelectorAll('.cal-day[data-date]').forEach(el => {
      let timer;
      const dateStr = el.dataset.date;
      
      const start = (e) => {
        e.preventDefault();
        timer = setTimeout(() => {
          this.toggleRestDay(dateStr);
          timer = null;
        }, 600);
      };
      const end = () => {
        if (timer) { clearTimeout(timer); timer = null; }
      };
      
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end);
      el.addEventListener('touchmove', end);
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    });
  },

  toggleRestDay(dateStr) {
    if (!Store.dateInRange(dateStr)) {
      Modal.toast('周期外日期不可标记');
      return;
    }
    const isRest = Store.isRestDay(dateStr);
    Modal.confirm(
      isRest ? '取消休息日' : '标记休息日',
      isRest ? `确定取消 ${dateStr} 的休息日标记？` : `确定将 ${dateStr} 标记为休息日？\n休息日任务不会自动顺延`,
      () => {
        Store.toggleRestDay(dateStr);
        this.render();
        Modal.toast(isRest ? '已取消休息日' : '已标记休息日');
      }
    );
  },
};

function showCalendar() {
  CalendarPage.render();
}
