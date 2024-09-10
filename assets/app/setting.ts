import SoundManager from '../../extensions/app/assets/manager/sound/SoundManager';
import UIManager from '../../extensions/app/assets/manager/ui/UIManager';

// 预加载的UI(符合app.lib.task.createAny规则)
UIManager.setting.preload = [];
// 默认UI, 会在首屏流程后自动show
UIManager.setting.defaultUI = ''; // 通过App菜单创建Page类型的UI后，填入该UI的名称(会有自动提示与类型检查)
// 是否自动适配分辨率策略
UIManager.setting.autoFit = true; // 开启后，会自动根据设备分辨率、设计分辨率与默认适配策略计算出新的适配策略，以保证UI在屏幕内的显示效果最好
// 弹窗默认遮罩展现动画配置
UIManager.setting.shade = {
    delay: 0,
    begin: 100,
    end: 200,
    speed: 400,
};

// 预加载的音频(按数组顺序依次预加载)
SoundManager.setting.preload = [];
// 默认音乐, 会在首屏流程后自动播放
SoundManager.setting.defaultMusicName = '';
// 默认音效, 会在Button被点击后播放
SoundManager.setting.defaultEffectName = '';