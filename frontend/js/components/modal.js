const Modal = {
  show(options) {
    const {
      title = '',
      content = '',
      onConfirm = null,
      confirmText = '确定',
      onCancel = null,
      showFooter = true,
    } = options;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">${content}</div>
        ${showFooter ? `
          <div class="modal-footer">
            <button class="btn" id="modalCancel">取消</button>
            <button class="btn btn-primary" id="modalConfirm">${confirmText}</button>
          </div>
        ` : ''}
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    overlay.querySelector('.modal-close').addEventListener('click', () => {
      if (onCancel) onCancel();
      close();
    });

    const cancelBtn = overlay.querySelector('#modalCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (onCancel) onCancel();
        close();
      });
    }

    const confirmBtn = overlay.querySelector('#modalConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (onConfirm) {
          const result = await onConfirm(overlay);
          if (result !== false) close();
        } else {
          close();
        }
      });
    }

    return overlay;
  },

  form(options) {
    const {
      title = '',
      fields = [],
      values = {},
      onSubmit = null,
      submitText = '提交',
    } = options;

    let formHtml = '';
    fields.forEach(field => {
      const value = values[field.name] ?? '';
      if (field.type === 'select') {
        formHtml += `
          <div class="form-group">
            <label class="form-label">${field.label}${field.required ? ' *' : ''}</label>
            <select class="form-select" name="${field.name}" ${field.required ? 'required' : ''}>
              <option value="">请选择</option>
              ${field.options.map(opt => `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
            </select>
          </div>
        `;
      } else if (field.type === 'textarea') {
        formHtml += `
          <div class="form-group">
            <label class="form-label">${field.label}${field.required ? ' *' : ''}</label>
            <textarea class="form-textarea" name="${field.name}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">${value}</textarea>
          </div>
        `;
      } else {
        formHtml += `
          <div class="form-group">
            <label class="form-label">${field.label}${field.required ? ' *' : ''}</label>
            <input type="${field.type || 'text'}" class="form-input" name="${field.name}" value="${value}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}" ${field.type === 'number' ? 'step="any"' : ''}>
          </div>
        `;
      }
    });

    return this.show({
      title,
      content: `<form id="modalForm">${formHtml}</form>`,
      onConfirm: (overlay) => {
        const form = overlay.querySelector('#modalForm');
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });
        if (onSubmit) return onSubmit(data);
        return true;
      },
    });
  },

  alert(message, type = 'info') {
    this.show({
      title: '提示',
      content: `<div class="alert alert-${type}">${message}</div>`,
      showFooter: true,
      confirmText: '知道了',
      onConfirm: () => true,
    });
  },

  confirm(message, onConfirm) {
    this.show({
      title: '确认操作',
      content: `<p>${message}</p>`,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        return true;
      },
    });
  },
};

window.Modal = Modal;
