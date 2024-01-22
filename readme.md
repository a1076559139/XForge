# 一、介绍

> 框架设计之初主要考虑H5与小游戏环境，最终的目的是希望：
>> 1. 更好的多人协同开发体验。
>> 2. 尽可能统一的开发规范(尽量避免口头约束)。
>> 3. 更小的首屏/首页体积。
>> 4. 更小的增量更新体积。
>> 5. 复用通用模块的能力。

***

- 目前根据经验，2D游戏gzip后，首屏资源可控制在1M以内，游戏首页可控制在2.5M以内。

- ⚠️大部分的框架目录点击后，都会在属性检查器页面生成它的一些说明文字，可以进行查看。

- ⚠️框架暂时不允许自定义assets下的文件夹，所有文件夹可以通过菜单栏App来创建。

- ⚠️使用vscode推荐安装 Code Spell Checker 插件。

<br>

# 二、脚手架

## 0、 初始化项目

* 在空文件夹下执行`npx @gamex/cc-cli@latest`

## 1、 更新项目框架

* 在项目根目录下执行`npm run upgrade`

## 2、 使用内置package

* 在项目根目录下执行`npm run package`

<br>

# 三、功能介绍 [(视频)](https://www.bilibili.com/video/BV1wp4y1G7ue/?spm_id_from=888.80997.embed_other.whitelist&t=1)


## 0、 ESLint

* 在vscode中安装ESLint插件

* 在项目根目录下执行**npm install**

## 1、 首屏

**游戏的首屏位于assets/app-appinit文件夹内。**

  - res目录用于存放资源。

  - view目录用于存放预制体和脚本。

**AppInit继承自BaseAppInit。**

- 需要注意的是在BaseAppInit中是通过Cocos的生命周期start来进行框架的初始化工作，所以如果在AppInit中重写了start方法，一定要调用super.start或this.startInit。
  ```ts
  /**
    * [可以重写] 默认start调用startInit，可以重写后自定义时机
    */
  protected start(): any { 
    this.startInit(); 
  }
  ```

- 可以通过重写getUserAssetNum、onUserInit、onProgress、onFinish，来实现自定义初始化流程(一般是在onUserInit中异步加载资源，完成的回调中调用一次nextInit来触发下一步)。
  ```ts
  /**
  * [建议重写] 监听进度
  * @param {Number} completed
  * @param {Number} total
  */
  protected onProgress(completed: number, total: number): any { return completed / total; }

  /**
  * [建议重写] 监听用户初始化数据
  * @param {Number} index
  */
  protected onUserInit(index: number): any { return index; }

  /**
  * [建议重写] 获得用户资源总量，这里返回几，就需要用户自行调用几次nextInit
  */
  protected getUserAssetNum(): number { return 0; }

  /**
  * [建议重写] 初始化完成
  */
  protected onFinish() { }
  ```

## 2、管理器

**管理器位于assets/app-builtin/app-manager中。**
> 不需要也不建议手动去创建，可以通过菜单栏App->创建->Manager选项来进行创建。

**管理器继承自BaseManager。**
- 可以通过重写init方法，来初始化一些管理器内部需要用到的资源，完成后需要调用finish表示初始化完成。

- 同时也提供了onInited和onFinished生命周期回调。
  ```ts
  /**
  * [无序] 自身初始化完成, init执行完毕后被调用
  */
  protected onInited() {
  }

  /**
  * [无序] 所有manager初始化完成
  */
  protected onFinished() {
  }

  /**
  * [无序] 初始化manager，在初始化完成后，调用finish方法
  * @param {Function} finish 
  */
  protected init(finish?: Function) {
      finish && finish();
  }
  ```

**管理器一般存放游戏流程控制相关的逻辑。**

- 如登录流程控制、全局状态管理等

**创建好的管理器通过app.manager.xxx来调用。**

- 如app.manager.ui

***框架有内置的管理器，包括：UI、音频、下载、事件、定时器。***

- **UIManager**：通过app.manager.ui访问，用于控制UI显示。

  ```js
  // 显示一个UI
  app.manager.ui.show<UI类>({
      name: '自动提示UI名',
      data: 自动提示onShow方法需要的参数,
      onShow:(){},
      onHide:(result){ //result自动识别为onHide的返回值类型 },
      onError:(){}
  });
  // 关闭一个UI
  app.manager.ui.hide<UI类>({
      name: '自动提示UI名',
      data: 自动提示onHide方法需要的参数,
      onHide:(result){ //result自动识别为onHide的返回值类型 }
  })
  ```

- **SoundManager**：通过app.manager.sound访问，用于控制声音播放。

  ```js
  app.manager.sound.playMusic({name:'自动提示音频名'});

  app.manager.sound.stopMusic();

  const id = app.manager.sound.playEffect({name:'自动提示音频名'});

  app.manager.sound.stopEffect(id);

  app.manager.sound.stopAllEffects();
  ```

- **TimerManager**：通过app.manager.timer访问，用于创建全局定时器。

  ```js
  // 创建或获取定时器
  // app.manager.timer.get返回值的类型是cc.Component的子类
  const timer = app.manager.timer.get(自定义标识);

  timer.schedule // 同cc.Component.prototype.schedule
  timer.scheduleOnce // 同理
  timer.unschedule // 同理
  timer.unscheduleAllCallbacks // 同理

  // 注册每日触发器(基于本地时间，使用cc.Component.prototype.update驱动)
  timer.registerDailyTrigger('8:00:01-9:00',()=>{ 
    console.log('8点01点到9点整之间每帧触发') 
  })
  // 取消每日触发器
  timer.registerDailyTrigger

  // 删除定时器
  app.manager.timer.delete(自定义标识);
  // 删除所有定时器
  app.manager.timer.clear();
  ```

- **EventManager**：通过app.manager.event访问，用于创建全局事件。

  ```js
  // 创建或获取事件管理器
  // app.manager.event.get返回值的类型是cc.EventTarget
  const event = app.manager.event.get(自定义标识);

  event.on('event', ()=>{}, target) // 同cc.EventTarget.prototype.on
  event.once('event', ()=>{}, target) // 同理
  event.off('event')或event.off('event', ()=>{}) // 同理
  event.targetOff(target)  // 同理

  // 删除事件管理器
  app.manager.event.delete(自定义标识);
  // 删除所有事件管理器
  app.manager.event.clear();
  ```

- **LoaderManager**：通过app.manager.loader访问，用于加载资源。

  ```js
  app.manager.loader.load({
    bundle: 'xxx', // 不传入bundle，默认为resources
    path: 'xxx/xxxx'
    type: Asset,
    onComplete(asset){
      
    }
  })
  ```

## 3、控制器

**管理器位于assets/app-builtin/app-control中。**
> 不需要也不建议手动去创建，可以通过菜单栏App->创建->Control选项来进行创建。

**控制器继承自BaseControl。**

- 控制器内部可以新建变量和方法，在外部通过XXXControl.inst调用时，变量和方法会显示为只读属性。

- 控制器内部有emit和call方法，用来发射事件，这个方法在其它任何地方都是无法访问的。两个方法区别在于call方法只会执行第一个注册的事件并获得返回值。

- UI需要通过继承BaseView.BindControl(XXXControl)来绑定一个控制器，并通过this.control访问到这个控制器实例，与inst调用不同的是，它是不受限的(属性等都不是只读)，而且可以通过this.control中的on、once、off、targetOff来接收和关闭emit或call的事件。

- **与cc.Node的事件不同，通过control注册的事件，需要通过off或targetOff手动销毁**

**控制器负责维护外部与UI内部的联系。**

**控制器通过import的方式引入。**

## 4、数据

**数据位于assets/app-builtin/app-model中。**
> 不需要也不建议手动去创建，可以通过菜单栏App->创建->Model选项来进行创建。

框架内置了数据管理，分为store、data和config类型，可以通过app.data、app.config和app.store来访问。
- config类型的数据，**不可以定义方法**，所有属性都是**只读**，用于存储静态配置。
- data类型的数据，**不可以定义方法**，所有属性都是**可读可写**，用于存储不安全的数据(因为可以在任何地方修改它)。
- store类型的数据，**可以定义方法**，所有属性都是**只读**，用于存储安全的数据(数据只允许在内部修改，外部只有访问权限)。

**store类型的引入是借鉴了Web前端框架中全局状态管理的思路，意图是让数据更安全，更可控。同时框架中还提供了数据绑定的扩展包，可以通过pkg的方式安装，实现「数据->视图」的单向绑定。**

## 5、音频
**音频位于assets/app-builtin/app-sound中。**
> 不需要也不建议手动去创建目录，可以通过菜单栏App->创建->Sound选项来进行创建。

- music 音乐目录
- effect 音效目录
- 通过app.manager.sound来控制播放。

## 6、界面

**UI位于assets/app-builtin/app-view中。**
> 不需要也不建议手动去创建，可以通过菜单栏App->创建->View选项来进行创建。

**UI目录包含native和resources两个文件夹。**

- native和resources都是Bundle。

- native负责存储脚本与Prefab/Scene资源，native/expansion目录存储你自己创建的脚本与Prefab。

- resources存储所有渲染资源，如图片、spine、font等。

> 这样处理的的好处在于native与resources将分别采用不同的分包策略，来达到在各平台上加载性能与体积最优。

**UI继承自BaseView，在Cocos原有的生命周期函数外，又增加了一些框架的生命周期函数。**

- `beforeShow`：UI显示前触发。
    > 可用于在显示前加载或处理某些任务，比如在Page显示之前先显示Paper，可以避免视觉上Page和Paper显示延迟的割裂感。

- `onShow`：UI显示后触发。
    > 设置UI内容的逻辑都写在这个回调里面。

- `beforeHide`：UI卸载前触发。

- `onHide`：UI卸载后触发。

- `onFocus`：UI获取焦点时触发。
    > 需要勾选UI脚本所在的编辑器面板中的Capture Focus选项。

- `onLostFocus`：UI失去焦点时触发。
    > 需要勾选UI脚本所在的编辑器面板中的Capture Focus选项。

- `onError`：可以监听当前UI加载报错。

- `onShade`：可以控制当前UI背景遮罩的颜色和动画。

**UI分为4类：Page、Paper、Pop和Top，他们都继承自BaseView。**

- 它们的层级按顺序依次增大(同Camera下)，即: Top > Pop > Paper > Page。

- Page和Paper在创建时区分3D与2D类型，3D类型的Page会以cc.Scene的形式存在，其它以cc.Prefab的形式存在。

- 一个落地页应由Page和Paper共同组成，通过这种模型可以轻松实现多人协同开发。

```ts
@ccclass('PageHome')
export class PageHome extends BaseView {
    // 子界面列表，数组顺序为子界面排列顺序
    protected miniViews: IMiniViewNames = ['PaperHomeIndex', 'PaperAllIndex'];
    // 初始化的相关逻辑写在这
    protected onLoad() { }

    protected beforeShow(next: (error?: string) => void, data?: any) {
        // 在显示PageHome之前先显示PaperHomeIndex(最终效果是两者同时显示)
        this.showMiniViews({
            views: ['PaperHomeIndex'],
            onFinish: next
        });
    }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    protected onShow(params: any) {
        // PageHome显示之后再动态加载PaperAllIndex
        this.showMiniViews({
            views: ['PaperAllIndex']
        });
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    protected onHide(result: undefined) {
        // app.manager.ui.show<PageHome>({name: 'PageHome', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
        return result;
    }

    protected onShade(): IShade {
        return {
            end: 200,// 最终的透明度
            speed: 100// 变化速度
        };
    }
}
```

**UI脚本所在编辑器面板的选项。**

- Hide Event
  - 如果选择active，节点只会被隐藏，第二次加载的速度会更快，建议经常打开的UI选择active。

  - 如果选择destroy，节点会被销毁，会自动清理自身所有的资源，不管是静态还是动态引用的。

- Singleton

  - 如果勾选的话，则重复通过app.manager.ui.show来加载此UI的话，全局只会有一份UI实例。

  - 如果去掉勾选的话，则重复通过app.manager.ui.show来加载此UI的话，会重复创建UI。

- Capture Focus

  - 勾选后，才可以触发UI的onFocus和onLostFocus回调。

- Shade

  - 勾选后，才会在UI下面生成一个黑色(可设置透明度)的遮罩。

- Block Input

  - 勾选后，会使触摸无法穿透此UI。

## 7、扩展包

**扩展包包含通用组件、控件、库等内容，需要脚手架来配合使用。**
1. 在创建好的项目根目录下，使用命令行执行`npm run package`。
2. 选择**安装选项**。
3. 在下拉列表内使用方向键选择需要的包。

**扩展包的使用一方面可以精简框架的体积，另一方面也为各项目后续的升级维护工作带来极大的便利。**

## 8、设置

**目前仅支持设置UIManager和SoundManager，位置位于assets/app/setting.ts内**

```js
// 预加载的UI(符合app.lib.task.createAny规则)
UIManager.setting.preload = ['PageHome', 'PaperHomeIndex'];
// 默认UI, 会在首屏流程后自动show
UIManager.setting.defaultUI = 'PageHome';
// 控制全局背景遮罩透明度与动画
UIManager.setting.shade = { ... };

// 预加载的音频(按数组顺序依次预加载)
SoundManager.setting.preload = [];
// 默认音乐, 会在首屏流程后自动play
SoundManager.setting.defaultMusicName = '';
```