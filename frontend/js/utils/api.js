const API = {
  baseUrl: '/api/v1',

  async request(url, options = {}) {
    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id') || 'default';

    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok && data.code >= 400) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        console.error('API Error:', error);
      }
      throw error;
    }
  },

  async upload(url, file, onProgress) {
    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id') || 'default';

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.open('POST', `${this.baseUrl}${url}`);
      xhr.setRequestHeader('X-Tenant-ID', tenantId);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.message || 'Upload failed'));
          }
        } catch (e) {
          reject(e);
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  },

  auth: {
    login: (data) => API.request('/auth/login', { method: 'POST', body: data }),
    register: (data) => API.request('/auth/register', { method: 'POST', body: data }),
    refresh: (data) => API.request('/auth/refresh', { method: 'POST', body: data }),
    logout: () => API.request('/auth/logout', { method: 'POST' }),
    me: () => API.request('/auth/me'),
    changePassword: (data) => API.request('/auth/change-password', { method: 'POST', body: data }),
  },

  models: {
    list: (params) => API.request(`/models?${new URLSearchParams(params)}`),
    get: (id) => API.request(`/models/${id}`),
    create: (data) => API.request('/models', { method: 'POST', body: data }),
    update: (id, data) => API.request(`/models/${id}`, { method: 'PUT', body: data }),
    delete: (id) => API.request(`/models/${id}`, { method: 'DELETE' }),
    upload: (file, onProgress) => API.upload('/models', file, onProgress),
    versions: (id) => API.request(`/models/${id}/versions`),
    uploadVersion: (id, file, onProgress) => API.upload(`/models/${id}/versions`, file, onProgress),
    lods: (id) => API.request(`/models/${id}/lods`),
    publish: (id) => API.request(`/models/${id}/publish`, { method: 'POST' }),
    unpublish: (id) => API.request(`/models/${id}/unpublish`, { method: 'POST' }),
    categories: () => API.request('/models/categories'),
    createCategory: (data) => API.request('/models/categories', { method: 'POST', body: data }),
  },

  iot: {
    listDevices: (params) => API.request(`/iot/devices?${new URLSearchParams(params)}`),
    devices: (params) => API.request(`/iot/devices?${new URLSearchParams(params)}`),
    getDevice: (id) => API.request(`/iot/devices/${id}`),
    createDevice: (data) => API.request('/iot/devices', { method: 'POST', body: data }),
    updateDevice: (id, data) => API.request(`/iot/devices/${id}`, { method: 'PUT', body: data }),
    deleteDevice: (id) => API.request(`/iot/devices/${id}`, { method: 'DELETE' }),
    updateDeviceStatus: (id, status) => API.request(`/iot/devices/${id}/status`, { method: 'PATCH', body: { status } }),
    sensorData: (deviceId, params) => API.request(`/iot/devices/${deviceId}/sensor-data?${new URLSearchParams(params)}`),
    getSensorData: (deviceId, params) => API.request(`/iot/devices/${deviceId}/sensor-data?${new URLSearchParams(params)}`),
    latestSensorData: (deviceId) => API.request(`/iot/devices/${deviceId}/sensor-data/latest`),
    addSensorData: (deviceId, data) => API.request(`/iot/devices/${deviceId}/sensor-data`, { method: 'POST', body: data }),
    batchSensorData: (deviceId, data) => API.request(`/iot/devices/${deviceId}/sensor-data/batch`, { method: 'POST', body: data }),
  },

  spatial: {
    list: (params) => API.request(`/spatial?${new URLSearchParams(params)}`),
    get: (id) => API.request(`/spatial/${id}`),
    create: (data) => API.request('/spatial', { method: 'POST', body: data }),
    batchCreate: (data) => API.request('/spatial/batch', { method: 'POST', body: data }),
    update: (id, data) => API.request(`/spatial/${id}`, { method: 'PUT', body: data }),
    delete: (id) => API.request(`/spatial/${id}`, { method: 'DELETE' }),
    query: (data) => API.request('/spatial/query', { method: 'POST', body: data }),
    layers: () => API.request('/spatial/layers/list'),
    createLayer: (data) => API.request('/spatial/layers', { method: 'POST', body: data }),
    updateLayer: (id, data) => API.request(`/spatial/layers/${id}`, { method: 'PUT', body: data }),
    deleteLayer: (id) => API.request(`/spatial/layers/${id}`, { method: 'DELETE' }),
  },

  events: {
    list: (params) => API.request(`/events?${new URLSearchParams(params)}`),
    get: (id) => API.request(`/events/${id}`),
    create: (data) => API.request('/events', { method: 'POST', body: data }),
    update: (id, data) => API.request(`/events/${id}`, { method: 'PUT', body: data }),
    acknowledge: (id) => API.request(`/events/${id}/acknowledge`, { method: 'POST' }),
    resolve: (id) => API.request(`/events/${id}/resolve`, { method: 'POST' }),
    assign: (id, assignedTo) => API.request(`/events/${id}/assign`, { method: 'POST', body: { assignedTo } }),
    delete: (id) => API.request(`/events/${id}`, { method: 'DELETE' }),
    stats: (params) => API.request(`/events/stats?${new URLSearchParams(params)}`),
  },

  business: {
    list: (params) => API.request(`/business?${new URLSearchParams(params)}`),
    get: (id) => API.request(`/business/${id}`),
    create: (data) => API.request('/business', { method: 'POST', body: data }),
    update: (id, data) => API.request(`/business/${id}`, { method: 'PUT', body: data }),
    delete: (id) => API.request(`/business/${id}`, { method: 'DELETE' }),
    stats: () => API.request('/business/stats'),
  },

  scenes: {
    list: (params) => API.request(`/scenes?${new URLSearchParams(params)}`),
    get: (id) => API.request(`/scenes/${id}`),
    create: (data) => API.request('/scenes', { method: 'POST', body: data }),
    update: (id, data) => API.request(`/scenes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => API.request(`/scenes/${id}`, { method: 'DELETE' }),
    publish: (id) => API.request(`/scenes/${id}/publish`, { method: 'POST' }),
    addModels: (id, modelIds) => API.request(`/scenes/${id}/models`, { method: 'POST', body: { modelIds } }),
    removeModels: (id, modelIds) => API.request(`/scenes/${id}/models`, { method: 'DELETE', body: { modelIds } }),
  },

  tasks: {
    list: (params) => API.request(`/tasks?${new URLSearchParams(params)}`),
    get: (id) => API.request(`/tasks/${id}`),
    create: (data) => API.request('/tasks', { method: 'POST', body: data }),
    cancel: (id) => API.request(`/tasks/${id}/cancel`, { method: 'POST' }),
    retry: (id) => API.request(`/tasks/${id}/retry`, { method: 'POST' }),
  },

  temporal: {
    states: (modelId, params) => API.request(`/temporal/${modelId}?${new URLSearchParams(params)}`),
    atTime: (modelId, timestamp) => API.request(`/temporal/${modelId}/at-time?timestamp=${timestamp}`),
    historical: (modelId, params) => API.request(`/temporal/${modelId}/historical?${new URLSearchParams(params)}`),
    create: (data) => API.request('/temporal', { method: 'POST', body: data }),
  },

  users: {
    list: (params) => API.request(`/users?${new URLSearchParams(params)}`),
    get: (id) => API.request(`/users/${id}`),
    create: (data) => API.request('/users', { method: 'POST', body: data }),
    update: (id, data) => API.request(`/users/${id}`, { method: 'PUT', body: data }),
    delete: (id) => API.request(`/users/${id}`, { method: 'DELETE' }),
  },

  health: () => API.request('/health'),
};
