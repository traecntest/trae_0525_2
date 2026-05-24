const { v4: uuidv4 } = require('uuid');

function generateId() {
  return uuidv4();
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString();
}

function paginate(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return {
    ...query,
    offset,
    limit,
  };
}

function buildPaginationResponse(rows, count, page, limit) {
  return {
    data: rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

function parseBoundingBox(boundingBox) {
  if (!boundingBox) return null;
  if (typeof boundingBox === 'string') {
    return JSON.parse(boundingBox);
  }
  return boundingBox;
}

function calculateCentroid(boundingBox) {
  if (!boundingBox) return null;
  return {
    x: (boundingBox.minX + boundingBox.maxX) / 2,
    y: (boundingBox.minY + boundingBox.maxY) / 2,
    z: (boundingBox.minZ + boundingBox.maxZ) / 2,
  };
}

function safeParseJSON(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

function pickFields(obj, fields) {
  const result = {};
  fields.forEach((field) => {
    if (obj[field] !== undefined) {
      result[field] = obj[field];
    }
  });
  return result;
}

function omitFields(obj, fields) {
  const result = { ...obj };
  fields.forEach((field) => {
    delete result[field];
  });
  return result;
}

function getFileExtension(filename) {
  return filename?.split('.').pop().toLowerCase() || '';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function buildWhereClause(filters, searchFields = []) {
  const where = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      where[key] = value;
    }
  });

  return where;
}

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    Object.entries(input).forEach(([key, value]) => {
      sanitized[key] = sanitizeInput(value);
    });
    return sanitized;
  }
  return input;
}

module.exports = {
  generateId,
  formatDate,
  paginate,
  buildPaginationResponse,
  parseBoundingBox,
  calculateCentroid,
  safeParseJSON,
  pickFields,
  omitFields,
  getFileExtension,
  formatFileSize,
  buildWhereClause,
  sanitizeInput,
};
