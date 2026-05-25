const SpatialPage = {
  currentPage: 1,
  pageSize: 10,

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">空间数据</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="importBtn">📥 导入数据</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="filter-bar">
            <input type="text" class="form-input" id="searchInput" placeholder="搜索..." style="width:200px;">
            <select class="form-select" id="typeFilter" style="width:140px;">
              <option value="">全部类型</option>
              <option value="POINT">点</option>
              <option value="LINE">线</option>
              <option value="POLYGON">面</option>
            </select>
            <button class="btn" id="searchBtn">🔍 搜索</button>
          </div>
        </div>
        <div class="card-body" id="tableContainer"></div>
      </div>
    `;

    document.getElementById('importBtn').addEventListener('click', () => this.showImportModal());
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
      const res = await API.spatial.list({
        page: this.currentPage,
        limit: this.pageSize,
        name,
        dataType: type,
      });

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '名称' },
          { key: 'dataType', label: '类型' },
          { key: 'source', label: '来源' },
          { key: 'srid', label: '坐标系' },
          { key: 'featureCount', label: '要素数' },
          { key: 'createdAt', label: '创建时间', render: (v) => Helpers.formatDateShort(v) },
        ],
        data: res.rows || [],
        pagination: { page: res.page, limit: res.limit, total: res.count },
        onPageChange: (page) => {
          this.currentPage = page;
          this.loadData();
        },
      });
    } catch (err) {
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败</div>`;
    }
  },

  showImportModal() {
    Modal.form({
      title: '导入空间数据',
      fields: [
        { name: 'name', label: '数据名称', required: true },
        { name: 'dataType', label: '数据类型', type: 'select', required: true, options: [
          { value: 'POINT', label: '点' },
          { value: 'LINE', label: '线' },
          { value: 'POLYGON', label: '面' },
        ]},
        { name: 'source', label: '数据来源' },
        { name: 'srid', label: '坐标系', placeholder: '默认: 4326' },
      ],
      onSubmit: async (data) => {
        try {
          await API.spatial.create(data);
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
};

window.SpatialPage = SpatialPage;
