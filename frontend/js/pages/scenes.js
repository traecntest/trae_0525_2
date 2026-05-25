const ScenesPage = {
  currentPage: 1,
  pageSize: 10,

  statusOptions: [
    { value: 'DRAFT', label: '草稿' },
    { value: 'PUBLISHED', label: '已发布' },
    { value: 'ARCHIVED', label: '已归档' },
  ],

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">场景管理</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="createBtn">➕ 创建场景</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="filter-bar">
            <select class="form-select" id="statusFilter" style="width:160px;">
              <option value="">全部状态</option>
              ${this.statusOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
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
      const status = document.getElementById('statusFilter')?.value || '';
      const res = await API.scenes.list({
        page: this.currentPage,
        limit: this.pageSize,
        status,
      });

      const statusLabelMap = {};
      this.statusOptions.forEach(opt => statusLabelMap[opt.value] = opt.label);

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '场景名称' },
          { key: 'code', label: '编码' },
          { key: 'status', label: '状态', render: (v) => {
            const statusMap = {
              DRAFT: { class: 'badge-info', text: '草稿' },
              PUBLISHED: { class: 'badge-success', text: '已发布' },
              ARCHIVED: { class: 'badge', text: '已归档' },
            };
            const badge = statusMap[v] || { class: 'badge', text: v };
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
          <button class="btn btn-sm" data-action="open" data-id="${row.id}">打开</button>
          <button class="btn btn-sm" data-action="edit" data-id="${row.id}">编辑</button>
          <button class="btn btn-sm" data-action="delete" data-id="${row.id}">删除</button>
        `,
      });

      document.getElementById('tableContainer').querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          const id = e.target.dataset.id;
          if (action === 'open') window.location.hash = `#/viewer/${id}`;
          if (action === 'edit') this.editScene(id);
          if (action === 'delete') this.deleteScene(id);
        });
      });
    } catch (err) {
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败: ${err.message}</div>`;
    }
  },

  showCreateModal() {
    Modal.form({
      title: '创建场景',
      fields: [
        { name: 'name', label: '场景名称', required: true, validateType: 'fullName', helpText: '最多200个字符' },
        { name: 'code', label: '场景编码', required: true, helpText: '最多50个字符' },
        { name: 'description', label: '描述', type: 'textarea' },
        { name: 'status', label: '状态', type: 'select', options: this.statusOptions },
        { name: 'backgroundColor', label: '背景颜色', helpText: '默认 #87CEEB' },
      ],
      onSubmit: async (data) => {
        try {
          await API.scenes.create(data);
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

  async editScene(id) {
    try {
      const scene = await API.scenes.get(id);
      Modal.form({
        title: '编辑场景',
        fields: [
          { name: 'name', label: '场景名称', required: true, validateType: 'fullName' },
          { name: 'code', label: '场景编码', required: true },
          { name: 'description', label: '描述', type: 'textarea' },
          { name: 'status', label: '状态', type: 'select', options: this.statusOptions },
          { name: 'backgroundColor', label: '背景颜色', helpText: '默认 #87CEEB' },
        ],
        values: scene,
        onSubmit: async (data) => {
          try {
            await API.scenes.update(id, data);
            Helpers.showToast('更新成功', 'success');
            this.loadData();
            return true;
          } catch (err) {
            Helpers.showToast(err.message || '更新失败', 'error');
            return false;
          }
        },
      });
    } catch (err) {
      Helpers.showToast('加载失败', 'error');
    }
  },

  async deleteScene(id) {
    if (confirm('确定要删除此场景吗？')) {
      try {
        await API.scenes.delete(id);
        Helpers.showToast('删除成功', 'success');
        this.loadData();
      } catch (err) {
        Helpers.showToast(err.message || '删除失败', 'error');
      }
    }
  },
};

window.ScenesPage = ScenesPage;
