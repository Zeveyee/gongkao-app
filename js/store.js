/**
 * 全局数据存储层 - 基于 localStorage
 * 统一管理所有数据，包含软删除回收站机制
 */
const Store = {
  DB_KEY: 'gongkao_db_v1',
  EXAM_START: '2026-08-05',
  EXAM_END: '2026-11-30',

  // 固定系统任务
  FIXED_TASKS: [
    { id: 'fixed_morning', title: '早上复盘', isFixed: true },
    { id: 'fixed_evening', title: '晚上笔记整理+晚上复盘', isFixed: true },
  ],

  // 行测默认模块
  XINGCE_MODULES: ['言语理解', '判断推理', '资料分析', '数量关系', '常识'],

  // 申论默认二级题型
  SHENLUN_DEFAULT_TYPES: ['单一概括题', '综合分析题', '提出对策题', '公文应用文', '大作文'],

  // 默认阶段
  DEFAULT_STAGES: [
    { id: 'stage_1', name: '8月｜基础阶段', start: '2026-08-05', end: '2026-08-31', modules: [] },
    { id: 'stage_2', name: '9月｜刷题阶段', start: '2026-09-01', end: '2026-09-30', modules: [] },
    { id: 'stage_3', name: '10月｜套题阶段', start: '2026-10-01', end: '2026-10-31', modules: [] },
    { id: 'stage_4', name: '11月｜模考阶段', start: '2026-11-01', end: '2026-11-30', modules: [] },
  ],

  _data: null,

  // ===== 初始化 =====
  init() {
    const raw = localStorage.getItem(this.DB_KEY);
    if (raw) {
      try {
        this._data = JSON.parse(raw);
      } catch(e) {
        this._data = this.getDefault();
      }
    } else {
      this._data = this.getDefault();
      this.save();
    }
    // 确保结构完整
    this._ensureStructure();
  },

  getDefault() {
    return {
      tasks: [],           // 每日任务 {id, date, title, isFixed, done, delayCount, createdAt, deleted, deletedAt}
      restDays: [],        // 休息日标记 {id, date, deleted, deletedAt}
      practiceRecords: [], // 刷题记录
      xingceNotebooks: [], // 行测题本 {id, name, module, custom, items:[{id,name,...}], deleted, deletedAt}
      shenlunNotebooks: [],// 申论题本
      xingceSubItems: [],  // 行测二级子条目 {id, notebookId, name, totalQuest, doneQuest, wrongQuest, secondDone, secondWrong, deleted, deletedAt}
      shenlunSubItems: [], // 申论二级题型 {id, notebookId, name, deleted, deletedAt}
      stages: JSON.parse(JSON.stringify(this.DEFAULT_STAGES)),
      weights: [],         // 体重记录 {id, date, morning, evening, deleted, deletedAt}
      settings: {
        autoDelay: true,   // 自动顺延开关
      },
      recycleBin: [],      // 回收站 {type, data, deletedAt}
    };
  },

  _ensureStructure() {
    const d = this._data;
    const def = this.getDefault();
    const keys = Object.keys(def);
    for (const k of keys) {
      if (d[k] === undefined || d[k] === null) {
        d[k] = def[k];
      }
    }
    if (!d.settings) d.settings = { autoDelay: true };
    if (d.settings.autoDelay === undefined) d.settings.autoDelay = true;
    if (!d.stages || d.stages.length === 0) {
      d.stages = JSON.parse(JSON.stringify(this.DEFAULT_STAGES));
    }
  },

  save() {
    localStorage.setItem(this.DB_KEY, JSON.stringify(this._data));
  },

  getData() {
    return this._data;
  },

  // ===== 通用ID生成 =====
  genId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  },

  // ===== 日期工具 =====
  today() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  dateInRange(dateStr) {
    return dateStr >= this.EXAM_START && dateStr <= this.EXAM_END;
  },

  // ===== 软删除通用方法 =====
  softDelete(type, id) {
    const arr = this._data[type];
    if (!arr) return;
    const item = arr.find(x => x.id === id);
    if (item && !item.deleted) {
      item.deleted = true;
      item.deletedAt = new Date().toISOString();
      this.save();
    }
  },

  restore(type, id) {
    const arr = this._data[type];
    if (!arr) return;
    const item = arr.find(x => x.id === id);
    if (item && item.deleted) {
      item.deleted = false;
      delete item.deletedAt;
      this.save();
    }
  },

  permanentDelete(type, id) {
    const arr = this._data[type];
    if (!arr) return;
    const idx = arr.findIndex(x => x.id === id);
    if (idx >= 0) {
      arr.splice(idx, 1);
      this.save();
    }
  },

  // 获取所有回收站数据
  getRecycleBin() {
    const types = ['tasks', 'restDays', 'practiceRecords', 'xingceNotebooks', 'shenlunNotebooks', 'xingceSubItems', 'shenlunSubItems', 'weights', 'stageModules'];
    const result = [];
    // tasks
    this._data.tasks.forEach(t => {
      if (t.deleted) result.push({ type: 'tasks', typeLabel: '每日任务', data: t });
    });
    // restDays
    this._data.restDays.forEach(r => {
      if (r.deleted) result.push({ type: 'restDays', typeLabel: '休息日标记', data: r });
    });
    // practiceRecords
    this._data.practiceRecords.forEach(p => {
      if (p.deleted) result.push({ type: 'practiceRecords', typeLabel: '刷题记录', data: p });
    });
    // xingceNotebooks
    this._data.xingceNotebooks.forEach(n => {
      if (n.deleted) result.push({ type: 'xingceNotebooks', typeLabel: '行测题本', data: n });
    });
    // shenlunNotebooks
    this._data.shenlunNotebooks.forEach(n => {
      if (n.deleted) result.push({ type: 'shenlunNotebooks', typeLabel: '申论题本', data: n });
    });
    // xingceSubItems
    this._data.xingceSubItems.forEach(s => {
      if (s.deleted) result.push({ type: 'xingceSubItems', typeLabel: '行测二级条目', data: s });
    });
    // shenlunSubItems
    this._data.shenlunSubItems.forEach(s => {
      if (s.deleted) result.push({ type: 'shenlunSubItems', typeLabel: '申论二级条目', data: s });
    });
    // weights
    this._data.weights.forEach(w => {
      if (w.deleted) result.push({ type: 'weights', typeLabel: '体重记录', data: w });
    });
    // stageModules (嵌套在stages中)
    this._data.stages.forEach(stage => {
      if (stage.modules) {
        stage.modules.forEach(m => {
          if (m.deleted) result.push({ type: 'stageModules', typeLabel: '学习小模块', data: m, stageId: stage.id });
        });
      }
    });
    return result;
  },

  // 清空回收站
  emptyRecycleBin() {
    const types = ['tasks', 'restDays', 'practiceRecords', 'xingceNotebooks', 'shenlunNotebooks', 'xingceSubItems', 'shenlunSubItems', 'weights'];
    types.forEach(t => {
      this._data[t] = this._data[t].filter(x => !x.deleted);
    });
    this._data.stages.forEach(stage => {
      if (stage.modules) {
        stage.modules = stage.modules.filter(m => !m.deleted);
      }
    });
    this.save();
  },

  // 全部复原
  restoreAll() {
    const types = ['tasks', 'restDays', 'practiceRecords', 'xingceNotebooks', 'shenlunNotebooks', 'xingceSubItems', 'shenlunSubItems', 'weights'];
    types.forEach(t => {
      this._data[t].forEach(x => {
        if (x.deleted) { x.deleted = false; delete x.deletedAt; }
      });
    });
    this._data.stages.forEach(stage => {
      if (stage.modules) {
        stage.modules.forEach(m => {
          if (m.deleted) { m.deleted = false; delete m.deletedAt; }
        });
      }
    });
    this.save();
  },

  // ===== 备份导入导出 =====
  exportBackup() {
    return JSON.stringify(this._data, null, 2);
  },

  importBackup(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.tasks || !data.settings) {
        return { ok: false, msg: '文件格式不正确，不是有效的备份文件' };
      }
      this._data = data;
      this._ensureStructure();
      this.save();
      return { ok: true };
    } catch(e) {
      return { ok: false, msg: '解析JSON失败：' + e.message };
    }
  },

  // ===== 一键清空 =====
  clearAll() {
    this._data = this.getDefault();
    this.save();
  },

  // ===== 休息日 =====
  isRestDay(dateStr) {
    return this._data.restDays.some(r => r.date === dateStr && !r.deleted);
  },

  toggleRestDay(dateStr) {
    const existing = this._data.restDays.find(r => r.date === dateStr);
    if (existing) {
      if (existing.deleted) {
        existing.deleted = false;
        delete existing.deletedAt;
      } else {
        existing.deleted = true;
        existing.deletedAt = new Date().toISOString();
      }
    } else {
      this._data.restDays.push({
        id: this.genId(),
        date: dateStr,
        deleted: false,
      });
    }
    this.save();
  },

  // ===== 任务系统 =====
  getTasksByDate(dateStr) {
    // 返回当天的任务（含固定任务）
    const customTasks = this._data.tasks.filter(t => t.date === dateStr && !t.deleted);
    const fixedTasks = this.FIXED_TASKS.map(ft => {
      const existing = this._data.tasks.find(t => t.id === ft.id && t.date === dateStr && !t.deleted);
      return existing || {
        id: ft.id,
        date: dateStr,
        title: ft.title,
        isFixed: true,
        done: false,
        delayCount: 0,
        createdAt: new Date().toISOString(),
      };
    });
    return [...fixedTasks, ...customTasks.filter(t => !t.isFixed)];
  },

  addTask(dateStr, title) {
    const task = {
      id: this.genId(),
      date: dateStr,
      title: title,
      isFixed: false,
      done: false,
      delayCount: 0,
      createdAt: new Date().toISOString(),
      deleted: false,
    };
    this._data.tasks.push(task);
    this.save();
    return task;
  },

  updateTask(id, updates) {
    const task = this._data.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      this.save();
    }
  },

  toggleTaskDone(id, dateStr) {
    // 固定任务可能不存在于数组中，需创建
    let task = this._data.tasks.find(t => t.id === id && t.date === dateStr);
    if (!task) {
      // 创建固定任务记录
      const fixed = this.FIXED_TASKS.find(f => f.id === id);
      if (fixed) {
        task = {
          id: fixed.id,
          date: dateStr,
          title: fixed.title,
          isFixed: true,
          done: false,
          delayCount: 0,
          createdAt: new Date().toISOString(),
          deleted: false,
        };
        this._data.tasks.push(task);
      }
    }
    if (task) {
      task.done = !task.done;
      this.save();
    }
  },

  // ===== 任务顺延逻辑 =====
  runAutoDelay() {
    if (!this._data.settings.autoDelay) return;
    const today = this.today();
    
    // 获取所有有未完成非固定任务的日期
    const datesWithTasks = {};
    this._data.tasks.forEach(t => {
      if (!t.deleted && !t.isFixed && !t.done) {
        if (!datesWithTasks[t.date]) datesWithTasks[t.date] = [];
        datesWithTasks[t.date].push(t);
      }
    });

    // 对每个日期，检查是否需要顺延到次日
    Object.keys(datesWithTasks).forEach(dateStr => {
      if (dateStr >= today) return; // 今天及以后不顺延
      const tasks = datesWithTasks[dateStr];
      tasks.forEach(task => {
        // 检查次日是否是休息日或今天
        const nextDate = this.addDays(dateStr, 1);
        if (nextDate > today) return; // 不超过今天
        
        // 如果次日是休息日，任务停留在当日，不顺延
        if (this.isRestDay(nextDate)) return;
        
        // 检查是否已经在次日有同一个原始任务（防止重复复制）
        const alreadyDelayed = this._data.tasks.find(t => 
          t.id === task.id && t.date === nextDate && !t.deleted
        );
        if (alreadyDelayed) return;
        
        // 顺延：更新任务日期
        task.date = nextDate;
        task.delayCount = (task.delayCount || 0) + 1;
      });
    });
    this.save();
  },

  addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  },

  // ===== 日历统计 =====
  getCalendarStats() {
    let completedDays = 0;
    let incompleteDays = 0;
    let restDays = 0;
    
    // 收集真实存在任务的日期
    const dateSet = new Set();
    this._data.tasks.forEach(t => {
      if (!t.deleted && !t.isFixed) dateSet.add(t.date);
    });
    // 标记已交互过的固定任务日期（用户至少查看/操作过的日期）
    this._data.tasks.forEach(t => {
      if (!t.deleted && t.isFixed && (t.done || t.createdAt)) {
        dateSet.add(t.date);
      }
    });
    // 添加休息日
    this._data.restDays.forEach(r => {
      if (!r.deleted && this.dateInRange(r.date)) dateSet.add(r.date);
    });

    // 只遍历有任务的日期
    const sortedDates = Array.from(dateSet).sort();
    sortedDates.forEach(cur => {
      if (!this.dateInRange(cur)) return;
      if (cur > this.today()) return; // 未来日期不统计
      const isRest = this.isRestDay(cur);
      if (isRest) {
        restDays++;
      } else {
        // 只看数组中真实存在的任务
        const realTasks = this._data.tasks.filter(t => t.date === cur && !t.deleted);
        if (realTasks.length > 0) {
          const allDone = realTasks.every(t => t.done);
          if (allDone) completedDays++;
          else incompleteDays++;
        }
      }
    });
    
    return { completedDays, incompleteDays, restDays };
  },

  getDayStatus(dateStr) {
    if (!this.dateInRange(dateStr)) return 'out';
    if (this.isRestDay(dateStr)) return 'rest';
    // 只看数组中真实存在的任务
    const realTasks = this._data.tasks.filter(t => t.date === dateStr && !t.deleted);
    if (realTasks.length === 0) return 'empty';
    const allDone = realTasks.every(t => t.done);
    return allDone ? 'complete' : 'incomplete';
  },
};
