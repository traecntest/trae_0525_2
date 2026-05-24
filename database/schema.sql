-- ============================================================
-- Digital Twin City & CIM Platform Database Schema
-- Version: 1.0.0
-- Description: Core tables for urban digital twin system
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS `digital_twin_cim`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `digital_twin_cim`;

-- ============================================================
-- 1. Tenant Management (Multi-tenant Support)
-- ============================================================
DROP TABLE IF EXISTS `tenants`;
CREATE TABLE `tenants` (
  `id` VARCHAR(36) NOT NULL COMMENT 'Tenant UUID',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tenant name',
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tenant code',
  `description` TEXT COMMENT 'Tenant description',
  `status` TINYINT DEFAULT 1 COMMENT '1=active, 0=inactive',
  `settings` JSON COMMENT 'Tenant-specific settings',
  `expires_at` DATETIME COMMENT 'Subscription expiration',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenants_code` (`code`),
  INDEX `idx_tenants_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tenant/organization table';

-- ============================================================
-- 2. User & Permission Management (RBAC)
-- ============================================================
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL COMMENT 'FK: tenants.id',
  `name` VARCHAR(50) NOT NULL COMMENT 'Role name',
  `code` VARCHAR(50) NOT NULL COMMENT 'Role code',
  `description` TEXT,
  `permissions` JSON COMMENT 'Permission list',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_role` (`tenant_id`, `code`),
  INDEX `idx_roles_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System roles';

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL COMMENT 'FK: tenants.id',
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed',
  `full_name` VARCHAR(100),
  `avatar` VARCHAR(500),
  `phone` VARCHAR(20),
  `status` TINYINT DEFAULT 1 COMMENT '1=active, 0=disabled',
  `last_login_at` DATETIME,
  `last_login_ip` VARCHAR(45),
  `reset_token` VARCHAR(255),
  `reset_token_expires_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_username` (`tenant_id`, `username`),
  UNIQUE KEY `uk_tenant_email` (`tenant_id`, `email`),
  INDEX `idx_users_tenant` (`tenant_id`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System users';

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL COMMENT 'FK: users.id',
  `role_id` VARCHAR(36) NOT NULL COMMENT 'FK: roles.id',
  `tenant_id` VARCHAR(36) NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  INDEX `idx_user_roles_user` (`user_id`),
  INDEX `idx_user_roles_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User-role mapping';

DROP TABLE IF EXISTS `api_keys`;
CREATE TABLE `api_keys` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `api_key` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hashed API key',
  `scopes` JSON COMMENT 'Allowed scopes',
  `rate_limit` INT DEFAULT 1000 COMMENT 'Requests per hour',
  `last_used_at` DATETIME,
  `expires_at` DATETIME,
  `status` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_api_keys_tenant` (`tenant_id`),
  INDEX `idx_api_keys_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API keys for external access';

-- ============================================================
-- 3. Model Management (BIM, GIS, Point Cloud, Oblique Photography)
-- ============================================================
DROP TABLE IF EXISTS `model_categories`;
CREATE TABLE `model_categories` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `parent_id` VARCHAR(36) DEFAULT NULL COMMENT 'Self-referencing for hierarchy',
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `model_type` ENUM('BIM', 'GIS', 'POINTCLOUD', 'OBLIQUE', '3DMODEL', 'OTHER') NOT NULL DEFAULT '3DMODEL',
  `description` TEXT,
  `icon` VARCHAR(500),
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_category_tenant` (`tenant_id`),
  INDEX `idx_category_parent` (`parent_id`),
  INDEX `idx_category_type` (`model_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Model categories';

DROP TABLE IF EXISTS `models`;
CREATE TABLE `models` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NOT NULL COMMENT 'FK: model_categories.id',
  `name` VARCHAR(200) NOT NULL COMMENT 'Model name',
  `code` VARCHAR(50) NOT NULL COMMENT 'Model code',
  `model_type` ENUM('BIM', 'GIS', 'POINTCLOUD', 'OBLIQUE', '3DMODEL', 'OTHER') NOT NULL DEFAULT '3DMODEL',
  `description` TEXT,
  `file_path` VARCHAR(500) COMMENT 'Original file path',
  `file_name` VARCHAR(255),
  `file_size` BIGINT COMMENT 'File size in bytes',
  `file_format` VARCHAR(20) COMMENT 'glb, gltf, ifc, shp, las, etc.',
  `version` INT DEFAULT 1 COMMENT 'Current version',
  `total_versions` INT DEFAULT 1,
  `srid` INT DEFAULT 4326 COMMENT 'Spatial reference system',
  `bounding_box` JSON COMMENT '{minX, minY, minZ, maxX, maxY, maxZ}',
  `centroid` POINT COMMENT 'Center point geometry',
  `elevation` DECIMAL(12, 3) COMMENT 'Ground elevation',
  `rotation` JSON COMMENT '{x, y, z} rotation angles',
  `scale` DECIMAL(10, 4) DEFAULT 1.0 COMMENT 'Scale factor',
  `lod_levels` JSON COMMENT 'Available LOD levels [1,2,3,4]',
  `tags` JSON COMMENT 'Search tags',
  `metadata` JSON COMMENT 'Extended metadata',
  `status` ENUM('UPLOADING', 'PROCESSING', 'READY', 'ERROR', 'ARCHIVED') DEFAULT 'UPLOADING',
  `error_message` TEXT,
  `processing_progress` INT DEFAULT 0 COMMENT '0-100%',
  `is_published` TINYINT DEFAULT 0 COMMENT '1=published',
  `published_at` DATETIME,
  `created_by` VARCHAR(36) COMMENT 'FK: users.id',
  `updated_by` VARCHAR(36),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_models_tenant` (`tenant_id`),
  INDEX `idx_models_category` (`category_id`),
  INDEX `idx_models_type` (`model_type`),
  INDEX `idx_models_status` (`status`),
  INDEX `idx_models_published` (`is_published`),
  SPATIAL INDEX `idx_models_centroid` (`centroid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='3D Models master table';

DROP TABLE IF EXISTS `model_versions`;
CREATE TABLE `model_versions` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `model_id` VARCHAR(36) NOT NULL COMMENT 'FK: models.id',
  `version` INT NOT NULL COMMENT 'Version number',
  `changelog` TEXT COMMENT 'What changed',
  `file_path` VARCHAR(500),
  `file_size` BIGINT,
  `bounding_box` JSON,
  `centroid` POINT,
  `lod_assets` JSON COMMENT 'LOD file paths per level',
  `status` ENUM('PROCESSING', 'READY', 'ERROR') DEFAULT 'PROCESSING',
  `created_by` VARCHAR(36),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model_version` (`model_id`, `version`),
  INDEX `idx_version_model` (`model_id`),
  INDEX `idx_version_tenant` (`tenant_id`),
  SPATIAL INDEX `idx_version_centroid` (`centroid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Model version history';

DROP TABLE IF EXISTS `model_lods`;
CREATE TABLE `model_lods` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `model_id` VARCHAR(36) NOT NULL,
  `version_id` VARCHAR(36) NOT NULL,
  `lod_level` TINYINT NOT NULL COMMENT '1=LOD1, 2=LOD2, 3=LOD3, 4=LOD4',
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT,
  `triangle_count` INT COMMENT 'Number of triangles',
  `vertex_count` INT COMMENT 'Number of vertices',
  `screen_error` DECIMAL(10, 4) COMMENT 'Screen space error for LOD switching',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model_lod` (`model_id`, `version_id`, `lod_level`),
  INDEX `idx_lods_model` (`model_id`),
  INDEX `idx_lods_level` (`lod_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='LOD assets';

DROP TABLE IF EXISTS `model_scenes`;
CREATE TABLE `model_scenes` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `model_ids` JSON COMMENT 'Array of model IDs in scene',
  `initial_view` JSON COMMENT 'Camera initial position',
  `environment_map` VARCHAR(500) COMMENT 'HDR environment map',
  `background_color` VARCHAR(20) DEFAULT '#87CEEB',
  `ambient_intensity` DECIMAL(3, 2) DEFAULT 0.5,
  `sun_direction` JSON COMMENT '{x, y, z}',
  `tags` JSON,
  `metadata` JSON,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
  `created_by` VARCHAR(36),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_scenes_tenant` (`tenant_id`),
  INDEX `idx_scenes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Scene compositions';

-- ============================================================
-- 4. Spatial & Geographic Data
-- ============================================================
DROP TABLE IF EXISTS `spatial_data`;
CREATE TABLE `spatial_data` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50),
  `data_type` ENUM('POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON', 'GEOMETRYCOLLECTION') NOT NULL,
  `source` ENUM('GIS', 'BIM', 'IOT', 'MANUAL', 'IMPORT') DEFAULT 'MANUAL',
  `geometry` GEOMETRY NOT NULL COMMENT 'Spatial geometry',
  `srid` INT DEFAULT 4326,
  `attributes` JSON COMMENT 'Feature attributes',
  `layer` VARCHAR(100) COMMENT 'GIS layer name',
  `elevation` DECIMAL(12, 3),
  `height` DECIMAL(12, 3) COMMENT 'Extrusion height for 3D',
  `style` JSON COMMENT 'Rendering style {color, opacity, lineWidth, etc.}',
  `tags` JSON,
  `metadata` JSON,
  `created_by` VARCHAR(36),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_spatial_tenant` (`tenant_id`),
  INDEX `idx_spatial_type` (`data_type`),
  INDEX `idx_spatial_layer` (`layer`),
  SPATIAL INDEX `idx_spatial_geometry` (`geometry`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Spatial geographic features';

DROP TABLE IF EXISTS `terrain_data`;
CREATE TABLE `terrain_data` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `tile_format` ENUM('QUANTIZED_MESH', 'TERRAIN', 'HEIGHTMAP') DEFAULT 'QUANTIZED_MESH',
  `tile_dir` VARCHAR(500) COMMENT 'Directory of terrain tiles',
  `bounding_box` JSON,
  `resolution` DECIMAL(10, 2) COMMENT 'Meters per pixel',
  `min_height` DECIMAL(12, 3),
  `max_height` DECIMAL(12, 3),
  `srid` INT DEFAULT 4326,
  `status` ENUM('PROCESSING', 'READY', 'ERROR') DEFAULT 'PROCESSING',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_terrain_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Terrain/DEM data';

DROP TABLE IF EXISTS `map_layers`;
CREATE TABLE `map_layers` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `layer_type` ENUM('VECTOR', 'RASTER', '3D_TILES', 'GEOJSON', 'WMS', 'WMTS') NOT NULL,
  `url` VARCHAR(500) COMMENT 'Tile service URL',
  `format` VARCHAR(20) COMMENT 'png, jpg, pbf, json',
  `min_zoom` INT DEFAULT 0,
  `max_zoom` INT DEFAULT 22,
  `bounds` JSON COMMENT '[minLon, minLat, maxLon, maxLat]',
  `style` JSON,
  `visible` TINYINT DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `opacity` DECIMAL(3, 2) DEFAULT 1.0,
  `metadata` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_layers_tenant` (`tenant_id`),
  INDEX `idx_layers_type` (`layer_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Map layer configurations';

-- ============================================================
-- 5. IoT Device & Sensor Data
-- ============================================================
DROP TABLE IF EXISTS `iot_devices`;
CREATE TABLE `iot_devices` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `device_code` VARCHAR(100) NOT NULL COMMENT 'Unique device identifier',
  `name` VARCHAR(200) NOT NULL,
  `device_type` ENUM('CAMERA', 'SENSOR', 'ACTUATOR', 'GATEWAY', 'CONTROLLER', 'OTHER') NOT NULL,
  `manufacturer` VARCHAR(100),
  `model` VARCHAR(100),
  `protocol` ENUM('MQTT', 'HTTP', 'MODBUS', 'COAP', 'ZIGBEE', 'OTHER') DEFAULT 'MQTT',
  `status` ENUM('ONLINE', 'OFFLINE', 'FAULT', 'MAINTENANCE') DEFAULT 'OFFLINE',
  `location` GEOMETRY COMMENT 'Device location',
  `srid` INT DEFAULT 4326,
  `address` VARCHAR(255),
  `installation_date` DATE,
  `last_heartbeat` DATETIME,
  `firmware_version` VARCHAR(50),
  `config` JSON COMMENT 'Device configuration',
  `capabilities` JSON COMMENT 'Supported data points',
  `tags` JSON,
  `metadata` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_device_code` (`tenant_id`, `device_code`),
  INDEX `idx_devices_tenant` (`tenant_id`),
  INDEX `idx_devices_type` (`device_type`),
  INDEX `idx_devices_status` (`status`),
  SPATIAL INDEX `idx_devices_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IoT devices';

DROP TABLE IF EXISTS `sensor_data`;
CREATE TABLE `sensor_data` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` VARCHAR(36) NOT NULL,
  `device_id` VARCHAR(36) NOT NULL COMMENT 'FK: iot_devices.id',
  `metric_code` VARCHAR(50) NOT NULL COMMENT 'e.g., temperature, humidity, pm25',
  `metric_name` VARCHAR(100),
  `value` DECIMAL(18, 6) NOT NULL,
  `unit` VARCHAR(20),
  `quality` TINYINT DEFAULT 1 COMMENT '1=good, 0=bad',
  `timestamp` DATETIME NOT NULL COMMENT 'Measurement time',
  `received_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `metadata` JSON,
  INDEX `idx_sensor_tenant` (`tenant_id`),
  INDEX `idx_sensor_device` (`device_id`),
  INDEX `idx_sensor_metric` (`device_id`, `metric_code`),
  INDEX `idx_sensor_timestamp` (`timestamp`),
  INDEX `idx_sensor_device_time` (`device_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Time-series sensor readings';

-- ============================================================
-- 6. Spatiotemporal Data (History, Real-time, Prediction)
-- ============================================================
DROP TABLE IF EXISTS `temporal_models`;
CREATE TABLE `temporal_models` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `model_id` VARCHAR(36) NOT NULL COMMENT 'FK: models.id',
  `time_type` ENUM('HISTORICAL', 'REAL_TIME', 'PREDICTION', 'SIMULATION') NOT NULL,
  `time_start` DATETIME NOT NULL COMMENT 'Start of time range',
  `time_end` DATETIME COMMENT 'End of time range (null for point in time)',
  `interval_unit` ENUM('SECOND', 'MINUTE', 'HOUR', 'DAY', 'MONTH', 'YEAR'),
  `interval_value` INT,
  `data_source` VARCHAR(100) COMMENT 'Data source description',
  `snapshot_path` VARCHAR(500) COMMENT 'Path to model snapshot at this time',
  `attribute_changes` JSON COMMENT 'Changed attributes at this time',
  `status` ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_temporal_tenant` (`tenant_id`),
  INDEX `idx_temporal_model` (`model_id`),
  INDEX `idx_temporal_time_range` (`time_start`, `time_end`),
  INDEX `idx_temporal_type` (`time_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Temporal model states';

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `event_type` ENUM('ALERT', 'INCIDENT', 'MAINTENANCE', 'OPERATION', 'OTHER') NOT NULL,
  `severity` ENUM('INFO', 'WARNING', 'MINOR', 'MAJOR', 'CRITICAL') DEFAULT 'INFO',
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `location` GEOMETRY,
  `srid` INT DEFAULT 4326,
  `related_model_id` VARCHAR(36),
  `related_device_id` VARCHAR(36),
  `status` ENUM('NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'NEW',
  `event_time` DATETIME NOT NULL,
  `acknowledged_at` DATETIME,
  `resolved_at` DATETIME,
  `assigned_to` VARCHAR(36),
  `created_by` VARCHAR(36),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_events_tenant` (`tenant_id`),
  INDEX `idx_events_type` (`event_type`),
  INDEX `idx_events_severity` (`severity`),
  INDEX `idx_events_status` (`status`),
  INDEX `idx_events_time` (`event_time`),
  SPATIAL INDEX `idx_events_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Events and alerts';

-- ============================================================
-- 7. Business Data (Urban Planning, Construction, etc.)
-- ============================================================
DROP TABLE IF EXISTS `business_objects`;
CREATE TABLE `business_objects` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `object_type` ENUM('PROJECT', 'BUILDING', 'INFRASTRUCTURE', 'LAND', 'ASSET', 'FACILITY', 'OTHER') NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50),
  `description` TEXT,
  `location` GEOMETRY,
  `srid` INT DEFAULT 4326,
  `address` VARCHAR(255),
  `area` DECIMAL(14, 2) COMMENT 'Area in sq meters',
  `floor_area` DECIMAL(14, 2) COMMENT 'Total floor area',
  `height` DECIMAL(10, 2) COMMENT 'Building height',
  `floors_above` INT COMMENT 'Floors above ground',
  `floors_below` INT COMMENT 'Floors below ground',
  `year_built` INT,
  `construction_type` VARCHAR(100),
  `status` ENUM('PLANNING', 'DESIGN', 'CONSTRUCTION', 'OPERATION', 'MAINTENANCE', 'DEMOLISHED') DEFAULT 'PLANNING',
  `start_date` DATE,
  `end_date` DATE,
  `related_model_id` VARCHAR(36) COMMENT 'FK: models.id',
  `attributes` JSON COMMENT 'Custom attributes',
  `tags` JSON,
  `metadata` JSON,
  `created_by` VARCHAR(36),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_business_tenant` (`tenant_id`),
  INDEX `idx_business_type` (`object_type`),
  INDEX `idx_business_status` (`status`),
  SPATIAL INDEX `idx_business_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Business objects';

-- ============================================================
-- 8. Task & Processing Queue
-- ============================================================
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `task_type` ENUM('MODEL_PROCESS', 'MODEL_CONVERT', 'LOD_GENERATE', 'DATA_IMPORT', 'DATA_EXPORT', 'TILE_GENERATE', 'REPORT', 'CLEANUP') NOT NULL,
  `priority` TINYINT DEFAULT 5 COMMENT '1-10, 1=highest',
  `status` ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'QUEUED',
  `progress` INT DEFAULT 0 COMMENT '0-100%',
  `message` TEXT,
  `input_data` JSON COMMENT 'Task input parameters',
  `output_data` JSON COMMENT 'Task output/results',
  `error_details` JSON,
  `retry_count` INT DEFAULT 0,
  `max_retries` INT DEFAULT 3,
  `started_at` DATETIME,
  `completed_at` DATETIME,
  `created_by` VARCHAR(36),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tasks_tenant` (`tenant_id`),
  INDEX `idx_tasks_type` (`task_type`),
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Background processing tasks';

-- ============================================================
-- 9. Audit & Logging
-- ============================================================
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36),
  `action` VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, etc.',
  `resource_type` VARCHAR(50) COMMENT 'MODEL, USER, DEVICE, etc.',
  `resource_id` VARCHAR(36),
  `old_value` JSON,
  `new_value` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` VARCHAR(500),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_tenant` (`tenant_id`),
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_resource` (`resource_type`, `resource_id`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail';

-- ============================================================
-- 10. Data Import/Export
-- ============================================================
DROP TABLE IF EXISTS `data_imports`;
CREATE TABLE `data_imports` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_id` VARCHAR(36) NOT NULL,
  `source_type` ENUM('FILE', 'API', 'DATABASE', 'STREAM') NOT NULL,
  `source_format` VARCHAR(50) COMMENT 'IFC, SHP, GeoJSON, CSV, LAS, etc.',
  `file_path` VARCHAR(500),
  `file_name` VARCHAR(255),
  `target_type` VARCHAR(50) COMMENT 'Target model/table type',
  `config` JSON COMMENT 'Import configuration',
  `mapping` JSON COMMENT 'Field mapping rules',
  `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
  `total_records` INT DEFAULT 0,
  `processed_records` INT DEFAULT 0,
  `failed_records` INT DEFAULT 0,
  `error_log` TEXT,
  `created_by` VARCHAR(36),
  `started_at` DATETIME,
  `completed_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_imports_tenant` (`tenant_id`),
  INDEX `idx_imports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Data import records';

-- ============================================================
-- Insert default data
-- ============================================================

-- Default tenant
INSERT INTO `tenants` (`id`, `name`, `code`, `description`, `status`) VALUES
('default', 'Default Organization', 'default', 'Default system tenant', 1);

-- Default roles
INSERT INTO `roles` (`id`, `tenant_id`, `name`, `code`, `description`, `permissions`) VALUES
('role_admin', 'default', 'System Administrator', 'admin', 'Full system access', 
 JSON_ARRAY('*')),
('role_manager', 'default', 'Manager', 'manager', 'Department manager', 
 JSON_ARRAY('model:read', 'model:write', 'model:delete', 'spatial:read', 'spatial:write', 'iot:read', 'iot:write', 'event:read', 'event:write')),
('role_editor', 'default', 'Editor', 'editor', 'Content editor', 
 JSON_ARRAY('model:read', 'model:write', 'spatial:read', 'spatial:write', 'iot:read')),
('role_viewer', 'default', 'Viewer', 'viewer', 'Read-only access', 
 JSON_ARRAY('model:read', 'spatial:read', 'iot:read', 'scene:read'));

-- Default admin user (password: admin123)
INSERT INTO `users` (`id`, `tenant_id`, `username`, `email`, `password`, `full_name`, `status`) VALUES
('user_admin', 'default', 'admin', 'admin@system.com', 
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
 'System Administrator', 1);

-- Assign admin role
INSERT INTO `user_roles` (`user_id`, `role_id`, `tenant_id`) VALUES
('user_admin', 'role_admin', 'default');

-- Default model categories
INSERT INTO `model_categories` (`id`, `tenant_id`, `parent_id`, `name`, `code`, `model_type`) VALUES
('cat_building', 'default', NULL, 'Buildings', 'building', 'BIM'),
('cat_infra', 'default', NULL, 'Infrastructure', 'infrastructure', '3DMODEL'),
('cat_terrain', 'default', NULL, 'Terrain & Landscape', 'terrain', 'GIS'),
('cat_pipe', 'default', NULL, 'Underground Pipelines', 'pipeline', '3DMODEL'),
('cat_vegetation', 'default', NULL, 'Vegetation', 'vegetation', '3DMODEL');
