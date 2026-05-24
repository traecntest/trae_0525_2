const Tenant = require('./tenant');
const User = require('./user');
const Role = require('./role');
const UserRole = require('./user-role');
const ApiKey = require('./api-key');
const ModelCategory = require('./model-category');
const Model3D = require('./model');
const ModelVersion = require('./model-version');
const ModelLod = require('./model-lod');
const ModelScene = require('./model-scene');
const SpatialData = require('./spatial-data');
const MapLayer = require('./map-layer');
const IotDevice = require('./iot-device');
const SensorData = require('./sensor-data');
const TemporalModel = require('./temporal-model');
const Event = require('./event');
const BusinessObject = require('./business-object');
const Task = require('./task');
const AuditLog = require('./audit-log');

function setupAssociations() {
  Tenant.hasMany(User, { foreignKey: 'tenantId', as: 'users' });
  User.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  Tenant.hasMany(Role, { foreignKey: 'tenantId', as: 'roles' });
  Role.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles',
  });
  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'users',
  });

  Tenant.hasMany(ApiKey, { foreignKey: 'tenantId', as: 'apiKeys' });
  ApiKey.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  User.hasMany(ApiKey, { foreignKey: 'userId', as: 'apiKeys' });
  ApiKey.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Tenant.hasMany(ModelCategory, { foreignKey: 'tenantId', as: 'modelCategories' });
  ModelCategory.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  ModelCategory.hasMany(ModelCategory, {
    foreignKey: 'parentId',
    as: 'children',
  });
  ModelCategory.belongsTo(ModelCategory, {
    foreignKey: 'parentId',
    as: 'parent',
  });

  Tenant.hasMany(Model3D, { foreignKey: 'tenantId', as: 'models' });
  Model3D.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  ModelCategory.hasMany(Model3D, { foreignKey: 'categoryId', as: 'models' });
  Model3D.belongsTo(ModelCategory, { foreignKey: 'categoryId', as: 'category' });

  Model3D.hasMany(ModelVersion, { foreignKey: 'modelId', as: 'versions' });
  ModelVersion.belongsTo(Model3D, { foreignKey: 'modelId', as: 'model' });

  Model3D.hasMany(ModelLod, { foreignKey: 'modelId', as: 'lods' });
  ModelLod.belongsTo(Model3D, { foreignKey: 'modelId', as: 'model' });
  ModelVersion.hasMany(ModelLod, { foreignKey: 'versionId', as: 'lods' });
  ModelLod.belongsTo(ModelVersion, { foreignKey: 'versionId', as: 'version' });

  Tenant.hasMany(ModelScene, { foreignKey: 'tenantId', as: 'scenes' });
  ModelScene.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  Tenant.hasMany(SpatialData, { foreignKey: 'tenantId', as: 'spatialData' });
  SpatialData.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  Tenant.hasMany(MapLayer, { foreignKey: 'tenantId', as: 'mapLayers' });
  MapLayer.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  Tenant.hasMany(IotDevice, { foreignKey: 'tenantId', as: 'iotDevices' });
  IotDevice.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  IotDevice.hasMany(SensorData, { foreignKey: 'deviceId', as: 'sensorData' });
  SensorData.belongsTo(IotDevice, { foreignKey: 'deviceId', as: 'device' });

  Model3D.hasMany(TemporalModel, { foreignKey: 'modelId', as: 'temporalStates' });
  TemporalModel.belongsTo(Model3D, { foreignKey: 'modelId', as: 'model' });

  Tenant.hasMany(Event, { foreignKey: 'tenantId', as: 'events' });
  Event.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  Tenant.hasMany(BusinessObject, { foreignKey: 'tenantId', as: 'businessObjects' });
  BusinessObject.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  Tenant.hasMany(Task, { foreignKey: 'tenantId', as: 'tasks' });
  Task.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

  Tenant.hasMany(AuditLog, { foreignKey: 'tenantId', as: 'auditLogs' });
  AuditLog.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
}

module.exports = {
  Tenant,
  User,
  Role,
  UserRole,
  ApiKey,
  ModelCategory,
  Model3D,
  ModelVersion,
  ModelLod,
  ModelScene,
  SpatialData,
  MapLayer,
  IotDevice,
  SensorData,
  TemporalModel,
  Event,
  BusinessObject,
  Task,
  AuditLog,
  setupAssociations,
};
