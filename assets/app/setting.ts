import { DEBUG } from 'cc/env';
import { Logger } from 'db://app/lib/logger/logger';
import { Storage } from 'db://app/lib/storage/storage';
import SoundManager from 'db://app/manager/sound/SoundManager';
import UIManager from 'db://app/manager/ui/UIManager';

// 如果需要加密内容，请设置密钥的值
Storage.setting.secretKey = '';
// 设置日志过滤
Logger.setting.filter = DEBUG ? ['error', 'log', 'warn'] : ['error'];

// 预加载的UI列表
UIManager.setting.preload = [];
// 默认UI, 会在首屏流程后自动show
UIManager.setting.defaultUI = ''; // 通过App菜单创建Page类型的UI后，填入该UI的名称(会有自动提示与类型检查)
// 是否自动适配分辨率策略
UIManager.setting.autoFit = true; // 开启后，会弃用项目设置中的适配策略，并自动根据设备分辨率与设计分辨率计算出新的适配策略
// 弹窗默认遮罩展现动画配置
UIManager.setting.shade = {
    delay: 0,
    begin: 100,
    end: 200,
    speed: 400,
    blur: false
};

// 预加载的音频(按数组顺序依次预加载)
SoundManager.setting.preload = [];
// 默认音乐, 会在首屏流程后自动播放
SoundManager.setting.defaultMusicName = '';
// 默认音效, 会在Button被点击后播放
SoundManager.setting.defaultEffectName = '';