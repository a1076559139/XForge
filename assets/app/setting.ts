import SoundManager from '../../extensions/app/assets/manager/sound/SoundManager';
import UIManager from '../../extensions/app/assets/manager/ui/UIManager';

// 预加载的UI(符合app.lib.task.createAny规则)
UIManager.setting.preload = ['PageHome', 'PaperHomeIndex'];
// 默认UI, 会在首屏流程后自动show
UIManager.setting.defaultUI = 'PageHome';

// 预加载的音频(按数组顺序依次预加载)
SoundManager.setting.preload = [];
// 默认音乐, 会在首屏流程后自动play
SoundManager.setting.defaultMusicName = '';