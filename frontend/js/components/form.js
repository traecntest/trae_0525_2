const Form = {
  render(container, options) {
    const {
      fields = [],
      values = {},
      onSubmit = null,
      submitText = '提交',
      className = '',
    } = options;

    container.innerHTML = `
      <form class="form ${className}" id="dynamicForm">
        ${fields.map(field => this.renderField(field, values[field.name])).join('')}
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${submitText}</button>
        </div>
      </form>
    `;

    container.querySelector('#dynamicForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!e.target.checkValidity()) {
        e.target.reportValidity();
        return;
      }
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      if (onSubmit) onSubmit(data);
    });
  },

  renderField(field, value = '') {
    const {
      name,
      label,
      type = 'text',
      required = false,
      placeholder = '',
      options = [],
      helpText = '',
    } = field;

    let inputHtml = '';

    switch (type) {
      case 'select':
        inputHtml = `
          <select class="form-select" name="${name}" ${required ? 'required' : ''}>
            <option value="">请选择</option>
            ${options.map(opt => `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
          </select>
        `;
        break;
      case 'textarea':
        inputHtml = `<textarea class="form-textarea" name="${name}" placeholder="${placeholder}" ${required ? 'required' : ''}>${value}</textarea>`;
        break;
      case 'number':
        inputHtml = `<input type="number" class="form-input" name="${name}" value="${value}" placeholder="${placeholder}" ${required ? 'required' : ''} step="any">`;
        break;
      case 'date':
        inputHtml = `<input type="date" class="form-input" name="${name}" value="${value}" ${required ? 'required' : ''}>`;
        break;
      case 'email':
        inputHtml = `<input type="email" class="form-input" name="${name}" value="${value}" placeholder="${placeholder}" ${required ? 'required' : ''}>`;
        break;
      case 'password':
        inputHtml = `<input type="password" class="form-input" name="${name}" placeholder="${placeholder}" ${required ? 'required' : ''}>`;
        break;
      case 'checkbox':
        inputHtml = `<label class="form-checkbox"><input type="checkbox" name="${name}" ${value ? 'checked' : ''}><span>${label}</span></label>`;
        return `<div class="form-group">${inputHtml}</div>`;
      case 'hidden':
        return `<input type="hidden" name="${name}" value="${value}">`;
      default:
        inputHtml = `<input type="text" class="form-input" name="${name}" value="${value}" placeholder="${placeholder}" ${required ? 'required' : ''}>`;
    }

    return `
      <div class="form-group">
        <label class="form-label">${label}${required ? ' *' : ''}</label>
        ${inputHtml}
        ${helpText ? `<small class="form-help">${helpText}</small>` : ''}
      </div>
    `;
  },
};

window.Form = Form;
