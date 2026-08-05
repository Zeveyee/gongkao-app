/**
 * 工具函数
 */
const Utils = {
  // 日期格式化
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const weeks = ['日','一','二','三','四','五','六'];
    return `${d.getMonth()+1}月${d.getDate()}日 周${weeks[d.getDay()]}`;
  },

  // 获取月份天数
  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  },

  // 数字校验
  validateNumber(val, allowZero = true) {
    const num = parseFloat(val);
    if (isNaN(num)) return { ok: false, msg: '请输入有效数字' };
    if (num < 0) return { ok: false, msg: '不能输入负数' };
    if (!allowZero && num === 0) return { ok: false, msg: '不能为0' };
    return { ok: true, num };
  },

  // 安全除法
  safeDivide(a, b) {
    if (!b || b === 0) return 0;
    return a / b;
  },

  // 百分比
  toPercent(num) {
    return Math.round(num * 100) + '%';
  },

  // HTML转义
  escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // 防抖
  debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // 生成简单UUID
  uuid() {
    return Store.genId();
  },

  // 获取星期中文
  getWeekDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return ['日','一','二','三','四','五','六'][d.getDay()];
  },

  // 计算两个日期相差天数
  daysBetween(d1, d2) {
    const date1 = new Date(d1 + 'T00:00:00');
    const date2 = new Date(d2 + 'T00:00:00');
    const diff = date2 - date1;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },
};
