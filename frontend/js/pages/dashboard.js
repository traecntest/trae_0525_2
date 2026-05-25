const DashboardPage = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">数据总览</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="refreshBtn">🔄 刷新</button>
        </div>
      </div>
      <div class="stats-grid" id="statsGrid"></div>
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header"><h3 class="card-title">模型类型分布</h3></div>
          <div class="card-body" id="modelChart"></div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">设备状态统计</h3></div>
          <div class="card-body" id="deviceChart"></div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">最近事件</h3></div>
          <div class="card-body" id="eventList"></div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">最近任务</h3></div>
          <div class="card-body" id="taskList"></div>
        </div>
      </div>
    `;

    document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());
    this.loadData();
  },

  async loadData() {
    try {
      const [models, devices, events, tasks] = await Promise.all([
        API.models.list({ limit: 100 }),
        API.iot.listDevices({ limit: 100 }),
        API.events.list({ limit: 10 }),
        API.tasks.list({ limit: 10 }),
      ]);

      const modelCount = models.count || 0;
      const deviceCount = devices.count || 0;
      const eventCount = events.count || 0;
      const taskCount = tasks.count || 0;
      const onlineDevices = (devices.rows || []).filter(d => d.status === 'ONLINE').length;

      Stats.render(document.getElementById('statsGrid'), [
        { icon: '🏗️', label: '模型总数', value: modelCount },
        { icon: '📡', label: '设备总数', value: deviceCount },
        { icon: '🟢', label: '在线设备', value: onlineDevices },
        { icon: '⚠️', label: '活跃事件', value: eventCount },
        { icon: '📋', label: '任务总数', value: taskCount },
        { icon: '👥', label: '用户数', value: 0 },
      ]);

      const typeMap = {};
      (models.rows || []).forEach(m => {
        typeMap[m.type] = (typeMap[m.type] || 0) + 1;
      });
      Chart.donut(document.getElementById('modelChart'), {
        segments: Object.entries(typeMap).map(([k, v]) => ({
          label: ({ BIM: 'BIM', GIS: 'GIS', POINTCLOUD: '点云', OBLIQUE: '倾斜摄影', '3DMODEL': '3D模型' })[k] || k,
          value: v,
        })),
      });

      const statusMap = {};
      (devices.rows || []).forEach(d => {
        statusMap[d.status] = (statusMap[d.status] || 0) + 1;
      });
      Chart.donut(document.getElementById('deviceChart'), {
        segments: Object.entries(statusMap).map(([k, v]) => ({
          label: ({ ONLINE: '在线', OFFLINE: '离线', FAULT: '故障' })[k] || k,
          value: v,
        })),
      });

      const eventEl = document.getElementById('eventList');
      if (events.rows?.length) {
        eventEl.innerHTML = events.rows.map(e => `
          <div class="timeline-item">
            <div class="timeline-dot" style="background:${e.severity === 'CRITICAL' ? 'var(--danger)' : e.severity === 'MAJOR' ? 'var(--warning)' : 'var(--info)'}"></div>
            <div class="timeline-content">
              <div class="timeline-title">${e.title || e.type}</div>
              <div class="timeline-time">${Helpers.formatDate(e.createdAt)}</div>
            </div>
          </div>
        `).join('');
      } else {
        eventEl.innerHTML = '<div class="empty-state"><p>暂无事件</p></div>';
      }

      const taskEl = document.getElementById('taskList');
      if (tasks.rows?.length) {
        taskEl.innerHTML = tasks.rows.map(t => {
          const badge = Helpers.getStatusBadge(t.status);
          return `
            <div class="list-item">
              <div>
                <div style="color:var(--text-primary);">${t.name || t.type}</div>
                <div style="color:var(--text-muted); font-size:11px;">${Helpers.formatDate(t.createdAt)}</div>
              </div>
              <span class="badge ${badge.class}">${badge.text}</span>
            </div>
          `;
        }).join('');
      } else {
        taskEl.innerHTML = '<div class="empty-state"><p>暂无任务</p></div>';
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  },
};

window.DashboardPage = DashboardPage;
