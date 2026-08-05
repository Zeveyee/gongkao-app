/**
 * 主应用入口
 */
let currentTab = 'today';

function switchTab(tab) {
  currentTab = tab;
  
  // 更新tab高亮
  document.querySelectorAll('.tab-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  
  // 渲染对应页面
  switch(tab) {
    case 'today': TodayPage.render(); break;
    case 'practice': PracticePage.render(); break;
    case 'notebook': NotebookPage.render(); break;
    case 'stage': StagePage.render(); break;
    case 'weight': WeightPage.render(); break;
    case 'settings': SettingsPage.render(); break;
  }
  
  // 滚动到顶部
  document.getElementById('page-container').scrollTop = 0;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  Store.init();
  Modal.init();
  
  // 绑定tab点击
  document.querySelectorAll('.tab-item').forEach(el => {
    el.addEventListener('click', () => {
      switchTab(el.dataset.tab);
    });
  });
  
  // 执行自动顺延
  Store.runAutoDelay();
  
  // 渲染首页
  switchTab('today');
});