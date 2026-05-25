const State = {
  user: null,
  tenantId: 'default',
  sidebarOpen: true,

  init() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
    const tenantId = localStorage.getItem('tenant_id');
    if (tenantId) this.tenantId = tenantId;
  },

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  },

  setToken(token) {
    localStorage.setItem('access_token', token);
  },

  setTenantId(tenantId) {
    this.tenantId = tenantId;
    localStorage.setItem('tenant_id', tenantId);
  },

  clear() {
    this.user = null;
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isLoggedIn() {
    return !!this.user && !!localStorage.getItem('access_token');
  },
};

window.State = State;
