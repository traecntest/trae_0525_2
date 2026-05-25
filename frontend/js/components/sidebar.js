const Sidebar = {
  render(container) {
    const user = State.user || {};
    const initial = (user.fullName || user.username || 'U').charAt(0).toUpperCase();
    const currentPath = window.location.hash.replace('#', '') || '/dashboard';

    const navItems = [
      { section: '概览', items: [{ icon: '📊', label: '仪表盘', path: '/dashboard' }] },
      { section: '数据管理', items: [
        { icon: '🏗️', label: '模型管理', path: '/models' },
        { icon: '📡', label: 'IoT设备', path: '/iot' },
        { icon: '🗺️', label: '空间数据', path: '/spatial' },
      ]},
      { section: '业务应用', items: [
        { icon: '⚠️', label: '事件管理', path: '/events' },
        { icon: '🏢', label: '业务对象', path: '/business' },
        { icon: '🎬', label: '场景管理', path: '/scenes' },
        { icon: '🎮', label: '3D查看器', path: '/viewer' },
      ]},
      { section: '系统', items: [
        { icon: '📋', label: '任务中心', path: '/tasks' },
        { icon: '👥', label: '用户管理', path: '/users' },
      ]},
    ];

    let navHtml = '';
    navItems.forEach(section => {
      navHtml += `<div class="nav-section">${section.section}</div>`;
      section.items.forEach(item => {
        const isActive = currentPath.startsWith(item.path);
        navHtml += `
          <div class="nav-item ${isActive ? 'active' : ''}" data-path="${item.path}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </div>
        `;
      });
    });

    container.innerHTML = `
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">DT</div>
          <div>
            <div class="sidebar-title">数字孪生</div>
            <div class="sidebar-subtitle">CIM Platform</div>
          </div>
        </div>
        <div class="sidebar-nav">${navHtml}</div>
        <div class="sidebar-footer">
          <div class="sidebar-avatar">${initial}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-username">${user.fullName || user.username || '未登录'}</div>
            <div class="sidebar-role">${user.roles?.map(r => r.name).join(', ') || '-'}</div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const path = item.dataset.path;
        window.location.hash = path;
      });
    });
  }
};

window.Sidebar = Sidebar;
