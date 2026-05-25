const Topbar = {
  render(container, pageTitle) {
    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-left">
          <div class="breadcrumb">
            <span>数字孪生平台</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${pageTitle || ''}</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-icon" id="notifBtn" title="通知">
            🔔
            <span class="badge-count" id="notifCount" style="display:none">3</span>
          </div>
          <div class="topbar-icon" id="settingsBtn" title="设置">⚙️</div>
          <div class="topbar-icon" id="logoutBtn" title="退出">⏻</div>
        </div>
      </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => {
      if (confirm('确定要退出登录吗？')) {
        State.clear();
        window.location.hash = '#/login';
      }
    });
  }
};

window.Topbar = Topbar;
