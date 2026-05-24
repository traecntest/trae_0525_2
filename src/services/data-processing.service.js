const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const config = require('../../config/index');
const logger = require('../../config/logger');
const ModelService = require('./model.service');
const TaskService = require('./task.service');

class DataProcessingService {
  async processModelFile(taskData) {
    const { modelId, tenantId, filePath, format, versionId } = taskData;

    try {
      await ModelService.updateProcessingStatus(modelId, tenantId, 'PROCESSING', 10);

      const fileInfo = await this.analyzeFile(filePath, format);

      await ModelService.updateProcessingStatus(modelId, tenantId, 'PROCESSING', 30, null, {
        boundingBox: fileInfo.boundingBox,
        centroid: fileInfo.centroid,
      });

      const lodDir = await this.generateLODFiles(modelId, tenantId, filePath, format);

      await ModelService.updateProcessingStatus(modelId, tenantId, 'PROCESSING', 80);

      const lodLevels = this.extractLODLevels(lodDir);

      await ModelService.updateProcessingStatus(modelId, tenantId, 'READY', 100, null, {
        boundingBox: fileInfo.boundingBox,
        centroid: fileInfo.centroid,
        lodLevels,
      });

      if (versionId) {
        await this.updateVersionProcessing(versionId, tenantId, 'READY', lodDir, fileInfo);
      }

      logger.info(`Model processing completed: ${modelId}`);
      return { success: true, modelId };
    } catch (error) {
      logger.error(`Model processing failed: ${modelId}`, error);
      await ModelService.updateProcessingStatus(modelId, tenantId, 'ERROR', 0, error.message);
      throw error;
    }
  }

  async analyzeFile(filePath, format) {
    const fileInfo = {
      boundingBox: null,
      centroid: null,
      fileSize: fs.statSync(filePath).size,
    };

    switch (format.toLowerCase()) {
      case 'gltf':
      case 'glb':
        fileInfo.boundingBox = await this.analyzeGLTF(filePath);
        break;
      case 'ifc':
        fileInfo.boundingBox = await this.analyzeIFC(filePath);
        break;
      case 'obj':
      case 'fbx':
        fileInfo.boundingBox = await this.analyzeMesh(filePath);
        break;
      case 'shp':
      case 'geojson':
        fileInfo.boundingBox = await this.analyzeGIS(filePath, format);
        break;
      case 'las':
      case 'laz':
        fileInfo.boundingBox = await this.analyzePointCloud(filePath);
        break;
      default:
        fileInfo.boundingBox = this.getDefaultBoundingBox();
    }

    if (fileInfo.boundingBox) {
      fileInfo.centroid = {
        x: (fileInfo.boundingBox.minX + fileInfo.boundingBox.maxX) / 2,
        y: (fileInfo.boundingBox.minY + fileInfo.boundingBox.maxY) / 2,
        z: (fileInfo.boundingBox.minZ + fileInfo.boundingBox.maxZ) / 2,
      };
    }

    return fileInfo;
  }

  async analyzeGLTF(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      if (parsed.meshes) {
        parsed.meshes.forEach((mesh) => {
          mesh.primitives?.forEach((primitive) => {
            const accessor = parsed.accessors?.[primitive.attributes?.POSITION];
            if (accessor?.min && accessor?.max) {
              minX = Math.min(minX, accessor.min[0]);
              minY = Math.min(minY, accessor.min[1]);
              minZ = Math.min(minZ, accessor.min[2]);
              maxX = Math.max(maxX, accessor.max[0]);
              maxY = Math.max(maxY, accessor.max[1]);
              maxZ = Math.max(maxZ, accessor.max[2]);
            }
          });
        });
      }

      if (minX === Infinity) {
        return this.getDefaultBoundingBox();
      }

      return { minX, minY, minZ, maxX, maxY, maxZ };
    } catch (error) {
      logger.warn('Failed to analyze GLTF file:', error);
      return this.getDefaultBoundingBox();
    }
  }

  async analyzeIFC(filePath) {
    return this.getDefaultBoundingBox();
  }

  async analyzeMesh(filePath) {
    return this.getDefaultBoundingBox();
  }

  async analyzeGIS(filePath, format) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(content);

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      const processCoords = (coords) => {
        if (typeof coords[0] === 'number') {
          minX = Math.min(minX, coords[0]);
          minY = Math.min(minY, coords[1]);
          minZ = Math.min(minZ, coords[2] || 0);
          maxX = Math.max(maxX, coords[0]);
          maxY = Math.max(maxY, coords[1]);
          maxZ = Math.max(maxZ, coords[2] || 0);
        } else {
          coords.forEach(processCoords);
        }
      };

      if (geojson.type === 'FeatureCollection') {
        geojson.features?.forEach((feature) => {
          processCoords(feature.geometry?.coordinates || []);
        });
      } else if (geojson.coordinates) {
        processCoords(geojson.coordinates);
      }

      if (minX === Infinity) {
        return this.getDefaultBoundingBox();
      }

      return { minX, minY, minZ: 0, maxX, maxY, maxZ: 100 };
    } catch (error) {
      logger.warn('Failed to analyze GIS file:', error);
      return this.getDefaultBoundingBox();
    }
  }

  async analyzePointCloud(filePath) {
    return {
      minX: -1000,
      minY: -1000,
      minZ: -100,
      maxX: 1000,
      maxY: 1000,
      maxZ: 500,
    };
  }

  getDefaultBoundingBox() {
    return {
      minX: -100,
      minY: -100,
      minZ: -50,
      maxX: 100,
      maxY: 100,
      maxZ: 200,
    };
  }

  async generateLODFiles(modelId, tenantId, filePath, format) {
    const lodDir = path.join(
      process.cwd(),
      config.upload.dir,
      tenantId,
      'lod',
      modelId
    );

    if (!fs.existsSync(lodDir)) {
      fs.mkdirSync(lodDir, { recursive: true });
    }

    const levels = [1, 2, 3, 4];

    for (const level of levels) {
      const lodFilePath = path.join(lodDir, `lod${level}.${format}`);

      if (level === 1) {
        fs.copyFileSync(filePath, lodFilePath);
      } else {
        await this.createSimplifiedVersion(filePath, lodFilePath, level);
      }
    }

    return lodDir;
  }

  async createSimplifiedVersion(sourcePath, targetPath, level) {
    try {
      const content = fs.readFileSync(sourcePath, 'utf8');
      const parsed = JSON.parse(content);

      const reductionFactor = Math.pow(0.5, level - 1);

      if (parsed.meshes) {
        parsed.meshes.forEach((mesh) => {
          mesh.primitives?.forEach((primitive) => {
            if (primitive.indices !== undefined) {
              const accessor = parsed.accessors?.[primitive.indices];
              if (accessor?.bufferView !== undefined) {
                accessor.count = Math.floor(accessor.count * reductionFactor);
              }
            }
          });
        });
      }

      fs.writeFileSync(targetPath, JSON.stringify(parsed));
    } catch (error) {
      logger.warn(`Failed to create LOD level ${level}:`, error);
      fs.copyFileSync(sourcePath, targetPath);
    }
  }

  extractLODLevels(lodDir) {
    const levels = [];

    if (fs.existsSync(lodDir)) {
      const files = fs.readdirSync(lodDir);
      files.forEach((file) => {
        const match = file.match(/lod(\d+)\./);
        if (match) {
          levels.push(parseInt(match[1], 10));
        }
      });
    }

    return levels.sort();
  }

  async updateVersionProcessing(versionId, tenantId, status, lodDir, fileInfo) {
    const { ModelVersion } = require('../models');

    const version = await ModelVersion.findByPk(versionId);
    if (version) {
      await version.update({
        status,
        boundingBox: fileInfo.boundingBox,
        centroid: fileInfo.centroid,
        lodAssets: {
          lod1: path.join(lodDir, 'lod1.glb'),
          lod2: path.join(lodDir, 'lod2.glb'),
          lod3: path.join(lodDir, 'lod3.glb'),
          lod4: path.join(lodDir, 'lod4.glb'),
        },
      });
    }
  }

  async processDataImport(taskData) {
    const { importId, tenantId, targetType, config } = taskData;

    try {
      logger.info(`Starting data import: ${importId}`);

      switch (targetType) {
        case 'SPATIAL_DATA':
          return await this.importSpatialData(taskData);
        case 'IOT_DEVICE':
          return await this.importIotDevices(taskData);
        case 'MODEL':
          return await this.importModels(taskData);
        default:
          throw new Error(`Unsupported import type: ${targetType}`);
      }
    } catch (error) {
      logger.error(`Data import failed: ${importId}`, error);
      throw error;
    }
  }

  async importSpatialData(taskData) {
    const { filePath, mapping, tenantId } = taskData;
    const content = fs.readFileSync(filePath, 'utf8');
    const geojson = JSON.parse(content);

    const features = geojson.features || [geojson];

    const { SpatialData } = require('../models');
    const { generateId } = require('../utils/helpers');

    const records = features.map((feature) => ({
      id: generateId(),
      tenantId,
      name: feature.properties?.name || `Imported_${Date.now()}`,
      dataType: feature.geometry.type,
      geometry: feature.geometry,
      attributes: feature.properties,
      source: 'IMPORT',
    }));

    const result = await SpatialData.bulkCreate(records, {
      ignoreDuplicates: true,
    });

    logger.info(`Imported ${result.length} spatial features`);
    return { importedCount: result.length };
  }

  async importIotDevices(taskData) {
    return { importedCount: 0, message: 'IoT device import not implemented' };
  }

  async importModels(taskData) {
    return { importedCount: 0, message: 'Model import not implemented' };
  }

  async cleanupExpiredFiles() {
    const uploadDir = path.join(process.cwd(), config.upload.dir);

    if (!fs.existsSync(uploadDir)) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const processDirectory = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          processDirectory(fullPath);
        } else {
          const stat = fs.statSync(fullPath);
          if (stat.mtime < cutoffDate) {
            fs.unlinkSync(fullPath);
            logger.info(`Cleaned up expired file: ${fullPath}`);
          }
        }
      });
    };

    processDirectory(uploadDir);
  }
}

module.exports = new DataProcessingService();
