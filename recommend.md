# ```XForge```

### ```XForge``` 是一个基于 CocosCreator 的前端开发框架。

它诞生于 ```2019-01-08```，曾经历过CocosCreator的众多版本，经历过由JS到TS的转变，也经历了多次重构。每一次重构都很痛苦，但同样它的每一个功能也能都经过了数次的考量和验证。

### ```XForge``` 不仅仅是一个UI框架，通过专门打造的**扩展包**能力，能够渐进式的为开发者提供了一套完整的解决方案。

> 它是一个框架，也是一个生态。任何人都可以开发扩展包，并发布到生态中，让更多人受益。

### ```XForge```对比目前其它框架有一些优势：<br>
- 框架本身只包含核心的功能，高阶功能全部由**扩展包**提供，不至于让新手开发者一上来就为大量的目录和功能感到迷茫。
- **扩展包**的持续更新，真正意义上是一个无限成长的框架。
- 后续还会为高阶能力提供示例项目，让开发者可以快速学习。

开发文档：[快速开始](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9433202&doc_id=5075526)

# 为什么选择 ```XForge```
- 经过数年迭代、数种平台、数十款游戏、数千万日活的稳定性\功能性验证
- 经过多年与新手开发者的接触，不断打磨框架，让新手开发者可以快速上手
- 经过多年团队开发模式打磨，多人协同能力出众
- 不断扩充完善的扩展包生态，让开发者可以快速开发
- 高阶功能示例项目，让开发者可以快速成长
- 公司内部项目，基于扩展包可以快速生成私有生态

<br/>

# 核心功能
## 脚手架
- 自动创建项目
- 自动升级项目框架
- 自动添加/删除/更新扩展包

> 查看文档：[脚手架](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9432724&doc_id=5075526)

## 分包自动化
- 无需过多关心，就可实现极小的首包体积
- 天然支持大厅子游戏模式，不需要任何额外配置

> 查看文档：[微信小游戏分包策略最佳实践](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9794871&doc_id=5075526) 

## UI类型抽象
```XForge```精心设计了一个UI管理器，仅需一个```show调用```就能搞定
- 单Scene多Prefab
- 多Scene多Prefab

并且对Prefab和Scene的加载方式做了抽象，更易于使用。

> 查看文档：[界面](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9432731&doc_id=5075526) 与 [管理器](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9433095&doc_id=5075526) 

## 实用扩展包
- [网络请求](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949228&doc_id=5075526)
- [种子随机](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9990908&doc_id=5075526)
- [状态管理](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949205&doc_id=5075526)
- [ECS架构](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949310&doc_id=5075526)
- [A星巡路](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949229&doc_id=5075526)
- [SAT碰撞检测](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949235&doc_id=5075526)
- [SAP碰撞检测](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=10074354&doc_id=5075526)
- [四叉树碰撞检测](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949230&doc_id=5075526)
- [定点数](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949317&doc_id=5075526)
- [二维向量(定点数)](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949318&doc_id=5075526)
- [三维向量(定点数)](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949319&doc_id=5075526)
- [种子随机(定点数)](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949320&doc_id=5075526)
- [SAT碰撞检测(定点数)](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9949321&doc_id=5075526)
- [XML解析](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=10065695&doc_id=5075526)
- [富文本组件](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9991392&doc_id=5075526)
- 持续更新中...

> 实践项目：[帧同步联机对战](https://store.cocos.com/app/zh/detail/5987)

<br/>

# 示例项目
- 飞机大战(`ECS+SAP/四叉树`)
- 2D平台跳跃
- 3D摇杆割草

示例项目在逐步开发中，通过脚手架可以创建示例项目，查看开发文档：[快速开始](https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9433202&doc_id=5075526)

<br/>

# 交流群
QQ群：795231926
