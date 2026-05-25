const UsersPage = {
  currentPage: 1,
  pageSize: 10,

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">用户管理</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="createBtn">➕ 创建用户</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="filter-bar">
            <input type="text" class="form-input" id="searchInput" placeholder="搜索用户..." style="width:200px;">
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
      const username = document.getElementById('searchInput')?.value || '';
      const res = await API.users.list({
        page: this.currentPage,
        limit: this.pageSize,
        username,
      });

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'username', label: '用户名' },
          { key: 'fullName', label: '姓名' },
          { key: 'email', label: '邮箱' },
          { key: 'phone', label: '手机' },
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
          <button class="btn btn-sm" data-action="edit" data-id="${row.id}">编辑</button>
          <button class="btn btn-sm" data-action="delete" data-id="${row.id}">删除</button>
        `,
      });

      document.getElementById('tableContainer').querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          const id = e.target.dataset.id;
          if (action === 'edit') this.editUser(id);
          if (action === 'delete') this.deleteUser(id);
        });
      });
    } catch (err) {
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败</div>`;
    }
  },

  showCreateModal() {
    Modal.form({
      title: '创建用户',
      fields: [
        { name: 'username', label: '用户名', required: true },
        { name: 'fullName', label: '姓名', required: true },
        { name: 'email', label: '邮箱', type: 'email' },
        { name: 'phone', label: '手机' },
        { name: 'password', label: '密码', type: 'password', required: true, minLength: 6, placeholder: '至少 6 位' },
      ],
      onSubmit: async (data) => {
        try {
          await API.users.create(data);
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

  async editUser(id) {
    try {
      const user = await API.users.get(id);
      Modal.form({
        title: '编辑用户',
        fields: [
          { name: 'username', label: '用户名', required: true },
          { name: 'fullName', label: '姓名', required: true },
          { name: 'email', label: '邮箱', type: 'email' },
          { name: 'phone', label: '手机' },
        ],
        values: user,
        onSubmit: async (data) => {
          try {
            await API.users.update(id, data);
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

  async deleteUser(id) {
    if (confirm('确定要删除此用户吗？')) {
      try {
        await API.users.delete(id);
        Helpers.showToast('删除成功', 'success');
        this.loadData();
      } catch (err) {
        Helpers.showToast(err.message || '删除失败', 'error');
      }
    }
  },
};

window.UsersPage = UsersPage;
