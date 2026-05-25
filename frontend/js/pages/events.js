const EventsPage = {
  currentPage: 1,
  pageSize: 10,
  filters: {},

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">事件管理</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="createBtn">➕ 创建事件</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="filter-bar">
            <input type="text" class="form-input" id="searchInput" placeholder="搜索事件..." style="width:200px;">
            <select class="form-select" id="eventTypeFilter" style="width:140px;">
              <option value="">全部类型</option>
              <option value="ALERT">告警</option>
              <option value="INCIDENT">事件</option>
              <option value="MAINTENANCE">维护</option>
              <option value="OPERATION">运维</option>
              <option value="OTHER">其他</option>
            </select>
            <select class="form-select" id="severityFilter" style="width:140px;">
              <option value="">全部级别</option>
              <option value="CRITICAL">紧急</option>
              <option value="MAJOR">严重</option>
              <option value="MINOR">一般</option>
              <option value="WARNING">警告</option>
              <option value="INFO">信息</option>
            </select>
            <select class="form-select" id="statusFilter" style="width:140px;">
              <option value="">全部状态</option>
              <option value="NEW">新建</option>
              <option value="ACKNOWLEDGED">已确认</option>
              <option value="IN_PROGRESS">处理中</option>
              <option value="RESOLVED">已解决</option>
              <option value="CLOSED">已关闭</option>
            </select>
            <button class="btn" id="searchBtn">🔍 搜索</button>
          </div>
        </div>
        <div class="card-body" id="tableContainer"></div>
      </div>
    `;

    document.getElementById('createBtn').addEventListener('click', () => this.showCreateModal());
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.filters.search = document.getElementById('searchInput').value;
      this.filters.eventType = document.getElementById('eventTypeFilter').value;
      this.filters.severity = document.getElementById('severityFilter').value;
      this.filters.status = document.getElementById('statusFilter').value;
      this.currentPage = 1;
      this.loadData();
    });

    this.loadData();
  },

  async loadData() {
    try {
      const res = await API.events.list({
        page: this.currentPage,
        limit: this.pageSize,
        ...this.filters,
      });

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'title', label: '标题' },
          { key: 'eventType', label: '类型', render: (v) => {
            const typeMap = { ALERT: '告警', INCIDENT: '事件', MAINTENANCE: '维护', OPERATION: '运维', OTHER: '其他' };
            return typeMap[v] || v;
          }},
          { key: 'severity', label: '级别', render: (v) => {
            const colors = { CRITICAL: 'badge-danger', MAJOR: 'badge-warning', MINOR: 'badge-info', WARNING: 'badge-warning', INFO: 'badge-info' };
            const severityMap = { CRITICAL: '紧急', MAJOR: '严重', MINOR: '一般', WARNING: '警告', INFO: '信息' };
            return `<span class="badge ${colors[v] || 'badge'}">${severityMap[v] || v}</span>`;
          }},
          { key: 'status', label: '状态', render: (v) => {
            const badge = Helpers.getStatusBadge(v);
            return `<span class="badge ${badge.class}">${badge.text}</span>`;
          }},
          { key: 'eventTime', label: '事件时间', render: (v) => Helpers.formatDate(v) },
        ],
        data: res.rows || [],
        pagination: { page: res.page, limit: res.limit, total: res.count },
        onPageChange: (page) => {
          this.currentPage = page;
          this.loadData();
        },
        actions: (row) => `
          <button class="btn btn-sm" data-action="view" data-id="${row.id}">查看</button>
          <button class="btn btn-sm" data-action="edit" data-id="${row.id}">编辑</button>
        `,
      });

      document.getElementById('tableContainer').querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          const id = e.target.dataset.id;
          if (action === 'view') this.viewEvent(id);
          if (action === 'edit') this.viewEvent(id);
        });
      });
    } catch (err) {
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败: ${err.message}</div>`;
    }
  },

  showCreateModal() {
    // 获取当前时间并格式化为 datetime-local 需要的格式 (YYYY-MM-DDTHH:mm)
    const now = new Date();
    const defaultDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    Modal.form({
      title: '创建事件',
      fields: [
        { name: 'title', label: '标题', required: true, helpText: '最多200个字符' },
        { name: 'eventType', label: '类型', type: 'select', required: true, options: [
          { value: 'ALERT', label: '告警' },
          { value: 'INCIDENT', label: '事件' },
          { value: 'MAINTENANCE', label: '维护' },
          { value: 'OPERATION', label: '运维' },
          { value: 'OTHER', label: '其他' },
        ]},
        { name: 'severity', label: '严重级别', type: 'select', required: true, defaultValue: 'INFO', options: [
          { value: 'INFO', label: '信息' },
          { value: 'WARNING', label: '警告' },
          { value: 'MINOR', label: '一般' },
          { value: 'MAJOR', label: '严重' },
          { value: 'CRITICAL', label: '紧急' },
        ]},
        { name: 'eventTime', label: '事件时间', type: 'datetime-local', required: true, defaultValue: defaultDateTime, helpText: '请选择事件发生的时间' },
        { name: 'description', label: '描述', type: 'textarea' },
      ],
      onSubmit: async (data) => {
        try {
          if (data.eventTime) {
            // datetime-local 的值格式为 YYYY-MM-DDTHH:mm，需要转换为 ISO 格式
            data.eventTime = new Date(data.eventTime).toISOString();
          } else {
            data.eventTime = new Date().toISOString();
          }
          await API.events.create(data);
          Helpers.showToast('创建成功', 'success');
          this.loadData();
          return true;
        } catch (err) {
          Helpers.showToast(err.message || '创建失败', 'error');
          return false;
        }
      },
    });
  },

  async viewEvent(id) {
    try {
      const event = await API.events.get(id);
      const typeMap = { ALERT: '告警', INCIDENT: '事件', MAINTENANCE: '维护', OPERATION: '运维', OTHER: '其他' };
      const severityMap = { CRITICAL: '紧急', MAJOR: '严重', MINOR: '一般', WARNING: '警告', INFO: '信息' };
      Modal.show({
        title: '事件详情',
        content: `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div><strong>标题:</strong> ${event.title}</div>
            <div><strong>类型:</strong> ${typeMap[event.eventType] || event.eventType}</div>
            <div><strong>级别:</strong> ${severityMap[event.severity] || event.severity}</div>
            <div><strong>状态:</strong> ${event.status}</div>
            <div><strong>事件时间:</strong> ${Helpers.formatDate(event.eventTime)}</div>
            <div><strong>创建时间:</strong> ${Helpers.formatDate(event.createdAt)}</div>
            <div style="grid-column: span 2;"><strong>描述:</strong> ${event.description || '-'}</div>
          </div>
        `,
        confirmText: '关闭',
        showCancel: false,
      });
    } catch (err) {
      Helpers.showToast('加载失败', 'error');
    }
  },
};

window.EventsPage = EventsPage;
