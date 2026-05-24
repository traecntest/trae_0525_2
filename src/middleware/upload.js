const multer = require('multer');
const path = require('path');
const config = require('../../config/index');
const { BadRequestError } = require('./error');
const logger = require('../../config/logger');

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uploadDir = path.join(
      process.cwd(),
      config.upload.dir,
      req.tenantId || 'default'
    );
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowedTypes = config.upload.allowedTypes;
  if (allowedTypes.length === 0) {
    return cb(null, true);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type ${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`));
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize,
  },
  fileFilter,
});

const modelUpload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize,
  },
  fileFilter: (_req, file, cb) => {
    const modelExtensions = [
      '.gltf', '.glb', '.obj', '.fbx', '.dae', '.ifc',
      '.shp', '.geojson', '.json', '.las', '.laz', '.ply',
      '.zip'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (modelExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`File type ${ext} not allowed for model upload`));
    }
  },
});

const imageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (imageExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`File type ${ext} not allowed. Only images are accepted.`));
    }
  },
});

function handleUploadError(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new BadRequestError(`File too large. Max size: ${config.upload.maxSize / 1024 / 1024}MB`)
      );
    }
    return next(new BadRequestError(`Upload error: ${err.message}`));
  }
  next(err);
}

module.exports = {
  upload,
  modelUpload,
  imageUpload,
  handleUploadError,
};
