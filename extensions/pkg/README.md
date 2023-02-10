注意：
通用模块开发完毕后，在发布之前一定要打开CocosCreator生成meta文件(否则如果有依赖关系编辑器无法正确识别)。

如何添加和移除包：
添加: 在项目目录下，执行 npm run pkg:add xxx 
移除: 在项目目录下，执行 npm run pkg:remove xxx 
新拉取一个项目，添加所有已使用的包: 在项目目录下，执行 npm run pkg:add 