const ValidationRules = {
  username: {
    pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    minLength: 3,
    maxLength: 50,
    message: '用户名格式不正确，仅支持字母、数字、下划线和连字符，且必须以字母开头'
  },
  password: {
    pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
    minLength: 8,
    maxLength: 100,
    message: '密码长度至少 8 位，且需包含字母和数字'
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 100,
    message: '请输入有效的邮箱地址'
  },
  phone: {
    pattern: /^(1[3-9]\d{9}|\+[1-9]\d{1,14})$/,
    maxLength: 20,
    message: '请输入有效的手机号码'
  },
  fullName: {
    maxLength: 100,
    message: '姓名不能超过 100 个字符'
  }
};

function validateField(fieldType, value, required) {
  const errors = [];
  
  if (required && (!value || value.trim() === '')) {
    errors.push('此字段为必填项');
    return errors;
  }
  
  if (!value || value.trim() === '') {
    return errors;
  }
  
  const rules = ValidationRules[fieldType];
  if (!rules) return errors;
  
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`长度不能少于 ${rules.minLength} 个字符`);
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`长度不能超过 ${rules.maxLength} 个字符`);
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.message);
  }
  
  return errors;
}

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
      
      const form = e.target;
      const formData = new FormData(form);
      const data = {};
      let hasErrors = false;
      
      form.querySelectorAll('.form-error').forEach(el => el.remove());
      form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
        el.classList.remove('error');
      });
      
      fields.forEach(field => {
        const value = formData.get(field.name) || '';
        data[field.name] = value;
        
        if (field.validateType || field.type) {
          const validateType = field.validateType || field.type;
          const errors = validateField(validateType, value, field.required);
          
          if (errors.length > 0) {
            hasErrors = true;
            this.showFieldError(form, field.name, errors[0]);
          }
        }
      });
      
      if (hasErrors) {
        return;
      }
      
      if (onSubmit) {
        const result = onSubmit(data);
        if (result instanceof Promise) {
          result.catch(err => {
            if (err.errors && Array.isArray(err.errors)) {
              err.errors.forEach(errItem => {
                this.showFieldError(form, errItem.field, errItem.message);
              });
            }
          });
        }
      }
    });
    
    fields.forEach(field => {
      const input = container.querySelector(`[name="${field.name}"]`);
      if (input) {
        input.addEventListener('blur', () => {
          const validateType = field.validateType || field.type;
          const errors = validateField(validateType, input.value, field.required);
          
          const existingError = container.querySelector(`[data-field-error="${field.name}"]`);
          if (existingError) existingError.remove();
          input.classList.remove('error');
          
          if (errors.length > 0) {
            this.showFieldError(container, field.name, errors[0]);
          }
        });
      }
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
      defaultValue = '',
    } = field;

    let inputHtml = '';
    let displayValue = value || defaultValue;

    switch (type) {
      case 'select':
        inputHtml = `
          <select class="form-select" name="${name}" ${required ? 'required' : ''}>
            <option value="">请选择</option>
            ${options.map(opt => `<option value="${opt.value}" ${displayValue === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
          </select>
        `;
        break;
      case 'textarea':
        inputHtml = `<textarea class="form-textarea" name="${name}" placeholder="${placeholder}" ${required ? 'required' : ''}>${displayValue}</textarea>`;
        break;
      case 'number':
        inputHtml = `<input type="number" class="form-input" name="${name}" value="${displayValue}" placeholder="${placeholder}" ${required ? 'required' : ''} step="any">`;
        break;
      case 'date':
        inputHtml = `<input type="date" class="form-input" name="${name}" value="${displayValue}" ${required ? 'required' : ''}>`;
        break;
      case 'datetime-local':
        inputHtml = `<input type="datetime-local" class="form-input" name="${name}" value="${displayValue}" ${required ? 'required' : ''}>`;
        break;
      case 'email':
        inputHtml = `<input type="text" class="form-input" name="${name}" value="${displayValue}" placeholder="${placeholder}" ${required ? 'required' : ''}>`;
        break;
      case 'password':
        const passwordRules = ValidationRules.password;
        const passwordPlaceholder = placeholder || `密码长度至少 ${passwordRules.minLength} 位，需包含字母和数字`;
        inputHtml = `<input type="password" class="form-input" name="${name}" placeholder="${passwordPlaceholder}" ${required ? 'required' : ''}>`;
        break;
      case 'checkbox':
        inputHtml = `<label class="form-checkbox"><input type="checkbox" name="${name}" ${displayValue ? 'checked' : ''}><span>${label}</span></label>`;
        return `<div class="form-group">${inputHtml}</div>`;
      case 'hidden':
        return `<input type="hidden" name="${name}" value="${displayValue}">`;
      default:
        inputHtml = `<input type="text" class="form-input" name="${name}" value="${displayValue}" placeholder="${placeholder}" ${required ? 'required' : ''}>`;
    }

    return `
      <div class="form-group">
        <label class="form-label">${label}${required ? ' *' : ''}</label>
        ${inputHtml}
        ${helpText ? `<small class="form-help">${helpText}</small>` : ''}
      </div>
    `;
  },
  
  showFieldError(container, fieldName, message) {
    const input = container.querySelector(`[name="${fieldName}"]`);
    if (!input) return;
    
    input.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.dataset.fieldError = fieldName;
    errorDiv.textContent = message;
    
    const formGroup = input.closest('.form-group');
    if (formGroup) {
      formGroup.appendChild(errorDiv);
    }
  },
};

window.Form = Form;
window.ValidationRules = ValidationRules;
