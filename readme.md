## 交流与支持
欢迎加入 QQ 群：795231926，一起探讨和交流 XForge 开发经验。

# XForge：CocosCreator 前端开发框架

### 概览

**XForge** 是一个专为 CocosCreator 设计的前端开发框架。诞生于于2019年，经历过 CocosCreator 众多版本更新，也进行了多次精心重构。

### 设计理念
**XForge** 致力于提供一个轻量级核心，搭配可扩展的插件体系，旨在为开发者构建一个清晰、可持续发展的开发生态环境。它不仅仅是一个 UI 框架，而是一个完整的开发解决方案。

### 核心优势

- **稳定验证**：多年迭代，跨平台，众多游戏的实战检验。
- **新手友好**：经过多年优化，框架易于新手理解和使用。
- **开发规范**：自动化统一开发规范，降低code review人力成本。
- **团队协作**：优秀的多人协同开发能力，最大程度杜绝Prefab/Scene冲突。
- **渐进开发**：提供核心功能的同时，通过扩展包为开发者按需引入更多高级功能。
- **框架生态**：鼓励开发者自主开发扩展包，并通过共享机制促进生态繁荣(基于npm)。
- **私有生态**：**公司内部项目可基于扩展包快速构建专属生态(基于npm)** 。

### 快速入门

请参阅开发文档，了解如何快速开始使用 `XForge`：[快速开始](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017445&doc_id=6236543)

<br/>

## 核心功能
### 脚手架
- 创建空项目及示例项目
- 自动升级项目框架版本
- 添加/删除/更新扩展包

> 详细文档：[脚手架](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017448&doc_id=6236543)

### 分包自动化
- 无需过多关心，就可实现极小的首包体积
- 天然支持大厅子游戏模式，不需要任何额外配置

> 查看文档：[微信小游戏分包策略最佳实践](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017432&doc_id=6236543) 

### UI类型与安全
- 简化 UI 管理，支持 多Scene 和 多Prefab 配置。
- 格外强调UI安全，避免UI被外部因素无意修改或破坏。

> 详细文档：[界面](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017440&doc_id=6236543)  [管理器](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017436&doc_id=6236543) [控制器](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017438&doc_id=6236543)

### 扩展包
- [网络请求](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017505&doc_id=6236543)
- [种子随机](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017504&doc_id=6236543)
- [状态管理](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017509&doc_id=6236543)
- [ECS架构](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017498&doc_id=6236543)
- [A星巡路](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017470&doc_id=6236543)
- [SAT碰撞检测](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017508&doc_id=6236543)
- [SAP碰撞检测](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017507&doc_id=6236543)
- [四叉树碰撞检测](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017503&doc_id=6236543)
- [定点数](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017497&doc_id=6236543)
- [二维向量(定点数)](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017495&doc_id=6236543)
- [三维向量(定点数)](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017496&doc_id=6236543)
- [种子随机(定点数)](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017492&doc_id=6236543)
- [SAT碰撞检测(定点数)](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017494&doc_id=6236543)
- [SAP碰撞检测(定点数)](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017493&doc_id=6236543)
- [XML解析](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017510&doc_id=6236543)
- [富文本组件](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017476&doc_id=6236543)
- 持续更新中...

> 实践项目：[帧同步联机对战](https://store.cocos.com/app/zh/detail/5987)

## 示例项目
- UI管理(`2D与3D开发`)
- 飞机大战(`ECS+SAP`)
- 碰撞检测(`SAP+SAT`)
- 持续更新中...

示例项目在逐步开发中，通过脚手架可以创建示例项目，查看开发文档：[快速开始](https://gitee.com/cocos2d-zp/xforge/wikis/pages?sort_id=13017445&doc_id=6236543)
