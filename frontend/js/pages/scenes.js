const ScenesPage = {
  currentPage: 1,
  pageSize: 10,

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">场景管理</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="createBtn">➕ 创建场景</button>
        </div>
      </div>
      <div class="card">
        <div class="card-body" id="tableContainer"></div>
      </div>
    `;

    document.getElementById('createBtn').addEventListener('click', () => this.showCreateModal());
    this.loadData();
  },

  async loadData() {
    try {
      const res = await API.scenes.list({
        page: this.currentPage,
        limit: this.pageSize,
      });

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '场景名称' },
          { key: 'description', label: '描述' },
          { key: 'isPublic', label: '公开', render: (v) => v ? '是' : '否' },
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
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败</div>`;
    }
  },

  showCreateModal() {
    Modal.form({
      title: '创建场景',
      fields: [
        { name: 'name', label: '场景名称', required: true },
        { name: 'description', label: '描述', type: 'textarea' },
        { name: 'isPublic', label: '公开', type: 'select', options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ]},
      ],
      onSubmit: async (data) => {
        try {
          data.isPublic = data.isPublic === 'true';
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
          { name: 'name', label: '场景名称', required: true },
          { name: 'description', label: '描述', type: 'textarea' },
          { name: 'isPublic', label: '公开', type: 'select', options: [
            { value: 'true', label: '是' },
            { value: 'false', label: '否' },
          ]},
        ],
        values: { ...scene, isPublic: String(scene.isPublic) },
        onSubmit: async (data) => {
          try {
            data.isPublic = data.isPublic === 'true';
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
