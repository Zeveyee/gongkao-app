/**
 * 弹窗系统
 */
const Modal = {
  overlay: null,
  box: null,

  init() {
    this.overlay = document.getElementById('modal-overlay');
    this.box = document.getElementById('modal-box');
    this.overlay.addEventListener('click', () => this.close());
  },

  // 确认弹窗
  confirm(title, body, onConfirm, opts = {}) {
    const confirmText = opts.confirmText || '确定';
    const cancelText = opts.cancelText || '取消';
    const danger = opts.danger ? 'btn-danger' : 'btn-primary';
    
    this.box.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">
        <button class="btn btn-sm" style="background:#f0f0f0;color:#666" onclick="Modal.close()">${cancelText}</button>
        <button class="btn ${danger}" id="modal-confirm-btn">${confirmText}</button>
      </div>
    `;
    this.show();
    document.getElementById('modal-confirm-btn').onclick = () => {
      this.close();
      if (onConfirm) onConfirm();
    };
  },

  // 自定义内容弹窗
  showCustom(title, contentHTML, onMount) {
    this.box.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-body left">${contentHTML}</div>
    `;
    this.show();
    if (onMount) onMount();
  },

  // 表单弹窗
  form(title, formHTML, onSubmit, opts = {}) {
    const submitText = opts.submitText || '确定';
    const cancelText = opts.cancelText || '取消';
    
    this.box.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-body left" style="margin-bottom:14px">
        <form id="modal-form">${formHTML}</form>
      </div>
      <div class="modal-actions">
        <button class="btn btn-sm" style="background:#f0f0f0;color:#666" onclick="Modal.close()">${cancelText}</button>
        <button class="btn btn-primary" id="modal-submit-btn">${submitText}</button>
      </div>
    `;
    this.show();
    document.getElementById('modal-submit-btn').onclick = () => {
      const form = document.getElementById('modal-form');
      if (onSubmit) {
        const result = onSubmit(form);
        if (result !== false) {
          this.close();
        }
      } else {
        this.close();
      }
    };
  },

  show() {
    this.overlay.style.display = 'block';
    this.box.style.display = 'block';
  },

  close() {
    this.overlay.style.display = 'none';
    this.box.style.display = 'none';
  },

  // Toast提示
  toast(msg, duration = 2000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, duration);
  },
};
