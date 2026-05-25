const BusinessPage = {
  currentPage: 1,
  pageSize: 10,

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">业务对象</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="createBtn">➕ 创建对象</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="filter-bar">
            <input type="text" class="form-input" id="searchInput" placeholder="搜索对象..." style="width:200px;">
            <select class="form-select" id="typeFilter" style="width:140px;">
              <option value="">全部类型</option>
              <option value="BUILDING">建筑</option>
              <option value="ROAD">道路</option>
              <option value="BRIDGE">桥梁</option>
              <option value="PARK">公园</option>
              <option value="PIPELINE">管线</option>
            </select>
            <button class="btn" id="searchBtn">🔍 搜索</button>
          </div>
        </div>
        <div class="card-body" id="tableContainer"></div>
      </div>
    `;

    document.getElementById('createBtn').addEventListener('click', () => this.showCreateModal());
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.currentPage = 1;
      this.loadData();
    });

    this.loadData();
  },

  async loadData() {
    try {
      const name = document.getElementById('searchInput')?.value || '';
      const type = document.getElementById('typeFilter')?.value || '';
      const res = await API.business.list({
        page: this.currentPage,
        limit: this.pageSize,
        name,
        type,
      });

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '名称' },
          { key: 'code', label: '编码' },
          { key: 'type', label: '类型' },
          { key: 'status', label: '状态', render: (v) => {
            const badge = Helpers.getStatusBadge(v);
            return `<span class="badge ${badge.class}">${badge.text}</span>`;
          }},
          { key: 'createdAt', label: '创建时间', render: (v) => Helpers.formatDateShort(v) },
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
          if (action === 'view') this.viewObject(id);
          if (action === 'edit') this.viewObject(id);
        });
      });
    } catch (err) {
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败</div>`;
    }
  },

  showCreateModal() {
    Modal.form({
      title: '创建业务对象',
      fields: [
        { name: 'name', label: '名称', required: true },
        { name: 'code', label: '编码', required: true },
        { name: 'type', label: '类型', type: 'select', required: true, options: [
          { value: 'BUILDING', label: '建筑' },
          { value: 'ROAD', label: '道路' },
          { value: 'BRIDGE', label: '桥梁' },
          { value: 'PARK', label: '公园' },
          { value: 'PIPELINE', label: '管线' },
          { value: 'OTHER', label: '其他' },
        ]},
        { name: 'description', label: '描述', type: 'textarea' },
      ],
      onSubmit: async (data) => {
        try {
          await API.business.create(data);
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

  async viewObject(id) {
    try {
      const obj = await API.business.get(id);
      Modal.show({
        title: '业务对象详情',
        content: `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div><strong>名称:</strong> ${obj.name}</div>
            <div><strong>编码:</strong> ${obj.code}</div>
            <div><strong>类型:</strong> ${obj.type}</div>
            <div><strong>状态:</strong> ${obj.status}</div>
            <div style="grid-column: span 2;"><strong>描述:</strong> ${obj.description || '-'}</div>
            <div><strong>创建时间:</strong> ${Helpers.formatDate(obj.createdAt)}</div>
            <div><strong>更新时间:</strong> ${Helpers.formatDate(obj.updatedAt)}</div>
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

window.BusinessPage = BusinessPage;
