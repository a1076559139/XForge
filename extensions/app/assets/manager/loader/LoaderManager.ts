import { Asset, AssetManager, Font, Label, SceneAsset, Sprite, SpriteFrame, _decorator, assetManager, isValid, sp } from 'cc';
import BaseManager from '../../base/BaseManager';
const { ccclass } = _decorator;

@ccclass('LoaderManager')
export default class LoaderManager extends BaseManager {

    private handle(handle: string, { bundle, path, type, onProgress, onComplete }: { bundle?: string, path: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (result: any) => void }) {
        if (!handle) {
            this.error('handle is empty');
            return onComplete && onComplete(null);
        }
        if (!path) {
            this.error(`${handle} fail. path is empty`);
            return onComplete && onComplete(null);
        }
        if (!bundle) bundle = 'resources';

        const args: any[] = [path];
        if (type) args.push(type);
        if (onProgress) args.push(onProgress);
        args.push((err: string, res: any) => {
            if (err) {
                this.error(`${handle} "${path}" fail`, err);
                onComplete && onComplete(null);
            } else {
                onComplete && onComplete(res);
            }
        });

        assetManager.loadBundle(bundle, (err: string, bundle: AssetManager.Bundle) => {
            if (err) return onComplete && onComplete(null);
            bundle[handle](args[0], args[1], args[2], args[3]);
        });
    }

    /**
     * 预加载
     * @param {string} bundle 默认为resources
     */
    public preload(params: { path: string, bundle?: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (item: AssetManager.RequestItem[]) => void }) {
        if (SceneAsset === params.type as typeof Asset) {
            this.handle('preloadScene', { path: params.path, bundle: params.bundle, onProgress: params.onProgress, onComplete: params.onComplete });
        } else {
            this.handle('preload', params);
        }
    }

    /**
     * 预加载
     * @param {string} bundle 默认为resources
     */
    public preloadDir(params: { path: string, bundle?: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: AssetManager.RequestItem[]) => void }) {
        this.handle('preloadDir', params);
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public load<T extends typeof Asset>(params: { path: string, bundle?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (item: InstanceType<T>) => void }) {
        if (SceneAsset === params.type as typeof Asset) {
            this.handle('loadScene', { path: params.path, bundle: params.bundle, onProgress: params.onProgress, onComplete: params.onComplete });
        } else {
            this.handle('load', params);
        }
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadDir<T extends typeof Asset>(params: { path: string, bundle?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: InstanceType<T>[]) => void }) {
        this.handle('loadDir', params);
    }

    /**
     * 销毁一个bundle中对应path和type的资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public release({ path, bundle, type }: { path: string, bundle?: string, type?: typeof Asset }) {
        if (!bundle) bundle = 'resources';
        assetManager.getBundle(bundle)?.release(path, type);
    }

    /**
     * 销毁一个bundle中所有的资源
     * @param bundle 默认为resources
     */
    public releaseAll(bundle?: string) {
        if (!bundle) bundle = 'resources';
        const _bundle = assetManager.getBundle(bundle);
        if (!_bundle) return;
        // 只释放自己内部的资源，依赖的资源只减少引用计数
        _bundle.getDirWithPath('/', Asset).forEach((asset) => {
            _bundle.release(asset.path, asset.ctor);
        });
        // cocos提供的方法会将依赖的资源也卸载(这个设计很奇怪)
        // _bundle?.releaseAll();
    }

    /**
     * 销毁一个bundle中未使用的资源
     * @param bundle 默认为resources
     */
    public releaseUnused(bundle?: string) {
        if (!bundle) bundle = 'resources';
        //@ts-ignore
        assetManager.getBundle(bundle)?.releaseUnusedAssets();
    }

    /**
     * 加载一个bundle
     * @param params.bundle 默认为resources
     */
    public loadBundle({ bundle, onComplete }: { bundle?: string, onComplete?: (bundle: AssetManager.Bundle) => any }) {
        if (!bundle) bundle = 'resources';
        assetManager.loadBundle(bundle, (err: string, bundle: AssetManager.Bundle) => {
            onComplete && onComplete(err ? null : bundle);
        });
    }

    /**
     * 获取一个已经加载的bundle
     * @param bundle 默认为resources
     */
    public getBundle(bundle?: string) {
        if (!bundle) bundle = 'resources';
        return assetManager.getBundle(bundle);
    }

    /**
     * 移除一个已经加载的bundle
     * @param bundle 默认为resources
     */
    public removeBundle(bundle?: string) {
        if (!bundle) bundle = 'resources';
        const b = assetManager.getBundle(bundle);
        if (b) assetManager.removeBundle(b);
    }

    /**
     * 加载远程资源
     * @example
     * loadRemote({url:'', ext:'.png', onComplete:(){result}})
     */
    public loadRemote({ url, ext, onComplete }: { url: string, ext?: string, onComplete?: (result: any) => void }) {
        if (ext) {
            assetManager.loadRemote(url, { ext }, (error, res) => {
                if (error) {
                    this.error(`loadRemote ${url} fail`);
                    return onComplete && onComplete(null);
                }
                onComplete && onComplete(res);
            });
        } else {
            assetManager.loadRemote(url, (error, res) => {
                if (error) {
                    this.error(`loadRemote ${url} fail`);
                    return onComplete && onComplete(null);
                }
                onComplete && onComplete(res);
            });
        }
    }

    /**
     * 设置字体资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * 
     * @example
     * const bundle = app.manager.ui.getResBundleName('PageGame')
     * setFont({target:label, path:'font/num', bundle:bundle, onSuccess:()=>{}})
     */
    public setFont(params: { target: Label, path: string, bundle?: string, onSuccess?: () => void, onFail?: () => void }) {
        this.load({
            path: params.path,
            bundle: params.bundle,
            type: Font,
            onComplete: (font) => {
                if (!font || !isValid(params.target)) {
                    return params.onFail && params.onFail();
                }
                params.target.font = font;
                params.onSuccess && params.onSuccess();
            }
        });
    }

    /**
     * 设置Spine资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * 
     * @example
     * const bundle = app.manager.ui.getResBundleName('PageGame')
     * setSpine({target:spine, path:'spine/role', bundle:bundle, onSuccess:()=>{}})
     */
    public setSpine(params: { target: sp.Skeleton, path: string, bundle?: string, onSuccess?: () => void, onFail?: () => void }) {
        this.load({
            path: params.path,
            bundle: params.bundle,
            type: sp.SkeletonData,
            onComplete: (skeletonData) => {
                if (!skeletonData || !isValid(params.target)) {
                    return params.onFail && params.onFail();
                }
                params.target.skeletonData = skeletonData;
                params.onSuccess && params.onSuccess();
            }
        });
    }

    /**
     * 设置图片资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * 
     * @example
     * const bundle = app.manager.ui.getResBundleName('PageGame')
     * setSprite({target:sprite, path:'img/a/spriteFrame', bundle:bundle, onSuccess:()=>{}})
     */
    public setSprite(params: { target: Sprite, path: string, bundle?: string, onSuccess?: () => void, onFail?: () => void }) {
        this.load({
            path: params.path,
            bundle: params.bundle,
            type: SpriteFrame,
            onComplete: (spriteFrame) => {
                if (!spriteFrame || !isValid(params.target)) {
                    return params.onFail && params.onFail();
                }
                params.target.spriteFrame = spriteFrame;
                params.onSuccess && params.onSuccess();
            }
        });
    }
}
