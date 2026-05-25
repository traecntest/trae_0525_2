const LoginPage = {
  render(container) {
    container.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">DT</div>
            <h1 class="login-title">数字孪生城市平台</h1>
            <p class="login-subtitle">Digital Twin & CIM Platform</p>
          </div>
          <form class="login-form" id="loginForm">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input type="text" class="form-input" name="username" placeholder="请输入用户名" value="admin" required>
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <input type="password" class="form-input" name="password" placeholder="请输入密码" value="admin123" required>
            </div>
            <div class="form-group">
              <label class="form-label">租户ID</label>
              <input type="text" class="form-input" name="tenantId" placeholder="请输入租户ID" value="default">
            </div>
            <div class="form-options">
              <label class="form-checkbox">
                <input type="checkbox" name="remember" checked>
                <span>记住登录状态</span>
              </label>
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="loginBtn">
              登录
            </button>
          </form>
          <div class="login-footer">
            <p>默认账号: admin / admin123</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const username = formData.get('username');
      const password = formData.get('password');
      const tenantId = formData.get('tenantId') || 'default';

      const btn = document.getElementById('loginBtn');
      btn.textContent = '登录中...';
      btn.disabled = true;

      try {
        const res = await API.auth.login({ username, password });
        State.setToken(res.accessToken);
        State.setUser(res.user);
        State.setTenantId(tenantId);
        if (res.refreshToken) {
          localStorage.setItem('refresh_token', res.refreshToken);
        }
        Helpers.showToast('登录成功', 'success');
        window.location.hash = '#/dashboard';
      } catch (err) {
        Helpers.showToast(err.message || '登录失败', 'error');
      } finally {
        btn.textContent = '登录';
        btn.disabled = false;
      }
    });
  }
};

window.LoginPage = LoginPage;
