const Helpers = {
  formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  formatDateShort(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
  },

  formatFileSize(bytes) {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return size.toFixed(2) + ' ' + units[i];
  },

  formatNumber(num) {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('zh-CN');
  },

  getStatusBadge(status) {
    const statusMap = {
      ONLINE: { class: 'badge-success', text: '在线' },
      OFFLINE: { class: 'badge', text: '离线' },
      FAULT: { class: 'badge-danger', text: '故障' },
      MAINTENANCE: { class: 'badge-warning', text: '维护中' },
      READY: { class: 'badge-success', text: '就绪' },
      PROCESSING: { class: 'badge-warning', text: '处理中' },
      UPLOADING: { class: 'badge-info', text: '上传中' },
      ERROR: { class: 'badge-danger', text: '错误' },
      ARCHIVED: { class: 'badge', text: '已归档' },
      PUBLISHED: { class: 'badge-success', text: '已发布' },
      DRAFT: { class: 'badge-info', text: '草稿' },
      QUEUED: { class: 'badge-info', text: '排队中' },
      COMPLETED: { class: 'badge-success', text: '已完成' },
      FAILED: { class: 'badge-danger', text: '失败' },
      CANCELLED: { class: 'badge', text: '已取消' },
      NEW: { class: 'badge-info', text: '新建' },
      ACKNOWLEDGED: { class: 'badge-warning', text: '已确认' },
      IN_PROGRESS: { class: 'badge-warning', text: '处理中' },
      RESOLVED: { class: 'badge-success', text: '已解决' },
      CLOSED: { class: 'badge', text: '已关闭' },
    };
    return statusMap[status] || { class: 'badge', text: status };
  },

  getModelTypeBadge(type) {
    const typeMap = {
      BIM: { class: 'badge-primary', text: 'BIM' },
      GIS: { class: 'badge-info', text: 'GIS' },
      POINTCLOUD: { class: 'badge-warning', text: '点云' },
      OBLIQUE: { class: 'badge-danger', text: '倾斜摄影' },
      '3DMODEL': { class: 'badge-success', text: '3D模型' },
    };
    return typeMap[type] || { class: 'badge', text: type };
  },

  showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container') || (() => {
      const el = document.createElement('div');
      el.className = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

window.Helpers = Helpers;
