import { DEBUG, DEV } from 'cc/env';

function jsGetSet(obj: unknown, prop: string, getter: Function, setter?: Function) {
    Object.defineProperty(obj, prop, {
        get: getter as any,
        set: setter as any,
        enumerable: false,
        configurable: false
    });
}
function clear(object: Record<string | number, any>) {
    if (!object) return;
    for (const key of Object.keys(object)) {
        delete object[key];
    }
}
/**
 * 将某个变量设置为不可观测(不可在浏览器中打印)
 * @param owner object | string | number | boolean | Array | Function | ...
 * @param callback 被观测时触发回调
 * @returns 
 */
export function unobservable(owner: unknown, callback?: Function) {
    if (DEV || DEBUG) return;
    if (!owner) return;
    function define() {
        function accessor() {
            if (callback) {
                callback();
            } else {
                clear(owner);
            }
        }
        try {
            jsGetSet(owner, 'unobservable', accessor.bind(null, 'de' + 'bu' + 'gg' + 'er'));
        }
        catch (e) { !0; }
    }
    define();
}