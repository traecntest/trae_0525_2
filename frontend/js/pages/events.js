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
            <select class="form-select" id="severityFilter" style="width:140px;">
              <option value="">全部级别</option>
              <option value="CRITICAL">紧急</option>
              <option value="MAJOR">严重</option>
              <option value="MINOR">一般</option>
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
      this.filters.title = document.getElementById('searchInput').value;
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
          { key: 'type', label: '类型' },
          { key: 'severity', label: '级别', render: (v) => {
            const colors = { CRITICAL: 'badge-danger', MAJOR: 'badge-warning', MINOR: 'badge-info' };
            return `<span class="badge ${colors[v] || 'badge'}">${v}</span>`;
          }},
          { key: 'status', label: '状态', render: (v) => {
            const badge = Helpers.getStatusBadge(v);
            return `<span class="badge ${badge.class}">${badge.text}</span>`;
          }},
          { key: 'createdAt', label: '创建时间', render: (v) => Helpers.formatDate(v) },
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
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败</div>`;
    }
  },

  showCreateModal() {
    Modal.form({
      title: '创建事件',
      fields: [
        { name: 'title', label: '标题', required: true },
        { name: 'type', label: '类型', type: 'select', required: true, options: [
          { value: 'INCIDENT', label: '事件' },
          { value: 'ALERT', label: '告警' },
          { value: 'WARNING', label: '警告' },
          { value: 'INFO', label: '信息' },
          { value: 'MAINTENANCE', label: '维护' },
        ]},
        { name: 'severity', label: '严重级别', type: 'select', required: true, options: [
          { value: 'CRITICAL', label: '紧急' },
          { value: 'MAJOR', label: '严重' },
          { value: 'MINOR', label: '一般' },
          { value: 'WARNING', label: '警告' },
          { value: 'INFO', label: '信息' },
        ]},
        { name: 'description', label: '描述', type: 'textarea' },
      ],
      onSubmit: async (data) => {
        try {
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
      Modal.show({
        title: '事件详情',
        content: `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div><strong>标题:</strong> ${event.title}</div>
            <div><strong>类型:</strong> ${event.type}</div>
            <div><strong>级别:</strong> ${event.severity}</div>
            <div><strong>状态:</strong> ${event.status}</div>
            <div style="grid-column: span 2;"><strong>描述:</strong> ${event.description || '-'}</div>
            <div><strong>创建时间:</strong> ${Helpers.formatDate(event.createdAt)}</div>
            <div><strong>更新时间:</strong> ${Helpers.formatDate(event.updatedAt)}</div>
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
