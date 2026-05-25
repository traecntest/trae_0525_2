const TasksPage = {
  currentPage: 1,
  pageSize: 10,

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">任务中心</h2>
        <div class="page-actions">
          <button class="btn" id="refreshBtn">🔄 刷新</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="filter-bar">
            <select class="form-select" id="typeFilter" style="width:160px;">
              <option value="">全部类型</option>
              <option value="MODEL_PROCESS">模型处理</option>
              <option value="MODEL_CONVERT">模型转换</option>
              <option value="DATA_IMPORT">数据导入</option>
              <option value="LOD_GENERATE">LOD生成</option>
            </select>
            <select class="form-select" id="statusFilter" style="width:140px;">
              <option value="">全部状态</option>
              <option value="QUEUED">排队中</option>
              <option value="PROCESSING">处理中</option>
              <option value="COMPLETED">已完成</option>
              <option value="FAILED">失败</option>
            </select>
            <button class="btn" id="searchBtn">🔍 搜索</button>
          </div>
        </div>
        <div class="card-body" id="tableContainer"></div>
      </div>
    `;

    document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.currentPage = 1;
      this.loadData();
    });

    this.loadData();
  },

  async loadData() {
    try {
      const type = document.getElementById('typeFilter')?.value || '';
      const status = document.getElementById('statusFilter')?.value || '';
      const res = await API.tasks.list({
        page: this.currentPage,
        limit: this.pageSize,
        type,
        status,
      });

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '任务名称' },
          { key: 'type', label: '类型' },
          { key: 'status', label: '状态', render: (v) => {
            const badge = Helpers.getStatusBadge(v);
            return `<span class="badge ${badge.class}">${badge.text}</span>`;
          }},
          { key: 'progress', label: '进度', render: (v) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="flex:1; height:6px; background:var(--bg-hover); border-radius:3px;">
                <div style="height:100%; background:var(--accent-primary); border-radius:3px; width:${v || 0}%"></div>
              </div>
              <span style="font-size:11px; color:var(--text-muted);">${v || 0}%</span>
            </div>
          `},
          { key: 'createdAt', label: '创建时间', render: (v) => Helpers.formatDateShort(v) },
        ],
        data: res.rows || [],
        pagination: { page: res.page, limit: res.limit, total: res.count },
        onPageChange: (page) => {
          this.currentPage = page;
          this.loadData();
        },
        actions: (row) => `
          <button class="btn btn-sm" data-action="cancel" data-id="${row.id}">取消</button>
        `,
      });

      document.getElementById('tableContainer').querySelectorAll('[data-action="cancel"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (confirm('确定要取消此任务吗？')) {
            try {
              await API.tasks.cancel(id);
              Helpers.showToast('任务已取消', 'success');
              this.loadData();
            } catch (err) {
              Helpers.showToast(err.message || '操作失败', 'error');
            }
          }
        });
      });
    } catch (err) {
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败</div>`;
    }
  },
};

window.TasksPage = TasksPage;
