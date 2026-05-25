const DataTable = {
  render(container, options) {
    const {
      columns = [],
      data = [],
      pagination = null,
      onPageChange = null,
      onRowClick = null,
      emptyText = '暂无数据',
    } = options;

    let html = '<div class="table-container"><table><thead><tr>';
    columns.forEach(col => {
      html += `<th>${col.label}</th>`;
    });
    html += '</tr></thead><tbody>';

    if (data.length === 0) {
      html += `<tr><td colspan="${columns.length}"><div class="empty-state"><div class="empty-state-icon">📭</div><p>${emptyText}</p></div></td></tr>`;
    } else {
      data.forEach((row, index) => {
        html += `<tr data-index="${index}">`;
        columns.forEach(col => {
          let value = row[col.key] ?? '';
          if (col.render) {
            value = col.render(value, row);
          }
          html += `<td>${value}</td>`;
        });
        html += '</tr>';
      });
    }

    html += '</tbody></table>';

    if (pagination) {
      const { page, limit, total } = pagination;
      const totalPages = Math.ceil(total / limit);

      html += '<div class="pagination">';
      html += `<button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">‹</button>`;

      const startPage = Math.max(1, page - 2);
      const endPage = Math.min(totalPages, page + 2);

      if (startPage > 1) {
        html += `<button data-page="1">1</button>`;
        if (startPage > 2) html += '<span>...</span>';
      }

      for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span>...</span>';
        html += `<button data-page="${totalPages}">${totalPages}</button>`;
      }

      html += `<button ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">›</button>`;
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    if (pagination && onPageChange) {
      container.querySelectorAll('.pagination button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          const page = parseInt(btn.dataset.page);
          if (!isNaN(page)) onPageChange(page);
        });
      });
    }

    if (onRowClick) {
      container.querySelectorAll('tbody tr').forEach(tr => {
        tr.addEventListener('click', () => {
          const index = parseInt(tr.dataset.index);
          onRowClick(data[index], index);
        });
      });
    }
  }
};

window.DataTable = DataTable;
