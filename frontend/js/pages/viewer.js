const ViewerPage = {
  modelId: null,
  sceneId: null,

  render(container, params) {
    this.modelId = params?.modelId || null;
    this.sceneId = params?.sceneId || null;

    container.innerHTML = `
      <div class="viewer-container">
        <div class="viewer-toolbar">
          <div class="viewer-toolbar-left">
            <button class="btn btn-sm" id="resetView" title="重置视图">🎯</button>
            <button class="btn btn-sm" id="zoomIn" title="放大">➕</button>
            <button class="btn btn-sm" id="zoomOut" title="缩小">➖</button>
            <button class="btn btn-sm" id="fullscreen" title="全屏">⛶</button>
          </div>
          <div class="viewer-toolbar-center">
            <select class="form-select" id="lodSelect" style="width:120px;">
              <option value="0">LOD 0 - 概览</option>
              <option value="1">LOD 1 - 标准</option>
              <option value="2">LOD 2 - 详细</option>
              <option value="3">LOD 3 - 精细</option>
            </select>
          </div>
          <div class="viewer-toolbar-right">
            <button class="btn btn-sm" id="toggleGrid" title="网格">▦</button>
            <button class="btn btn-sm" id="toggleAxes" title="坐标轴">⌖</button>
            <button class="btn btn-sm" id="screenshot" title="截图">📷</button>
          </div>
        </div>
        <div class="viewer-canvas" id="viewerCanvas">
          <div class="viewer-placeholder">
            <div class="viewer-placeholder-icon">🏙️</div>
            <h3>3D 场景查看器</h3>
            <p>${this.modelId ? `正在加载模型: ${this.modelId}` : this.sceneId ? `正在加载场景: ${this.sceneId}` : '请选择模型或场景查看'}</p>
            <div class="viewer-placeholder-hint">
              <p>💡 提示：前往 <a href="#/models" style="color:var(--accent-primary);">模型管理</a> 或 <a href="#/scenes" style="color:var(--accent-primary);">场景管理</a> 选择要查看的内容</p>
            </div>
          </div>
        </div>
        <div class="viewer-sidebar" id="viewerSidebar">
          <div class="viewer-sidebar-header">
            <h4>模型信息</h4>
          </div>
          <div class="viewer-sidebar-content" id="modelInfo">
            <div style="color:var(--text-muted); text-align:center; padding:20px;">
              选择模型查看详情
            </div>
          </div>
        </div>
      </div>
    `;

    this.initViewer();
    if (this.modelId) this.loadModel(this.modelId);
    if (this.sceneId) this.loadScene(this.sceneId);
  },

  initViewer() {
    document.getElementById('resetView').addEventListener('click', () => {
      Helpers.showToast('视图已重置', 'info');
    });
    document.getElementById('zoomIn').addEventListener('click', () => {
      Helpers.showToast('放大', 'info');
    });
    document.getElementById('zoomOut').addEventListener('click', () => {
      Helpers.showToast('缩小', 'info');
    });
    document.getElementById('fullscreen').addEventListener('click', () => {
      const canvas = document.getElementById('viewerCanvas');
      if (canvas.requestFullscreen) canvas.requestFullscreen();
    });
    document.getElementById('screenshot').addEventListener('click', () => {
      Helpers.showToast('截图功能开发中', 'info');
    });
    document.getElementById('toggleGrid').addEventListener('click', () => {
      Helpers.showToast('网格切换', 'info');
    });
    document.getElementById('toggleAxes').addEventListener('click', () => {
      Helpers.showToast('坐标轴切换', 'info');
    });
    document.getElementById('lodSelect').addEventListener('change', (e) => {
      const lod = e.target.value;
      Helpers.showToast(`切换到 LOD ${lod}`, 'info');
    });
  },

  async loadModel(id) {
    try {
      const model = await API.models.get(id);
      const infoEl = document.getElementById('modelInfo');
      infoEl.innerHTML = `
        <div style="display:grid; gap:8px;">
          <div><strong>名称:</strong> ${model.name}</div>
          <div><strong>类型:</strong> ${model.type}</div>
          <div><strong>格式:</strong> ${model.format || '-'}</div>
          <div><strong>大小:</strong> ${Helpers.formatFileSize(model.fileSize)}</div>
          <div><strong>版本:</strong> v${model.currentVersion || 1}</div>
          <div><strong>状态:</strong> ${model.status}</div>
          <div><strong>创建时间:</strong> ${Helpers.formatDate(model.createdAt)}</div>
          <div><strong>描述:</strong> ${model.description || '-'}</div>
        </div>
      `;

      const canvas = document.getElementById('viewerCanvas');
      canvas.innerHTML = `
        <div class="viewer-placeholder">
          <div class="viewer-placeholder-icon">🏗️</div>
          <h3>${model.name}</h3>
          <p>3D 模型渲染区域</p>
          <div style="margin-top:20px; color:var(--text-muted); font-size:12px;">
            <p>📦 模型格式: ${model.format || '-'}</p>
            <p>📐 三角面数: ${model.triangleCount?.toLocaleString() || '-'}</p>
            <p>📊 顶点数: ${model.vertexCount?.toLocaleString() || '-'}</p>
          </div>
        </div>
      `;
    } catch (err) {
      Helpers.showToast('加载模型失败: ' + err.message, 'error');
    }
  },

  async loadScene(id) {
    try {
      const scene = await API.scenes.get(id);
      const canvas = document.getElementById('viewerCanvas');
      canvas.innerHTML = `
        <div class="viewer-placeholder">
          <div class="viewer-placeholder-icon">🏙️</div>
          <h3>${scene.name}</h3>
          <p>${scene.description || '3D 场景渲染区域'}</p>
        </div>
      `;
    } catch (err) {
      Helpers.showToast('加载场景失败: ' + err.message, 'error');
    }
  },
};

window.ViewerPage = ViewerPage;
