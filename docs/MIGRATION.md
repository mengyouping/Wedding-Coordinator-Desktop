# 前端迁移与验证记录

日期：2026-10-08。

## 迁移基线

本次从已有项目 `main` 的固定提交 `a576263ac05dd039bd7fd1c451606b73796907e6` 提取 `frontend/` 的 235 个文件。提取后逐文件用 Git blob SHA 核对，全部与源一致，再进行下面列明的迁移调整。

本仓库使用新建的独立提交历史，仅迁入前端源码及必要的 `contracts/openapi.yaml`。旧 Java 后端、数据库服务、部署配置、私有提交历史和实际用户数据不在迁移范围内。

## 本次调整

1. 保留原 `frontend/` 目录、React 页面、样式、API 类型和调用代码、Tauri 壳及测试。
2. 原 `routes:check` 依赖旧仓库的 Java 后端和跨栈脚本；改为执行现有前端 `fullBackendContract.test.ts` 与 `apiContract.test.ts`。这只验证前端声明和 API schema，不代表旧后端已经验证。
3. 保留 lint、stylelint、unit test、TypeScript/Vite build 门禁。`test` 限定在 `src`，避免 Vitest 把独立 Playwright E2E 用例误作单元测试；E2E 脚本仍保留。
4. 修正原 `apiContract.test.ts` 向上少一层的 schema 路径，并迁入所需 OpenAPI schema。
5. 更换桌面应用标识为 `com.mengyouping.wedding-coordinator-desktop`；桌面产品名为「婚礼总指挥」。新标识与旧应用数据目录分离。
6. 修正部署清单为仅前端、开发端口为 18766；移除 nginx 对未随迁后端的反向代理；更新可选 updater 示例地址。更新服务仍未启用，签名公钥只是待配置提示。
7. 重新制作合成演示项目：通用人名、虚构地址、空电话；宾客儿童与陪同人数为零，饮食、交通、住宿和无障碍资料为空；预算、报价、合同、付款、日期和备注改为独立示例值。对应测试期望同步更新。
8. 补充 npm `package-lock.json`、运行说明、忽略规则和个人非商业许可。未复制 `node_modules`、本地 `.env`、运行数据、缓存或生成产物。

## 实际检查结果

环境：Node.js 24.19.0、npm 11.9.0。安装使用固定直接依赖并生成 npm 锁文件；安装完成，共 269 个包。以下为本次真实运行结果，失败项没有禁用或绕过。

| 命令 | 结果 |
| --- | --- |
| `npm run routes:check` | 通过：2 个文件、5 个测试 |
| `npm run stylelint` | 通过 |
| `npm run lint` | 失败：4 个原有错误 |
| `npm run test` | 43 个测试文件，42 通过、1 失败；113 个测试，108 通过、5 失败 |
| `npm run build` | 失败：109 条 TypeScript 诊断，Vite 构建阶段未进入 |
| `npm run quality` | 失败：契约测试通过后停止于 lint |
| 桌面检查、桌面打包 | 未完成：环境未安装 Cargo/Rust 工具链；前端门禁也未通过 |
| Playwright E2E、视觉、真实桌面操作 | 未执行，不能视为通过 |

对固定提交的未修改源前端复跑 `npm run build`，同样产生 109 条 TypeScript 诊断。迁移没有引入这些编译缺口，也没有通过放宽 TypeScript、删测试或跳过质量命令来制造成功状态。

## 已知基线问题

- `src/state/WeddingDataProvider.tsx` 引用了不存在的 `src/services/persistence/conflictStore.ts`。
- 同文件从 `repositoryFactory`、`domain`、`permissionMatrix`、`projectGovernance`、`currentUser`、`cryptoExport`、`outboxStore`、`projectCatalog` 等模块导入了当前源码未导出的接口，相关页面的状态接口也有不一致。
- 其余类型诊断包括严格可选属性、可能为空的用户对象以及加密二进制缓冲区类型等。
- 4 个 lint 错误：`BudgetParametersTab.tsx`、`EditableOperationsTable.tsx` 的冗余 Boolean；`httpClient.ts` 的未使用类型；`WeddingDataProvider.tsx` 的未使用导入。
- 5 个失败单测均在 `databaseValidator.test.ts`：旧测试基线未升级预算工作簿 v5，先被 v5 校验挡住，尚未到达各自要测试的校验分支。

本次范围是迁移已有源码供后续优化，未扩展为业务修复或桌面重构。

## 后续边界

现有本地数据实现是 JSON 文件及浏览器存储，SQLite 尚未实现。Tauri 壳与 Windows 打包配置已保留，但并不意味着桌面包已经构建或验证。电子请帖在 JSON 模式下使用当前浏览器的本地数据；跨设备共享和公开回执需要额外服务，不能视为已经具备本地跨设备同步。
