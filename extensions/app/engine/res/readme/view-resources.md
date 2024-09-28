UI资源目录
1、脚本资源一定不要放在此文件夹内🔥
2、资源会随着UI销毁自动释放
3、在UI脚本内可通过this.loadRes动态加载
4、在UI子节点的脚本内可通过app.manager.ui.loadRes(this, ...)动态加载
5、不可单独删除此文件夹