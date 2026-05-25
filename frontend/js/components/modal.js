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

    const overlay = this.show({
      title,
      content: `<div id="modalFormContainer"></div>`,
      showFooter: false,
      onConfirm: null,
    });

    // 使用我们的 Form 组件来渲染表单
    const formContainer = overlay.querySelector('#modalFormContainer');
    Form.render(formContainer, {
      fields,
      values,
      submitText,
      onSubmit: async (data) => {
        if (onSubmit) {
          const result = onSubmit(data);
          if (result instanceof Promise) {
            return result.then((shouldClose) => {
              if (shouldClose !== false) {
                overlay.remove();
              }
            });
          } else if (result !== false) {
            overlay.remove();
          }
          return result;
        }
        overlay.remove();
        return true;
      },
    });

    return overlay;
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
