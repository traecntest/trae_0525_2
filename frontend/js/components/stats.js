const Stats = {
  render(container, stats) {
    container.innerHTML = stats.map(stat => {
      const trendHtml = stat.trend !== undefined ? `
        <div class="stat-trend ${stat.trend >= 0 ? 'up' : 'down'}">
          ${stat.trend >= 0 ? '↑' : '↓'} ${Math.abs(stat.trend)}%
        </div>
      ` : '';

      return `
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">${stat.icon || ''}</span>
            <span class="stat-label">${stat.label}</span>
          </div>
          <div class="stat-value">${stat.value ?? '-'}</div>
          ${trendHtml}
        </div>
      `;
    }).join('');
  }
};

window.Stats = Stats;
