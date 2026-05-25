const IoTPage = {
  currentPage: 1,
  pageSize: 10,
  filters: {},

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">IoT设备管理</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="addDeviceBtn">➕ 添加设备</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="filter-bar">
            <input type="text" class="form-input" id="searchInput" placeholder="搜索设备..." style="width:200px;">
            <select class="form-select" id="statusFilter" style="width:140px;">
              <option value="">全部状态</option>
              <option value="ONLINE">在线</option>
              <option value="OFFLINE">离线</option>
              <option value="FAULT">故障</option>
            </select>
            <select class="form-select" id="typeFilter" style="width:140px;">
              <option value="">全部类型</option>
              <option value="TEMPERATURE">温度传感器</option>
              <option value="HUMIDITY">湿度传感器</option>
              <option value="PRESSURE">压力传感器</option>
              <option value="CAMERA">摄像头</option>
              <option value="GATEWAY">网关</option>
            </select>
            <button class="btn" id="searchBtn">🔍 搜索</button>
          </div>
        </div>
        <div class="card-body" id="tableContainer"></div>
      </div>
    `;

    document.getElementById('addDeviceBtn').addEventListener('click', () => this.showAddModal());
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.filters.name = document.getElementById('searchInput').value;
      this.filters.status = document.getElementById('statusFilter').value;
      this.filters.type = document.getElementById('typeFilter').value;
      this.currentPage = 1;
      this.loadData();
    });

    this.loadData();
  },

  async loadData() {
    try {
      const res = await API.iot.listDevices({
        page: this.currentPage,
        limit: this.pageSize,
        ...this.filters,
      });

      DataTable.render(document.getElementById('tableContainer'), {
        columns: [
          { key: 'name', label: '设备名称' },
          { key: 'deviceCode', label: '设备编号' },
          { key: 'type', label: '类型' },
          { key: 'status', label: '状态', render: (v) => {
            const badge = Helpers.getStatusBadge(v);
            return `<span class="badge ${badge.class}">${badge.text}</span>`;
          }},
          { key: 'lastSeenAt', label: '最后在线', render: (v) => Helpers.formatDate(v) },
          { key: 'createdAt', label: '注册时间', render: (v) => Helpers.formatDateShort(v) },
        ],
        data: res.rows || [],
        pagination: { page: res.page, limit: res.limit, total: res.count },
        onPageChange: (page) => {
          this.currentPage = page;
          this.loadData();
        },
        actions: (row) => `
          <button class="btn btn-sm" data-action="data" data-id="${row.id}">数据</button>
          <button class="btn btn-sm" data-action="edit" data-id="${row.id}">编辑</button>
          <button class="btn btn-sm" data-action="delete" data-id="${row.id}">删除</button>
        `,
      });

      document.getElementById('tableContainer').querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          const id = e.target.dataset.id;
          const row = (res.rows || []).find(r => r.id === id);
          if (action === 'data') this.viewData(row);
          if (action === 'edit') this.showEditModal(row);
          if (action === 'delete') this.deleteDevice(id);
        });
      });
    } catch (err) {
      document.getElementById('tableContainer').innerHTML = `<div class="alert alert-error">加载失败</div>`;
    }
  },

  showAddModal() {
    Modal.form({
      title: '添加设备',
      fields: [
        { name: 'name', label: '设备名称', required: true },
        { name: 'deviceCode', label: '设备编号', required: true },
        { name: 'type', label: '设备类型', type: 'select', required: true, options: [
          { value: 'TEMPERATURE', label: '温度传感器' },
          { value: 'HUMIDITY', label: '湿度传感器' },
          { value: 'PRESSURE', label: '压力传感器' },
          { value: 'CAMERA', label: '摄像头' },
          { value: 'GATEWAY', label: '网关' },
          { value: 'OTHER', label: '其他' },
        ]},
        { name: 'description', label: '描述', type: 'textarea' },
      ],
      onSubmit: async (data) => {
        try {
          await API.iot.createDevice(data);
          Helpers.showToast('添加成功', 'success');
          this.loadData();
          return true;
        } catch (err) {
          Helpers.showToast(err.message || '添加失败', 'error');
          return false;
        }
      },
    });
  },

  showEditModal(device) {
    Modal.form({
      title: '编辑设备',
      fields: [
        { name: 'name', label: '设备名称', required: true },
        { name: 'deviceCode', label: '设备编号', required: true },
        { name: 'type', label: '设备类型', type: 'select', required: true, options: [
          { value: 'TEMPERATURE', label: '温度传感器' },
          { value: 'HUMIDITY', label: '湿度传感器' },
          { value: 'PRESSURE', label: '压力传感器' },
          { value: 'CAMERA', label: '摄像头' },
          { value: 'GATEWAY', label: '网关' },
          { value: 'OTHER', label: '其他' },
        ]},
        { name: 'status', label: '状态', type: 'select', options: [
          { value: 'ONLINE', label: '在线' },
          { value: 'OFFLINE', label: '离线' },
          { value: 'FAULT', label: '故障' },
        ]},
        { name: 'description', label: '描述', type: 'textarea' },
      ],
      values: device,
      onSubmit: async (data) => {
        try {
          await API.iot.updateDevice(device.id, data);
          Helpers.showToast('更新成功', 'success');
          this.loadData();
          return true;
        } catch (err) {
          Helpers.showToast(err.message || '更新失败', 'error');
          return false;
        }
      },
    });
  },

  async viewData(device) {
    try {
      const res = await API.iot.getSensorData(device.id, { limit: 20 });
      Modal.show({
        title: `${device.name} - 传感器数据`,
        content: `
          <div style="max-height:400px; overflow-y:auto;">
            ${(res.rows || []).length === 0 ? '<p>暂无数据</p>' : res.rows.map(d => `
              <div style="padding:8px 0; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between;">
                <span>${d.metric}</span>
                <span>${d.value} ${d.unit || ''}</span>
                <span style="color:var(--text-muted);">${Helpers.formatDate(d.timestamp)}</span>
              </div>
            `).join('')}
          </div>
        `,
        confirmText: '关闭',
        showCancel: false,
      });
    } catch (err) {
      Helpers.showToast('加载数据失败', 'error');
    }
  },

  async deleteDevice(id) {
    if (confirm('确定要删除此设备吗？')) {
      try {
        await API.iot.deleteDevice(id);
        Helpers.showToast('删除成功', 'success');
        this.loadData();
      } catch (err) {
        Helpers.showToast(err.message || '删除失败', 'error');
      }
    }
  },
};

window.IoTPage = IoTPage;
