import { game, sys } from 'cc';
import { App } from './app';

/**
 * ccc除物理引擎等外的基础功能已经准备好了
 */
export function cccReady(app: App) {
    // 为了防止web环境中异常掉帧问题(关键代码在cc.game._pacer._handleRAF中)
    if (sys.isBrowser) {
        game.frameRate = 100;
    }
}

/**
 * ccc全部功能都初始化完毕了
 */
export function cccInited(app: App) {

}

/**
 * app除了用户自定义Manager未加载外，其它都已准备好了
 */
export function appReady(app: App) {

}

/**
 * app全部功能都初始化完毕了
 */
export function appInited(app: App) {

}