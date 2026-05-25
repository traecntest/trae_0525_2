const TasksPage = {
  currentPage: 1,
  pageSize: 10,

  taskTypeOptions: [
    { value: 'MODEL_PROCESS', label: '模型处理' },
    { value: 'MODEL_CONVERT', label: '模型转换' },
    { value: 'LOD_GENERATE', label: 'LOD生成' },
    { value: 'DATA_IMPORT', label: '数据导入' },
    { value: 'DATA_EXPORT', label: '数据导出' },
    { value: 'TILE_GENERATE', label: '瓦片生成' },
    { value: 'REPORT', label: '报告生成' },
    { value: 'CLEANUP', label: '清理任务' },
  ],

  statusOptions: [
    { value: 'QUEUED', label: '排队中' },
    { value: 'PROCESSING', label: '处理中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'FAILED', label: '失败' },
    { value: 'CANCELLED', label: '已取消' },
  ],

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
            <select class="form-select" id="taskTypeFilter" style="width:160px;">
              <option value="">全部类型</option>
              ${this.taskTypeOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
            </select>
            <select class="form-select" id="statusFilter" style="width:140px;">
              <option value="">全部状态</option>
              ${this.statusOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
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
      const taskType = document.getElementById('taskTypeFilter')?.value || '';
      const status = document.getElementById('statusFilter')?.value || '';
      const res = await API.tasks.list({
        page: this.currentPage,
        limit: this.pageSize,
        taskType,
        status,
      });

      const typeLabelMap = {};
      this.taskTypeOptions.forEach(opt => typeLabelMap[opt.value] = opt.label);
      const statusLabelMap = {};
      this.statusOptions.forEach(opt => statusLabelMap[opt.value] = opt.label);

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '任务名称' },
          { key: 'taskType', label: '类型', render: (v) => typeLabelMap[v] || v },
          { key: 'status', label: '状态', render: (v) => {
            const statusMap = {
              QUEUED: { class: 'badge-info', text: '排队中' },
              PROCESSING: { class: 'badge-warning', text: '处理中' },
              COMPLETED: { class: 'badge-success', text: '已完成' },
              FAILED: { class: 'badge-danger', text: '失败' },
              CANCELLED: { class: 'badge', text: '已取消' },
            };
            const badge = statusMap[v] || { class: 'badge', text: v };
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
          { key: 'priority', label: '优先级', render: (v) => v || 5 },
          { key: 'createdAt', label: '创建时间', render: (v) => Helpers.formatDateShort(v) },
        ],
        data: res.rows || [],
        pagination: { page: res.page, limit: res.limit, total: res.count },
        onPageChange: (page) => {
          this.currentPage = page;
          this.loadData();
        },
        actions: (row) => `
          ${row.status === 'QUEUED' || row.status === 'PROCESSING' ? 
            `<button class="btn btn-sm" data-action="cancel" data-id="${row.id}">取消</button>` : ''}
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
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败: ${err.message}</div>`;
    }
  },
};

window.TasksPage = TasksPage;
