import { Asset, AssetManager, Font, ImageAsset, JsonAsset, Label, SceneAsset, Sprite, SpriteFrame, Texture2D, TextureCube, _decorator, assetManager, isValid, path, sp } from 'cc';
import { MINIGAME } from 'cc/env';
import BaseManager from '../../base/BaseManager';
import Core from '../../Core';
const { ccclass } = _decorator;
const REGEX = /^https?:\/\/.*/;

class Command {
    private static cache: Command[] = [];

    static create(onComplete: (items: unknown) => void, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void = null) {
        const command = Command.cache.pop() || new Command();
        onProgress && command.onProgress.push(onProgress);
        onComplete && command.onComplete.push(onComplete);
        return command;
    }

    static put(command: Command) {
        command.onProgress.length = 0;
        command.onComplete.length = 0;
        Command.cache.push(command);
    }

    onProgress: Array<(finish: number, total: number, item: AssetManager.RequestItem) => void> = [];
    onComplete: Array<(items: unknown) => void> = [];

    private constructor() { }
}

class Loader {
    private assetMap = new Map<string, Asset>();
    private loadingMap = new Map<string, Command>();

    /**
     * 预加载
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public preload(params: { path: string, bundle?: string, version?: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (item: AssetManager.RequestItem[] | null) => void }) {
        return Core.inst.manager.loader.preload(params);
    }

    /**
     * 预加载
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public preloadDir(params: { path: string, bundle?: string, version?: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: AssetManager.RequestItem[] | null) => void }) {
        return Core.inst.manager.loader.preloadDir(params);
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundel名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public load<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (item: InstanceType<T> | null) => void }) {
        const key = `${params.bundle || 'resources'}-${params.type.name}-${params.path}-${params.version || ''}`;

        if (this.loadingMap.has(key)) {
            const command = this.loadingMap.get(key);
            params.onProgress && command.onProgress.push(params.onProgress);
            params.onComplete && command.onComplete.push(params.onComplete);
            return;
        }

        // 加载中
        const command = Command.create(params.onComplete, params.onProgress);
        this.loadingMap.set(key, command);

        // 有缓存
        if (this.assetMap.has(key)) {
            const asset = this.assetMap.get(key);
            // 有缓存的情况下不触发onProgress回调
            setTimeout(() => {
                // 加载无效
                if (!this.loadingMap.has(key)) return;
                this.loadingMap.delete(key);
                command.onComplete.forEach(cb => cb(asset));
                Command.put(command);
            }, 0);
            return;
        }

        Core.inst.manager.loader.load({
            ...params,
            onProgress: (finish, total, item) => {
                if (!this.loadingMap.has(key)) return;
                command.onProgress.forEach(cb => cb(finish, total, item));
            },
            onComplete: (asset) => {
                // 加载无效
                if (!this.loadingMap.has(key)) {
                    asset.addRef();
                    asset.decRef();
                    return;
                }
                this.loadingMap.delete(key);
                if (asset) {
                    asset.addRef();
                    this.assetMap.set(key, asset);
                }
                command.onComplete.forEach(cb => cb(asset));
                Command.put(command);
            }
        });
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadAsync<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void }): Promise<InstanceType<T> | null> {
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
    public loadDir<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: InstanceType<T>[] | null) => void }) {
        const key = `${params.bundle || 'resources'}-${params.type.name}-${params.path}-${params.version || ''}:`;

        if (this.loadingMap.has(key)) {
            const command = this.loadingMap.get(key);
            params.onProgress && command.onProgress.push(params.onProgress);
            params.onComplete && command.onComplete.push(params.onComplete);
            return;
        }

        // 加载中
        const command = Command.create(params.onComplete, params.onProgress);
        this.loadingMap.set(key, command);

        const results = [] as InstanceType<T>[];
        this.assetMap.forEach((asset, path) => {
            if (path.indexOf(key) === 0) {
                results.push(asset as InstanceType<T>);
            }
        });

        // 有缓存
        if (results.length) {
            // 有缓存的情况下不触发onProgress回调
            setTimeout(() => {
                // 加载无效
                if (!this.loadingMap.has(key)) return;
                this.loadingMap.delete(key);
                command.onComplete.forEach(cb => cb(results));
                Command.put(command);
            }, 0);
            return;
        }

        Core.inst.manager.loader.loadDir({
            ...params,
            onProgress: (finish, total, item) => {
                if (!this.loadingMap.has(key)) return;
                command.onProgress.forEach(cb => cb(finish, total, item));
            },
            onComplete: (assets) => {
                // 加载无效
                if (!this.loadingMap.has(key)) {
                    assets?.forEach((asset) => {
                        asset.addRef();
                        asset.decRef();
                    });
                    return;
                }
                this.loadingMap.delete(key);
                assets?.forEach((asset) => {
                    asset.addRef();
                    this.assetMap.set(key + asset.uuid, asset);
                });
                command.onComplete.forEach(cb => cb(results));
                Command.put(command);
            }
        });
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadDirAsync<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void }): Promise<InstanceType<T>[] | null> {
        return new Promise((resolve) => {
            this.loadDir({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 加载远程资源
     * @example
     * loadRemote({url:'', ext:'.png', onComplete:(result){ }})
     */
    public loadRemote({ url, ext, onComplete }: { url: string, ext?: string, onComplete?: (result: Asset | null) => void }) {
        if (this.loadingMap.has(url)) {
            const command = this.loadingMap.get(url);
            onComplete && command.onComplete.push(onComplete);
            return;
        }

        // 加载中
        const command = Command.create(onComplete);
        this.loadingMap.set(url, command);

        // 有缓存
        if (this.assetMap.has(url)) {
            const asset = this.assetMap.get(url);
            // 有缓存的情况下不触发onProgress回调
            setTimeout(() => {
                // 加载无效
                if (!this.loadingMap.has(url)) return;
                this.loadingMap.delete(url);
                command.onComplete.forEach(cb => cb(asset));
                Command.put(command);
            }, 0);
            return;
        }

        Core.inst.manager.loader.loadRemote({
            url, ext,
            onComplete: (asset) => {
                // 加载无效
                if (!this.loadingMap.has(url)) {
                    asset.addRef();
                    asset.decRef();
                    return;
                }
                this.loadingMap.delete(url);
                if (asset) {
                    asset.addRef();
                    this.assetMap.set(url, asset);
                }
                command.onComplete.forEach(cb => cb(asset));
                Command.put(command);
            }
        });
    }

    /**
     * 加载远程资源
     * @example
     * await loadRemoteAsync({url:'', ext:'.png'})
     */
    public loadRemoteAsync(params: { url: string, ext?: string }): Promise<Asset | null> {
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
     * setFont({target:label, url:'http://img/a/font',ext:'.ttf', onComplete:(succ)=>{}})
     */
    public setFont(params: { target: Label, url: string, ext?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }): void;
    public setFont(params: { target: Label, path: string, bundle?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }): void;
    public setFont(params: { target: Label, path?: string, bundle?: string, url?: string, ext?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }) {
        if (params.url) {
            this.loadRemote({
                url: params.url,
                ext: params.ext,
                onComplete: (font: Font) => {
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
        } else {
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
     * setSprite({target:sprite, url:'http://img/a/avatar',ext:'.png', onComplete:(succ)=>{}})
     */
    public setSprite(params: { target: Sprite, url: string, ext?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }): void;
    public setSprite(params: { target: Sprite, path: string, bundle?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }): void;
    public setSprite(params: { target: Sprite, path?: string, bundle?: string, url?: string, ext?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }) {
        if (params.url) {
            this.loadRemote({
                url: params.url,
                ext: params.ext,
                onComplete: (imageAsset: ImageAsset) => {
                    if (!imageAsset || !isValid(params.target)) {
                        params.onFail && params.onFail();
                        params.onComplete && params.onComplete(false);
                        return;
                    }
                    const spriteFrame = SpriteFrame.createWithImage(imageAsset);
                    params.target.spriteFrame = spriteFrame;
                    params.onSuccess && params.onSuccess();
                    params.onComplete && params.onComplete(true);
                }
            });
        } else {
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

    /**
     * 释放所有资源
     */
    public releaseAll() {
        const assetList: Asset[] = [];
        this.assetMap.forEach(asset => assetList.push(asset));
        this.assetMap.clear();
        this.loadingMap.clear();
        // 延迟一秒释放资源
        setTimeout(() => {
            assetList.forEach(asset => asset.decRef());
        }, 1000);
    }
}

@ccclass('LoaderManager')
export default class LoaderManager extends BaseManager {
    /**
     * `Loader`是基于`LoaderManager`的封装，不同的是，`Loader`是基于单个`Loader实例`对资源进行`自动引用计数`管理。（LoaderManager本质是对cc.assetManager的封装，提供了更方便的接口，都是基于Asset Bundle管理资源，并且资源的引用计数需要开发者手动管理）
     * @example
     * // 创建Loader实例
     * const loader = new LoaderManager.Loader();
     * // 加载资源
     * loader.load({path:'img/a/spriteFrame', bundle:'resources', type:SpriteFrame, onComplete:(spriteFrame)=>{}})
     * // 加载远程图片资源
     * loader.loadRemote({url:'http://img/a/avatar',ext:'.png', onComplete:(imageAsset)=>{}})
     * // 释放所有资源
     * loader.releaseAll();
     */
    static Loader = Loader;

    private handle(handle: string, { bundle, version, path, type, onProgress, onComplete }: { bundle?: string, version?: string, path: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (result: unknown | null) => void }) {
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
                if (type === SpriteFrame && path.slice(-12) !== '/spriteFrame') {
                    this.warn(`加载SpriteFrame类型的资源, 路径可能需要以/spriteFrame结尾, 如: 「${path}」 -> 「${path}/spriteFrame」`);
                } else if (type === Texture2D && path.slice(-8) !== '/texture') {
                    this.warn(`加载Texture2D类型的资源, 路径可能需要以/texture结尾, 如: 「${path}」 -> 「${path}/texture」`);
                } else if (type === TextureCube && path.slice(-12) !== '/textureCube') {
                    this.warn(`加载TextureCube类型的资源, 路径可能需要以/textureCube结尾, 如: 「${path}」 -> 「${path}/textureCube」`);
                }
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
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public preload(params: { path: string, bundle?: string, version?: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (item: AssetManager.RequestItem[] | null) => void }) {
        if (SceneAsset === params.type as typeof Asset) {
            this.handle('preloadScene', { path: params.path, bundle: params.bundle, version: params.version, onProgress: params.onProgress, onComplete: params.onComplete });
        } else {
            this.handle('preload', params);
        }
    }

    /**
     * 预加载
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public preloadDir(params: { path: string, bundle?: string, version?: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: AssetManager.RequestItem[] | null) => void }) {
        this.handle('preloadDir', params);
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public load<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (item: InstanceType<T> | null) => void }) {
        if (SceneAsset === params.type as typeof Asset) {
            this.handle('loadScene', { path: params.path, bundle: params.bundle, version: params.version, onProgress: params.onProgress, onComplete: params.onComplete });
        } else {
            this.handle('load', params);
        }
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadAsync<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void }): Promise<InstanceType<T> | null> {
        return new Promise((resolve) => {
            this.load({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadDir<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: InstanceType<T>[] | null) => void }) {
        this.handle('loadDir', params);
    }

    /**
     * 加载bundle下的资源
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public loadDirAsync<T extends typeof Asset>(params: { path: string, bundle?: string, version?: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void }): Promise<InstanceType<T>[] | null> {
        return new Promise((resolve) => {
            this.loadDir({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 销毁一个bundle中对应path和type的资源
     * @param params.bundle 默认为resources，如果是远程bundle，则使用url末位作为bundle名
     * @param params.path bundle下的相对路径
     * @param params.type 资源类型
     */
    public release({ path, bundle, type }: { path: string, bundle?: string, type?: typeof Asset }) {
        if (!bundle) bundle = 'resources';
        assetManager.getBundle(bundle)?.release(path, type);
    }

    /**
     * 销毁一个bundle中所有的资源
     * @param bundle 默认为resources，如果是远程bundle，则使用url末位作为bundle名
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
     * @param bundle 默认为resources，如果是远程bundle，则使用url末位作为bundle名
     */
    public releaseUnused(bundle?: string) {
        if (!bundle) bundle = 'resources';
        //@ts-ignore
        assetManager.getBundle(bundle)?.releaseUnusedAssets();
    }

    /**
     * 加载一个bundle
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public loadBundle({ bundle, version, onComplete }: { bundle?: string, version?: string, onComplete?: (bundle: AssetManager.Bundle | null) => any }) {
        if (!bundle) bundle = 'resources';

        if (MINIGAME) {
            if (REGEX.test(bundle)) {
                this.warn('小游戏环境下只支持加载远程Bundle的资源数据, 不会加载脚本');
                this.reloadBundle({ bundle, version, onComplete });
                return;
            }
            if (version && assetManager.downloader.bundleVers[bundle] !== version) {
                this.warn('小游戏环境下只支持更新Bundle的远程资源数据, 不会更新脚本');
                // 先加载本地bundle运行脚本
                assetManager.loadBundle(bundle, (err: Error, b: AssetManager.Bundle) => {
                    if (err || !b) return onComplete?.(null);
                    // 然后再走重载逻辑更新资源
                    this.reloadBundle({ bundle, version, onComplete });
                });
            } else {
                assetManager.loadBundle(bundle, (err: Error, bundle: AssetManager.Bundle) => {
                    onComplete && onComplete(err ? null : bundle);
                });
            }
            return;
        }

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
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public loadBundleAsync(params: { bundle?: string, version?: string }): Promise<AssetManager.Bundle | null> {
        return new Promise((resolve) => {
            this.loadBundle({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 获取一个已经加载的bundle
     * @param bundle 默认为resources，如果是远程bundle，则使用url末位作为bundle名
     */
    public getBundle(bundle?: string) {
        if (!bundle) bundle = 'resources';
        return assetManager.getBundle(bundle);
    }

    /**
     * 移除一个已经加载的bundle
     * @param bundle 默认为resources，如果是远程bundle，则使用url末位作为bundle名
     */
    public removeBundle(bundle?: string) {
        if (!bundle) bundle = 'resources';
        const b = assetManager.getBundle(bundle);
        if (b) assetManager.removeBundle(b);
    }

    /**
     * 重载一个bundle(只重载资源列表)
     * - 只有远程bundle支持重载
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public reloadBundle({ bundle, version, onComplete }: { bundle?: string, version?: string, onComplete?: (bundle: AssetManager.Bundle | null) => any }) {
        if (!bundle) bundle = 'resources';

        let baseUrl = '';
        let configUrl = '';

        if (REGEX.test(bundle)) {
            baseUrl = bundle;
            const suffix = version ? `${version}.` : '';
            configUrl = `${baseUrl}config.${suffix}json`;
        }
        else {
            baseUrl = `${assetManager.downloader.remoteServerAddress}remote/${bundle}/`;
            const suffix = version ? `${version}.` : '';
            configUrl = `${baseUrl}config.${suffix}json`;
        }

        // 清除可能存在的config缓存
        assetManager.cacheManager?.removeCache(configUrl);
        assetManager.loadRemote(configUrl, (err: Error, data: JsonAsset) => {
            if (err) {
                this.error(`下载Bundle配置失败: ${configUrl}`);
                onComplete?.(null);
                return;
            }

            this.releaseAll(path.basename(bundle));
            this.removeBundle(path.basename(bundle));

            const ab = new AssetManager.Bundle();
            const config = data.json as any;
            config.base = baseUrl;
            ab.init(config);
            onComplete?.(ab);
        });
    }

    /**
     * 重载一个bundle(只重载资源列表)
     * - 只有远程bundle支持重载
     * @param params.bundle 默认为resources, 可以是项目中的bundle名，也可以是远程bundle的url(url末位作为bundle名)，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#%E5%8A%A0%E8%BD%BD-asset-bundle
     * @param params.version 远程bundle的版本，参考https://docs.cocos.com/creator/manual/zh/asset/bundle.html#asset-bundle-%E7%9A%84%E7%89%88%E6%9C%AC
     */
    public reloadBundleAsync(params: { bundle?: string, version?: string }): Promise<AssetManager.Bundle | null> {
        return new Promise((resolve) => {
            this.reloadBundle({
                ...params,
                onComplete: resolve
            });
        });
    }

    /**
     * 加载远程资源
     * @example
     * loadRemote({url:'', ext:'.png', onComplete:(result){ }})
     */
    public loadRemote({ url, ext, onComplete }: { url: string, ext?: string, onComplete?: (result: Asset | null) => void }) {
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
    public loadRemoteAsync(params: { url: string, ext?: string }): Promise<Asset | null> {
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
     * setFont({target:label, url:'http://img/a/font',ext:'.ttf', onComplete:(succ)=>{}})
     */
    public setFont(params: { target: Label, url: string, ext?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }): void;
    public setFont(params: { target: Label, path: string, bundle?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }): void;
    public setFont(params: { target: Label, path?: string, bundle?: string, url?: string, ext?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }) {
        if (params.url) {
            this.loadRemote({
                url: params.url,
                ext: params.ext,
                onComplete: (font: Font) => {
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
        } else {
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
     * setSprite({target:sprite, url:'http://img/a/avatar',ext:'.png', onComplete:(succ)=>{}})
     */
    public setSprite(params: { target: Sprite, url: string, ext?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }): void;
    public setSprite(params: { target: Sprite, path: string, bundle?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }): void;
    public setSprite(params: { target: Sprite, path?: string, bundle?: string, url?: string, ext?: string, onComplete?: (success: boolean) => any, onSuccess?: () => void, onFail?: () => void }) {
        if (params.url) {
            this.loadRemote({
                url: params.url,
                ext: params.ext,
                onComplete: (imageAsset: ImageAsset) => {
                    if (!imageAsset || !isValid(params.target)) {
                        params.onFail && params.onFail();
                        params.onComplete && params.onComplete(false);
                        return;
                    }
                    const spriteFrame = SpriteFrame.createWithImage(imageAsset);
                    params.target.spriteFrame = spriteFrame;
                    params.onSuccess && params.onSuccess();
                    params.onComplete && params.onComplete(true);
                }
            });
        } else {
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
}