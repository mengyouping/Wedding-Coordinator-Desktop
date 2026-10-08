# 婚礼总指挥前端

本目录保留 React 管理端、电子请帖 H5、Tauri 2 桌面工程、Vitest 单元测试和 Playwright 端到端测试。

这是已迁移的源码基线，当前存在原代码的模块缺失与类型错误，尚未验证为可运行应用。安装、命令、许可与限制见[仓库说明](../README.md)，具体结果见[迁移验证记录](../docs/MIGRATION.md)。

默认配置是 `VITE_DATA_MODE=json`、`VITE_AUTH_MODE=disabled`。本地持久化使用 JSON/localStorage/IndexedDB，SQLite 尚未接入。API 模式代码为后续扩展保留，使用时需要另行提供兼容后端。

`npm run quality` 依次执行 API 契约、lint、stylelint、单元测试与构建。`routes:check` 已改用前端独立契约测试，旧依赖 Java 后端的跨栈检查不属于此仓库。
