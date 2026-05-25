const Chart = {
  bar(container, options) {
    const { labels = [], data = [], color = '#00d9ff', height = 200 } = options;
    const max = Math.max(...data, 1);
    const barWidth = Math.max(20, Math.min(50, (container.offsetWidth || 400) / data.length - 10));

    container.innerHTML = `
      <div style="display:flex; align-items:flex-end; height:${height}px; gap:8px; padding:10px;">
        ${data.map((val, i) => `
          <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div style="font-size:10px; color:var(--text-muted);">${val}</div>
            <div style="width:${barWidth}px; height:${(val / max) * (height - 50)}px; background:linear-gradient(180deg, ${color} 0%, ${color}88 100%); border-radius:4px 4px 0 0;"></div>
            <div style="font-size:10px; color:var(--text-secondary);">${labels[i]}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  donut(container, options) {
    const { segments = [], size = 150 } = options;
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    let offset = 0;

    const gradient = segments.map((seg, i) => {
      const percent = (seg.value / total) * 100;
      const color = seg.color || ['#00d9ff', '#0066ff', '#51cf66', '#ffd43b', '#ff6b6b', '#845ef7'][i % 6];
      const start = offset;
      offset += percent;
      return `${color} ${start}% ${offset}%`;
    }).join(', ');

    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:20px;">
        <div style="width:${size}px; height:${size}px; border-radius:50%; background: conic-gradient(${gradient}); display:flex; align-items:center; justify-content:center;">
          <div style="width:${size * 0.6}px; height:${size * 0.6}px; background:var(--bg-primary); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column;">
            <div style="font-size:24px; font-weight:700; color:var(--text-primary);">${total}</div>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${segments.map((seg, i) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:10px; height:10px; background:${seg.color || ['#00d9ff', '#0066ff', '#51cf66', '#ffd43b', '#ff6b6b', '#845ef7'][i % 6]}; border-radius:2px;"></div>
              <span style="font-size:12px; color:var(--text-secondary);">${seg.label}: ${seg.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  line(container, options) {
    const { labels = [], data = [], color = '#00d9ff', height = 200 } = options;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const w = container.offsetWidth || 400;
    const h = height - 40;
    const step = w / (data.length - 1 || 1);

    const points = data.map((val, i) => {
      const x = i * step;
      const y = h - ((val - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,${h} ${points} ${w},${h}`;

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${w} ${h + 30}">
        <defs>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="${areaPoints}" fill="url(#areaGrad)"/>
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>
        ${data.map((val, i) => `<circle cx="${i * step}" cy="${h - ((val - min) / range) * h}" r="3" fill="${color}"/>`).join('')}
        ${labels.map((lbl, i) => `<text x="${i * step}" y="${h + 20}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${lbl}</text>`).join('')}
      </svg>
    `;
  },
};

window.Chart = Chart;
