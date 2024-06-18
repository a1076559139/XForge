import { Asset, AssetManager, Font, Label, SceneAsset, Sprite, SpriteFrame, _decorator, assetManager, isValid, sp } from 'cc';
import BaseManager from '../../base/BaseManager';
const { ccclass } = _decorator;

@ccclass('LoaderManager')
export default class LoaderManager extends BaseManager {

    private handle(handle: string, { bundle, version, path, type, onProgress, onComplete }: { bundle?: string, version?: string, path: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (result: any) => void }) {
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

        this.loadBundle({
            bundle, version,
            onComplete(bundle) {
                if (!bundle) return onComplete && onComplete(null);
                bundle[handle](args[0], args[1], args[2], args[3]);
            },
        });
    }

    /**
     * 预加载
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public preload(params: { path: string, bundle?: string, version?: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (item: AssetManager.RequestItem[]) => void }) {
        if (SceneAsset === params.type as typeof Asset) {
            this.handle('preloadScene', { path: params.path, bundle: params.bundle, version: params.version, onProgress: params.onProgress, onComplete: params.onComplete });
        } else {
            this.handle('preload', params);
        }
    }

    /**
     * 预加载
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public preloadDir(params: { path: string, bundle?: string, version?: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: AssetManager.RequestItem[]) => void }) {
        this.handle('preloadDir', params);
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public load<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (item: InstanceType<T>) => void }) {
        if (SceneAsset === params.type as typeof Asset) {
            this.handle('loadScene', { path: params.path, bundle: params.bundle, version: params.version, onProgress: params.onProgress, onComplete: params.onComplete });
        } else {
            this.handle('load', params);
        }
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadAsync<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void }): Promise<InstanceType<T>> {
        return new Promise((resolve) => {
            this.load({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadDir<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: InstanceType<T>[]) => void }) {
        this.handle('loadDir', params);
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadDirAsync<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void }): Promise<InstanceType<T>[]> {
        return new Promise((resolve) => {
            this.loadDir({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 销毁一个bundle中对应path和type的资源
     * @param params.bundle 默认为resources，如果是远程bundle，则使用url末位作为bundel名
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public release({ path, bundle, type }: { path: string, bundle?: string, type?: typeof Asset }) {
        if (!bundle) bundle = 'resources';
        assetManager.getBundle(bundle)?.release(path, type);
    }

    /**
     * 销毁一个bundle中所有的资源
     * @param bundle 默认为resources，如果是远程bundle，则使用url末位作为bundel名
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
     * @param bundle 默认为resources，如果是远程bundle，则使用url末位作为bundel名
     */
    public releaseUnused(bundle?: string) {
        if (!bundle) bundle = 'resources';
        //@ts-ignore
        assetManager.getBundle(bundle)?.releaseUnusedAssets();
    }

    /**
     * 加载一个bundle
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public loadBundle({ bundle, version, onComplete }: { bundle?: string, version?: string, onComplete?: (bundle: AssetManager.Bundle) => any }) {
        if (!bundle) bundle = 'resources';
        if (version) {
            assetManager.loadBundle(bundle, { version }, (err: Error, bundle: AssetManager.Bundle) => {
                onComplete && onComplete(err ? null : bundle);
            });
        } else {
            assetManager.loadBundle(bundle, (err: Error, bundle: AssetManager.Bundle) => {
                onComplete && onComplete(err ? null : bundle);
            });
        }
    }

    /**
     * 加载一个bundle
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public loadBundleAsync(params: { bundle?: string, version?: string }): Promise<AssetManager.Bundle> {
        return new Promise((resolve) => {
            this.loadBundle({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 获取一个已经加载的bundle
     * @param bundle 默认为resources，如果是远程bundle，则使用url末位作为bundel名
     */
    public getBundle(bundle?: string) {
        if (!bundle) bundle = 'resources';
        return assetManager.getBundle(bundle);
    }

    /**
     * 移除一个已经加载的bundle
     * @param bundle 默认为resources，如果是远程bundle，则使用url末位作为bundel名
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
    public loadRemote({ url, ext, onComplete }: { url: string, ext?: string, onComplete?: (result: Asset) => void }) {
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
     * 加载远程资源
     * @example
     * await loadRemoteAsync({url:'', ext:'.png'})
     */
    public loadRemoteAsync(params: { url: string, ext?: string }): Promise<Asset> {
        return new Promise((resolve) => {
            this.loadRemote({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 设置字体资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * 
     * @example
     * setFont({target:label, path:'font/num', bundle:'resources', onComplete:(succ)=>{}})
     */
    public setFont(params: { target: Label, path: string, bundle?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }) {
        this.load({
            path: params.path,
            bundle: params.bundle,
            type: Font,
            onComplete: (font) => {
                if (!font || !isValid(params.target)) {
                    params.onFail && params.onFail();
                    params.onComplete && params.onComplete(false);
                    return;
                }
                params.target.font = font;
                params.onSuccess && params.onSuccess();
                params.onComplete && params.onComplete(true);
            }
        });
    }

    /**
     * 设置Spine资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * 
     * @example
     * setSpine({target:spine, path:'spine/role', bundle:'resources', onComplete:(succ)=>{}})
     */
    public setSpine(params: { target: sp.Skeleton, path: string, bundle?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }) {
        this.load({
            path: params.path,
            bundle: params.bundle,
            type: sp.SkeletonData,
            onComplete: (skeletonData) => {
                if (!skeletonData || !isValid(params.target)) {
                    params.onFail && params.onFail();
                    params.onComplete && params.onComplete(false);
                    return;
                }
                params.target.skeletonData = skeletonData;
                params.onSuccess && params.onSuccess();
                params.onComplete && params.onComplete(true);
            }
        });
    }

    /**
     * 设置图片资源
     * @param params.bundle 默认为resources
     * @param params.path bundle下的相对路径
     * 
     * @example
     * setSprite({target:sprite, path:'img/a/spriteFrame', bundle:'resources', onComplete:(succ)=>{}})
     */
    public setSprite(params: { target: Sprite, path: string, bundle?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }) {
        this.load({
            path: params.path,
            bundle: params.bundle,
            type: SpriteFrame,
            onComplete: (spriteFrame) => {
                if (!spriteFrame || !isValid(params.target)) {
                    params.onFail && params.onFail();
                    params.onComplete && params.onComplete(false);
                    return;
                }
                params.target.spriteFrame = spriteFrame;
                params.onSuccess && params.onSuccess();
                params.onComplete && params.onComplete(true);
            }
        });
    }
}
