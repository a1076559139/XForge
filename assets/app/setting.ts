import SoundManager from '../../extensions/app/assets/manager/sound/SoundManager';
import UIManager from '../../extensions/app/assets/manager/ui/UIManager';

// 预加载的UI(符合app.lib.task.createAny规则)
UIManager.setting.preload = ['PageHome', 'PaperHomeIndex'];
// 默认UI, 会在首屏流程后自动show
UIManager.setting.defaultUI = 'PageHome';
// 弹窗默认遮罩展现动画配置
UIManager.setting.shade = {
    delay: 0,
    begin: 60,
    end: 180,
    speed: 100,
};

// 预加载的音频(按数组顺序依次预加载)
SoundManager.setting.preload = [];
// 默认音乐, 会在首屏流程后自动播放
SoundManager.setting.defaultMusicName = '';
// 默认音效, 会在Button被点击后播放
SoundManager.setting.defaultEffectName = 'effect/button';