> 框架设计之初主要考虑H5环境(捎带着小游戏环境)，最终的目的是希望：<br/>
> 1、更好的多人协同开发体验。<br/>
> 2、尽可能统一的开发规范(尽量避免口头约束)。<br/>
> 3、更小的首屏/首包体积。<br/>
> 4、更小的增量更新体积。<br/>

## 1、UI
* 通过菜单栏，App/创建/View来创建UI，会自动创建于assets/app-bundle/app-view下。
* UI分为4类：Page、Paper、Pop和Top，他们都继承自BaseView。
* UI的HideEvent如果选择destroy，会自动清理静态引用的资源(动态的业务自己维护)。
* 落地页由Page和Paper共同组成，通过这种模型可以轻松实现多人协同开发。而且Page和Paper在创建时还区分3D与2D，它们在实例化时会分别设置为scene/UIRoot3D、scene/UIRoot2D的子节点。
```
// 打开一个UI(如果没能出现自动提示，请在vscode中打开一下executor.ts文件即可)
app.manager.ui.show<UI类>({
    name: '自动提示UI名',
    data: 自动提示UI类的onShow方法需要的参数,
    onShow:(){},
    onHide:(result){ //自动提示UI类的onHide的返回值类型 },
    onError:(){}
});
app.manager.ui.hide({
    name: '自动提示UI名',
    data: 自动提示UI类的onHide方法需要的参数,
    onHide:(result){ //自动提示UI类的onHide的返回值类型 }
})
// 显示通用loading(加载UI时会自动调用)
app.manager.ui.showLoading();
// 隐藏通用loading
app.manager.ui.hideLoading();
// 增加触摸屏蔽
const uuid = app.manager.ui.addTouchMask();
// 移除触摸屏蔽
app.manager.ui.removeTouchMask(uuid: string);
...//等等
```
## 2、音频
位置处于assets/app-bundle/app-sound目录下，分为effect和music两种类型，分别对应两个目录
```
app.manager.sound.playMusic({
    name: '自动提示'
})
app.manager.sound.playEffect({
    name: '自动提示'
})
// 其它api和参数可以查看相关接口
```

## 3、全局定时器
```
// 它返回的就是个Component，可以使用它的schedule或scheduleOnce等方法
app.manager.timer.get('我的自定义定时器名称')
```

## 4、全局事件
```
app.manager.event.on
app.manager.event.once
app.manager.event.off
app.manager.event.targetOff
```

## 5、全局loader
* 对cc.assetManager的一些简单封装
```
app.manager.loader
```

## 6、全局库
```
// 任务：同时、顺序、组合、重试
app.lib.task
// storage
app.lib.storage
// http
app.lib.http
// 等等
```

## 7、自定义Manager
* 通过菜单栏App/创建/Manager来创建自定义Manager，位置处于assets/app-builtin/app-manager下
* 继承自BaseManager
```
// 通过app.manager来访问
app.manager.xxx
```

## 8、自定义Control
* 通过菜单栏App/创建/Control来创建自定义Control，位置处于assets/app-builtin/app-control下
* 继承自BaseControl，它与Manager的区别是: Manager更偏向一些全局类的功能，而Control更偏向于作为某个UI的对外接口(UI是不能直接进行访问的)
```
  1、作为对外输出，Control内部可以新建变量和方法，在外部(通过XXXControl.inst调用)变量和方法会自动变为只读。
  2、Control内部额外有一个emit和call方法，用来发射事件，这个方法在其它任何地方都是无法访问的。区别在于call方法只会执行第一个注册的事件并获得返回值。
  每个View可以通过继承BaseView.BindControl(Control)来绑定一个Control，
  绑定后在View脚本内部可以通过this.control访问到这个Control实例，与inst调用不同的是，它是不受限的(属性等都不是只读)，
  而且可以通过this.control中的on、once、off来接收和关闭接收Control中emit或call的事件
```

## 9、自定义Model
* 通过菜单栏App/创建/Model来创建自定义Model，位置处于assets/app-builtin/app-model下
```
// 通过app.data或app.config来使用
app.data.xxx
app.config.xxx
```

⚠️: app-builtin和app-bundle下都属于框架bundle目录，不可以删除，不然框架会加载失败。<br/>
⚠️: 大部分的框架目录点击后，都会在属性检查器页面生成它的一些说明文字，可以进行查看。<br/>