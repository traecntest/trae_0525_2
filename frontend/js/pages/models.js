const ModelsPage = {
  currentPage: 1,
  pageSize: 10,
  filters: {},

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">模型管理</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="uploadBtn">📤 上传模型</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="filter-bar">
            <input type="text" class="form-input" id="searchInput" placeholder="搜索模型名称..." style="width:200px;">
            <select class="form-select" id="typeFilter" style="width:140px;">
              <option value="">全部类型</option>
              <option value="BIM">BIM</option>
              <option value="GIS">GIS</option>
              <option value="POINTCLOUD">点云</option>
              <option value="OBLIQUE">倾斜摄影</option>
              <option value="3DMODEL">3D模型</option>
            </select>
            <button class="btn" id="searchBtn">🔍 搜索</button>
          </div>
        </div>
        <div class="card-body" id="tableContainer">
          <div class="table-container"><table><tbody><tr><td><div class="empty-state"><div class="empty-state-icon">⏳</div><p>加载中...</p></div></td></tr></tbody></table></div>
        </div>
      </div>
    `;

    document.getElementById('uploadBtn').addEventListener('click', () => this.showUploadModal());
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.filters.name = document.getElementById('searchInput').value;
      this.filters.type = document.getElementById('typeFilter').value;
      this.currentPage = 1;
      this.loadData();
    });
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('searchBtn').click();
    });

    this.loadData();
  },

  async loadData() {
    try {
      const res = await API.models.list({
        page: this.currentPage,
        limit: this.pageSize,
        ...this.filters,
      });

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '名称', render: (v, r) => `<span style="color:var(--accent-primary);">${v}</span>` },
          { key: 'type', label: '类型', render: (v) => {
            const badge = Helpers.getModelTypeBadge(v);
            return `<span class="badge ${badge.class}">${badge.text}</span>`;
          }},
          { key: 'format', label: '格式' },
          { key: 'fileSize', label: '大小', render: (v) => Helpers.formatFileSize(v) },
          { key: 'versionCount', label: '版本' },
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
          <button class="btn btn-sm" data-action="delete" data-id="${row.id}">删除</button>
        `,
      });

      document.getElementById('tableContainer').querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          const id = e.target.dataset.id;
          if (action === 'view') this.viewModel(id);
          if (action === 'delete') this.deleteModel(id);
        });
      });
    } catch (err) {
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败: ${err.message}</div>`;
    }
  },

  showUploadModal() {
    Modal.form({
      title: '上传模型',
      fields: [
        { name: 'name', label: '模型名称', required: true },
        { name: 'type', label: '类型', type: 'select', required: true, options: [
          { value: 'BIM', label: 'BIM' },
          { value: 'GIS', label: 'GIS' },
          { value: 'POINTCLOUD', label: '点云' },
          { value: 'OBLIQUE', label: '倾斜摄影' },
          { value: '3DMODEL', label: '3D模型' },
        ]},
        { name: 'description', label: '描述', type: 'textarea' },
      ],
      submitText: '下一步',
      onSubmit: (data) => {
        this.showFileUpload(data);
        return true;
      },
    });
  },

  showFileUpload(modelData) {
    const overlay = Modal.show({
      title: '选择文件',
      content: `
        <div class="form-group">
          <label class="form-label">模型文件</label>
          <input type="file" class="form-input" id="modelFile" accept=".ifc,.obj,.fbx,.glb,.gltf,.osgb,.las,.laz,.zip">
        </div>
        <div class="form-group">
          <label class="form-label">上传进度</label>
          <div class="progress-bar" id="uploadProgress">
            <div class="progress-bar-fill" id="progressFill" style="width:0%"></div>
          </div>
          <div id="progressText" style="text-align:center; margin-top:4px; font-size:12px; color:var(--text-muted);">0%</div>
        </div>
      `,
      confirmText: '开始上传',
      onConfirm: async (overlay) => {
        const fileInput = overlay.querySelector('#modelFile');
        if (!fileInput.files[0]) {
          Helpers.showToast('请选择文件', 'error');
          return false;
        }

        try {
          await API.models.upload(fileInput.files[0], modelData, (progress) => {
            overlay.querySelector('#progressFill').style.width = progress + '%';
            overlay.querySelector('#progressText').textContent = progress + '%';
          });
          Helpers.showToast('上传成功', 'success');
          this.loadData();
          return true;
        } catch (err) {
          Helpers.showToast('上传失败: ' + err.message, 'error');
          return false;
        }
      },
    });
  },

  viewModel(id) {
    window.location.hash = `#/viewer/${id}`;
  },

  async deleteModel(id) {
    if (confirm('确定要删除此模型吗？')) {
      try {
        await API.models.delete(id);
        Helpers.showToast('删除成功', 'success');
        this.loadData();
      } catch (err) {
        Helpers.showToast('删除失败: ' + err.message, 'error');
      }
    }
  },
};

window.ModelsPage = ModelsPage;
