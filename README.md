# Digital Twin City & CIM Platform

基于 Node.js 和 MySQL 技术栈构建的数字孪生城市与 CIM（城市信息模型）平台综合支撑系统。

## 项目概述

本系统实现城市物理空间、设施设备、运行状态的数字化映射与智能化管理，支持大规模城市三维模型的存储、解析与分发，结合物联网感知数据、业务数据和空间地理信息，形成统一的数字孪生底座。

## 核心功能

### 数据管理
- **多源异构数据接入**: BIM、GIS、倾斜摄影、点云等数据的标准化接入与转换
- **模型管理**: 3D模型的存储、版本控制、LOD分级加载
- **空间数据**: 地理空间数据的存储与空间查询
- **时空数据**: 历史回溯、实时监测和未来预测能力

### 业务场景
- 城市规划
- 建设管理
- 市政运维
- 应急指挥

### 技术能力
- 高并发服务端接口
- 数据处理中间件
- 任务调度模块
- 缓存与分布式存储
- 用户权限管理
- 数据安全隔离
- 多租户机制

## 技术栈

- **Runtime**: Node.js >= 18.0.0
- **Web Framework**: Express.js
- **Database**: MySQL 8.0+
- **ORM**: Sequelize
- **Cache**: Redis
- **Task Queue**: Bull
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Joi

## 项目结构

```
digital-twin-cim-platform/
├── config/                    # 配置文件
│   ├── index.js              # 主配置
│   ├── database.js           # 数据库配置
│   └── logger.js             # 日志配置
├── database/                  # 数据库相关
│   ├── schema.sql            # 数据库Schema
│   ├── connection.js         # 连接配置
│   └── init.js               # 初始化脚本
├── src/
│   ├── models/               # 数据模型
│   ├── middleware/           # 中间件
│   │   ├── auth.js          # 认证中间件
│   │   ├── permission.js    # 权限中间件
│   │   ├── tenant.js        # 多租户中间件
│   │   ├── error.js         # 错误处理
│   │   ├── validator.js     # 参数验证
│   │   └── upload.js        # 文件上传
│   ├── services/            # 业务服务
│   │   ├── auth.service.js
│   │   ├── model.service.js
│   │   ├── iot.service.js
│   │   ├── spatial.service.js
│   │   ├── event.service.js
│   │   └── ...
│   ├── controllers/         # 控制器
│   ├── routes/              # 路由
│   ├── cache/               # 缓存服务
│   ├── queue/               # 任务队列
│   ├── utils/               # 工具函数
│   └── app.js               # 应用入口
├── uploads/                  # 上传文件目录
├── logs/                     # 日志目录
├── package.json
├── .env.example
└── .gitignore
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接、Redis等参数。

### 3. 初始化数据库

```bash
# 创建数据库和表结构
npm run init-db
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 5. 默认登录

- 用户名: `admin`
- 密码: `admin123`

## API 接口

### 认证接口
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/refresh` - 刷新令牌
- `POST /api/v1/auth/logout` - 退出登录
- `GET /api/v1/auth/me` - 获取当前用户信息

### 模型管理
- `GET /api/v1/models` - 获取模型列表
- `GET /api/v1/models/:id` - 获取模型详情
- `POST /api/v1/models` - 创建模型
- `PUT /api/v1/models/:id` - 更新模型
- `DELETE /api/v1/models/:id` - 删除模型
- `POST /api/v1/models/:id/versions` - 上传模型版本
- `POST /api/v1/models/:id/publish` - 发布模型

### IoT 设备
- `GET /api/v1/iot/devices` - 获取设备列表
- `GET /api/v1/iot/devices/:id` - 获取设备详情
- `POST /api/v1/iot/devices` - 创建设备
- `PUT /api/v1/iot/devices/:id` - 更新设备
- `GET /api/v1/iot/devices/:id/sensor-data` - 获取传感器数据
- `POST /api/v1/iot/devices/:id/sensor-data` - 添加传感器数据

### 空间数据
- `GET /api/v1/spatial` - 获取空间数据列表
- `POST /api/v1/spatial` - 创建空间数据
- `POST /api/v1/spatial/batch` - 批量创建空间数据
- `GET /api/v1/spatial/layers/list` - 获取地图图层

### 事件管理
- `GET /api/v1/events` - 获取事件列表
- `POST /api/v1/events` - 创建事件
- `POST /api/v1/events/:id/acknowledge` - 确认事件
- `POST /api/v1/events/:id/resolve` - 解决事件

### 业务对象
- `GET /api/v1/business` - 获取业务对象列表
- `POST /api/v1/business` - 创建业务对象
- `GET /api/v1/business/stats` - 获取统计数据

### 场景管理
- `GET /api/v1/scenes` - 获取场景列表
- `POST /api/v1/scenes` - 创建场景
- `POST /api/v1/scenes/:id/publish` - 发布场景

### 任务管理
- `GET /api/v1/tasks` - 获取任务列表
- `POST /api/v1/tasks` - 创建任务
- `POST /api/v1/tasks/:id/cancel` - 取消任务
- `POST /api/v1/tasks/:id/retry` - 重试任务

### 时空数据
- `GET /api/v1/temporal/:modelId` - 获取时空状态
- `GET /api/v1/temporal/:modelId/at-time` - 获取指定时间状态
- `GET /api/v1/temporal/:modelId/historical` - 获取历史时间线

## 数据库表结构

### 核心表
- `tenants` - 租户/组织
- `users` - 用户
- `roles` - 角色
- `user_roles` - 用户角色关联
- `api_keys` - API密钥
- `models` - 3D模型
- `model_versions` - 模型版本
- `model_lods` - LOD资源
- `model_scenes` - 场景
- `spatial_data` - 空间数据
- `map_layers` - 地图图层
- `iot_devices` - IoT设备
- `sensor_data` - 传感器数据
- `temporal_models` - 时空模型
- `events` - 事件
- `business_objects` - 业务对象
- `tasks` - 后台任务
- `audit_logs` - 审计日志

## 权限系统

采用 RBAC 权限模型：

| 角色 | 权限 |
|------|------|
| admin | 所有权限 |
| manager | 模型读写、空间读写、IoT读写、事件读写 |
| editor | 模型读写、空间读写、IoT读取 |
| viewer | 只读权限 |

## 多租户支持

系统支持多租户隔离，通过 `X-Tenant-ID` 请求头指定租户。

## 开发

### 数据库迁移

```bash
# 创建迁移
npm run migrate

# 回滚迁移
npm run migrate:rollback
```

### 代码规范

```bash
# 运行代码检查
npm run lint
```

### 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration
```

## 许可证

MIT
