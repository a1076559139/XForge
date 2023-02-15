import { Asset, AssetManager, assetManager, _decorator } from 'cc';
import BaseManager from '../../base/BaseManager';
const { ccclass } = _decorator;

@ccclass('LoaderManager')
export default class LoaderManager extends BaseManager {

    private handle(handle: string, { bundle, path, type, onProgress, onComplete }: { bundle: string, path: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (result: any) => void }) {
        if (!handle) {
            this.error('handle is empty');
            return onComplete && onComplete(null);
        }
        if (!bundle) {
            this.error(`${handle} fail. bundle is empty`);
            return onComplete && onComplete(null);
        }
        if (!path) {
            this.error(`${handle} fail. path is empty`);
            return onComplete && onComplete(null);
        }

        const args: any[] = [path];
        if (type) args.push(type);
        if (onProgress) args.push(onProgress);
        args.push((err: string, res: any) => {
            if (err) {
                this.error(`${handle} "${path}" fail`);
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
     */
    public preload(params: { bundle: string, path: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: AssetManager.RequestItem[]) => void }) {
        this.handle('preload', params);
    }

    /**
     * 预加载
     */
    public preloadDir(params: { bundle: string, path: string, type?: typeof Asset, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (items: AssetManager.RequestItem[]) => void }) {
        this.handle('preloadDir', params);
    }

    /**
     * 加载一个bundle下的资源
     */
    public load<T extends typeof Asset>(params: { bundle: string, path: string, type?: T, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete?: (result: InstanceType<T>) => void }) {
        this.handle('load', params);
    }

    /**
     * 销毁一个bundle中对应path和type的资源
     */
    public release({ path, bundle, type }: { path: string, bundle: string, type?: typeof Asset }) {
        if (!bundle) return this.error('release fail. bundle is empty');
        assetManager.getBundle(bundle)?.release(path, type);
    }

    /**
     * 销毁一个bundle中所有的资源
     */
    public releaseAll(bundle: string) {
        if (!bundle) return this.error('releaseAll fail. bundle is empty');
        assetManager.getBundle(bundle)?.releaseAll();
    }

    /**
     * 销毁一个bundle中未使用的资源
     * @param {*} res
     */
    public releaseUnused(bundle: string) {
        if (!bundle) return this.error('releaseUnused fail. bundle is empty');
        assetManager.getBundle(bundle)?.releaseUnusedAssets();
    }

    /**
     * 加载一个bundle
     */
    public loadBundle({ bundle, onComplete }: { bundle: string, onComplete?: (bundle: AssetManager.Bundle) => any }) {
        if (!bundle) {
            this.error('loadBundle fail. bundle is empty');
            return onComplete && onComplete(null);
        }

        assetManager.loadBundle(bundle, (err: string, bundle: AssetManager.Bundle) => {
            onComplete && onComplete(err ? null : bundle);
        });
    }

    /**
     * 获取一个已经加载的bundle
     */
    public getBundle(bundle: string) {
        if (!bundle) {
            this.error('getBundle fail. bundle is empty');
            return null;
        }

        return assetManager.getBundle(bundle);
    }

    /**
     * 移除一个已经加载的bundle
     */
    public removeBundle(bundle: string) {
        if (!bundle) return this.error('releaseUnused fail. bundle is empty');
        const b = assetManager.getBundle(bundle);
        if (b) assetManager.removeBundle(b);
    }
}
