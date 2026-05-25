const BusinessPage = {
  currentPage: 1,
  pageSize: 10,

  objectTypeOptions: [
    { value: 'PROJECT', label: '项目' },
    { value: 'BUILDING', label: '建筑' },
    { value: 'INFRASTRUCTURE', label: '基础设施' },
    { value: 'LAND', label: '土地' },
    { value: 'ASSET', label: '资产' },
    { value: 'FACILITY', label: '设施' },
    { value: 'OTHER', label: '其他' },
  ],

  statusOptions: [
    { value: 'PLANNING', label: '规划中' },
    { value: 'DESIGN', label: '设计中' },
    { value: 'CONSTRUCTION', label: '建设中' },
    { value: 'OPERATION', label: '运营中' },
    { value: 'MAINTENANCE', label: '维护中' },
    { value: 'DEMOLISHED', label: '已拆除' },
  ],

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
            <select class="form-select" id="objectTypeFilter" style="width:160px;">
              <option value="">全部类型</option>
              ${this.objectTypeOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
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
      const search = document.getElementById('searchInput')?.value || '';
      const objectType = document.getElementById('objectTypeFilter')?.value || '';
      const res = await API.business.list({
        page: this.currentPage,
        limit: this.pageSize,
        search,
        objectType,
      });

      const typeLabelMap = {};
      this.objectTypeOptions.forEach(opt => typeLabelMap[opt.value] = opt.label);
      const statusLabelMap = {};
      this.statusOptions.forEach(opt => statusLabelMap[opt.value] = opt.label);

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '名称' },
          { key: 'code', label: '编码' },
          { key: 'objectType', label: '类型', render: (v) => typeLabelMap[v] || v },
          { key: 'status', label: '状态', render: (v) => {
            const statusMap = {
              PLANNING: { class: 'badge-info', text: '规划中' },
              DESIGN: { class: 'badge-info', text: '设计中' },
              CONSTRUCTION: { class: 'badge-warning', text: '建设中' },
              OPERATION: { class: 'badge-success', text: '运营中' },
              MAINTENANCE: { class: 'badge-warning', text: '维护中' },
              DEMOLISHED: { class: 'badge', text: '已拆除' },
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
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败: ${err.message}</div>`;
    }
  },

  showCreateModal() {
    Modal.form({
      title: '创建业务对象',
      fields: [
        { name: 'name', label: '名称', required: true, helpText: '最多200个字符' },
        { name: 'code', label: '编码', helpText: '可选，最多50个字符' },
        { name: 'objectType', label: '类型', type: 'select', required: true, options: this.objectTypeOptions },
        { name: 'status', label: '状态', type: 'select', options: this.statusOptions },
        { name: 'address', label: '地址' },
        { name: 'longitude', label: '经度', type: 'number', defaultValue: 116.3972, helpText: '范围: -180 到 180' },
        { name: 'latitude', label: '纬度', type: 'number', defaultValue: 39.9075, helpText: '范围: -90 到 90' },
        { name: 'area', label: '占地面积(㎡)', type: 'number', helpText: '单位：平方米' },
        { name: 'floorArea', label: '建筑面积(㎡)', type: 'number', helpText: '单位：平方米' },
        { name: 'height', label: '高度(米)', type: 'number', helpText: '单位：米' },
        { name: 'description', label: '描述', type: 'textarea' },
      ],
      onSubmit: async (data) => {
        try {
          // 确保数字字段是正确的类型
          data.longitude = parseFloat(data.longitude) || 116.3972;
          data.latitude = parseFloat(data.latitude) || 39.9075;
          if (data.area !== undefined && data.area !== '') data.area = parseFloat(data.area) || null;
          if (data.floorArea !== undefined && data.floorArea !== '') data.floorArea = parseFloat(data.floorArea) || null;
          if (data.height !== undefined && data.height !== '') data.height = parseFloat(data.height) || null;
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
      const typeLabelMap = {};
      this.objectTypeOptions.forEach(opt => typeLabelMap[opt.value] = opt.label);
      const statusLabelMap = {};
      this.statusOptions.forEach(opt => statusLabelMap[opt.value] = opt.label);
      
      Modal.show({
        title: '业务对象详情',
        content: `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div><strong>名称:</strong> ${obj.name}</div>
            <div><strong>编码:</strong> ${obj.code || '-'}</div>
            <div><strong>类型:</strong> ${typeLabelMap[obj.objectType] || obj.objectType}</div>
            <div><strong>状态:</strong> ${statusLabelMap[obj.status] || obj.status}</div>
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
