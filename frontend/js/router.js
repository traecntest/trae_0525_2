const Router = {
  routes: {},
  currentPath: '',

  register(path, handler) {
    this.routes[path] = handler;
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  getCurrentPath() {
    const hash = window.location.hash.replace('#', '') || '/dashboard';
    return hash.split('?')[0];
  },

  getParams() {
    const hash = window.location.hash.replace('#', '');
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return {};

    const queryString = hash.substring(queryIndex + 1);
    const params = {};
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    return params;
  },

  handleRoute() {
    const path = this.getCurrentPath();

    if (!State.isLoggedIn() && path !== '/login') {
      window.location.hash = '#/login';
      return;
    }

    if (State.isLoggedIn() && path === '/login') {
      window.location.hash = '#/dashboard';
      return;
    }

    this.currentPath = path;
    const mainContainer = document.getElementById('mainContent');
    const sidebarContainer = document.getElementById('sidebarContainer');
    const topbarContainer = document.getElementById('topbarContainer');

    if (path === '/login') {
      sidebarContainer.innerHTML = '';
      topbarContainer.innerHTML = '';
      if (this.routes['/login']) {
        this.routes['/login'](mainContainer);
      }
      return;
    }

    const pageTitles = {
      '/dashboard': '数据总览',
      '/models': '模型管理',
      '/iot': 'IoT设备',
      '/spatial': '空间数据',
      '/events': '事件管理',
      '/business': '业务对象',
      '/scenes': '场景管理',
      '/viewer': '3D查看器',
      '/tasks': '任务中心',
      '/users': '用户管理',
    };

    let title = pageTitles[path] || '';

    if (path.startsWith('/viewer')) {
      title = '3D查看器';
    }

    Sidebar.render(sidebarContainer);
    Topbar.render(topbarContainer, title);

    const params = this.getParams();
    const basePath = path.startsWith('/viewer') ? '/viewer' : path;

    if (this.routes[basePath]) {
      this.routes[basePath](mainContainer, { ...params, path });
    } else {
      mainContainer.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <p>页面未找到: ${path}</p>
              <a href="#/dashboard" class="btn btn-primary">返回首页</a>
            </div>
          </div>
        </div>
      `;
    }
  },
};

window.Router = Router;
