# 婚礼总指挥 · 本地版

这是「婚礼总指挥」的独立源码仓库，作为后续本地数据库与桌面版本优化的起点。本次迁入已有前端、Tauri 桌面壳、样式、测试与必要 API 类型契约。

**当前是源码迁移基线，尚未通过完整构建。** 原前端存在缺失模块和接口不一致，详情见[迁移与验证记录](docs/MIGRATION.md)。本仓库暂不提供已验证可运行的桌面安装包。

## 当前范围

- React 19、TypeScript、Vite 8 前端，保留预算、宾客、排桌、供应商、流程、请帖、财务、附件与婚礼全案等页面。
- 保留 Tauri 2 桌面工程及 Windows NSIS/MSI 打包配置。
- 默认本地 JSON 模式、关闭云端登录。已有浏览器 localStorage/IndexedDB 与 Tauri 应用数据目录 JSON 文件持久化代码。
- SQLite 尚未实现，桌面运行与安装包尚未完成验证。
- API 模式类型和调用代码保留供后续开发；旧 Java 后端不包含在本仓库。
- 内置项目为重新制作的合成演示数据，不含真实宾客联系方式、住宿或健康需求。金额和交易均为演示值。

## 开发命令

迁移验证使用 Node.js 24。安装 npm 依赖后，可执行以下命令检查和继续开发；当前已知构建问题需先修复，不能把开发服务器启动等同于页面功能正常。

```bash
cd frontend
npm ci
npm run dev
```

开发服务器：`http://localhost:18766/`。

```bash
npm run routes:check
npm run lint
npm run stylelint
npm run test
npm run build
npm run quality
```

`quality` 保留契约、lint、stylelint、单元测试与 TypeScript/Vite 构建检查，失败即退出。完整端到端检查使用 `npm run e2e`。

本地模式已是默认值；需要显式配置时，将 `frontend/.env.example` 复制为 `.env.local`：

```env
VITE_DATA_MODE=json
VITE_AUTH_MODE=disabled
```

桌面开发需要先按 [Tauri 2 官方先决条件](https://v2.tauri.app/start/prerequisites/)准备 Rust 和系统依赖，再执行：

```bash
npm run desktop
npm run desktop:check
npm run desktop:build
```

现有 `desktop:build` 会先运行 `quality`，因此当前基线问题修复前不会得到成功的桌面构建。新应用标识使用 `com.mengyouping.wedding-coordinator-desktop`，与旧应用数据目录分离；不会自动读取旧桌面应用的用户数据。

## 目录

- `frontend/`：完整前端、静态素材、测试与 Tauri 工程
- `contracts/openapi.yaml`：前端契约测试需要的 API schema
- `docs/MIGRATION.md`：迁移边界、验证结果和已知问题
- `LICENSE`：个人非商业使用许可

## 使用许可

本项目采用源码可见的个人非商业使用许可：允许个人非商业使用和修改；商业使用须先联系维护者 mengyouping，取得另行明确授权。再分发、转授权及企业或组织内部使用未在本许可中授权。完整条款见 [LICENSE](LICENSE)，第三方组件遵循各自许可证。本项目不属于 OSI 定义的开源软件。授权申请请在[本仓库 Issues](https://github.com/mengyouping/Wedding-Coordinator-Desktop/issues)提出。
