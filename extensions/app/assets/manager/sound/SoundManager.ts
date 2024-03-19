import { AssetManager, AudioClip, Game, _decorator, game, sys } from 'cc';
import { IEffectName, IMusicName } from '../../../../../assets/app-builtin/app-admin/executor';
import Core from '../../Core';
import BaseManager from '../../base/BaseManager';
import AudioEngine from './AudioEngine';
const { ccclass } = _decorator;

interface playMusic<T> { name: T, volume?: number, force?: boolean, onPlay?: Function, onError?: Function }
interface playEffect<T> { name: T, volume?: number, loop?: boolean, interval?: number, onPlay?: (audioID: number) => any, onError?: Function, onEnded?: Function }

const storage = {
    set(key: string, value: any) {
        sys.localStorage.setItem(key, JSON.stringify(value));
    },
    get(key: string) {
        const data = sys.localStorage.getItem(key);

        if (data && typeof data === 'string') {
            return JSON.parse(data);
        }

        return undefined;
    }
};

const BundleName = 'app-sound';

@ccclass('SoundManager')
export default class SoundManager<E extends string, M extends string> extends BaseManager {
    /**静态设置 */
    static setting: {
        /**预加载 */
        preload?: (IMusicName | IEffectName)[],
        /**音乐静音缓存key名 */
        musicMuteCacheKey?: string,
        /**音效静音缓存key名 */
        effectMuteCacheKey?: string,
        /**默认播放的音乐名 */
        defaultMusicName?: IMusicName | '',
        /**默认音乐音量 */
        defaultMusicVolume?: number,
        /**默认按钮音效名 */
        defaultEffectName?: IEffectName | '',
        /**默认按钮音效音量 */
        defaultEffectVolume?: number
    } = {};

    private musicMuteCacheKey = 'musicMute';
    private effectMuteCacheKey = 'effectMute';

    private defaultMusicName = '';
    private defaultMusicVolume = 1;
    private defaultEffectName = '';
    private defaultEffectVolume = 1;

    private audioCache = {};
    private effectInterval: { [key in string]: number } = {};
    private playingMusic = { uuid: '', id: -1, name: '', volume: 1, playing: false, paused: false };

    protected init(finish: Function) {
        const setting = SoundManager.setting;

        if (setting.musicMuteCacheKey) this.musicMuteCacheKey = setting.musicMuteCacheKey;
        if (setting.effectMuteCacheKey) this.musicMuteCacheKey = setting.effectMuteCacheKey;
        if (setting.defaultMusicName) this.defaultMusicName = setting.defaultMusicName;
        if (typeof setting.defaultMusicVolume === 'number') this.defaultMusicVolume = setting.defaultMusicVolume;
        if (setting.defaultEffectName) this.defaultEffectName = setting.defaultEffectName;
        if (typeof setting.defaultEffectVolume === 'number') this.defaultEffectVolume = setting.defaultEffectVolume;

        if (this.musicMuteCacheKey) {
            const musicMute = storage.get(this.musicMuteCacheKey) === true;
            AudioEngine.inst.setMusicMute(musicMute);
        } else {
            this.warn('musicMuteCacheKey不能为空');
        }
        if (this.effectMuteCacheKey) {
            const effectMute = storage.get(this.effectMuteCacheKey) === true;
            AudioEngine.inst.setAllEffectsMute(effectMute);
        } else {
            this.warn('effectMuteCacheKey不能为空');
        }

        super.init(finish);

        // 预加载
        setting.preload?.forEach((path: string) => {
            Core.inst.manager.loader.preload({
                bundle: BundleName,
                type: AudioClip,
                path: path
            });
        });
    }

    protected onLoad() {
        game.on(Game.EVENT_HIDE, function () {
            AudioEngine.inst.pauseAll();
        });
        game.on(Game.EVENT_SHOW, function () {
            AudioEngine.inst.resumeAll();
        });
    }

    /**
     * 预加载声音资源
     * @param soundPath sound路径
     */
    public preload(soundPath: (E | M)) {
        if (!soundPath) {
            this.error('[preload]', 'fail');
            return;
        }

        if (soundPath.indexOf('effect') !== 0 && soundPath.indexOf('music') !== 0) {
            this.error('[preload]', 'fail', soundPath);
            return;
        }

        // 判断有无缓存
        const audio = this.audioCache[soundPath as string];
        if (audio) {
            return;
        }

        // 远程加载
        Core.inst.manager.loader.preload({
            bundle: BundleName,
            path: soundPath,
            type: AudioClip
        });
    }

    /**
     * 加载声音资源
     * @param soundPath sound路径
     * @param progress 加载进度回调
     * @param complete 加载完成回调
     */
    public load(soundPath: (E | M)): void;
    public load(soundPath: (E | M), complete: (result: any) => any): void;
    public load(soundPath: (E | M), progress: (finish: number, total: number, item: AssetManager.RequestItem) => void, complete: (result: any) => any): void;
    public load(soundPath: (E | M), ...args: Function[]): void {
        const progress = (args[1] && args[0]) as (finish: number, total: number, item: AssetManager.RequestItem) => void;
        const complete = args[1] || args[0];

        if (!soundPath) {
            this.error('[load]', 'fail');
            complete && setTimeout(() => complete(null));
            return;
        }

        if (soundPath.indexOf('effect') !== 0 && soundPath.indexOf('music') !== 0) {
            this.error('[load]', 'fail', soundPath);
            complete && setTimeout(() => complete(null));
            return;
        }

        // 判断有无缓存
        const audio = this.audioCache[soundPath as string];
        if (audio) {
            complete && setTimeout(() => complete(audio));
            return;
        }

        // 远程加载
        Core.inst.manager.loader.load({
            bundle: BundleName,
            path: soundPath,
            type: AudioClip,
            onProgress: progress,
            onComplete: (audioClip) => {
                if (audioClip) {
                    this.audioCache[soundPath as string] = audioClip;
                    complete && complete(audioClip);
                } else {
                    complete && complete(null);
                }
            }
        });
    }

    /**
     * 释放声音资源
     * @param soundPath 声音路径
     */
    public release(soundPath: E | M) {
        if (soundPath.indexOf('effect') !== 0 && soundPath.indexOf('music') !== 0) {
            this.error(`release ${soundPath} fail`);
            return;
        }

        delete this.audioCache[soundPath as string];
        Core.inst.manager.loader.release({ bundle: BundleName, path: soundPath, type: AudioClip });
    }

    /**
     * 播放默认音乐
     */
    public playDefaultMusic(onPlay?: Function) {
        if (this.defaultMusicName) {
            this.playMusic({ name: <M>this.defaultMusicName, volume: this.defaultMusicVolume, onPlay });
        } else {
            this.warn('defaultMusicName 不存在');
        }
    }

    /**
     * 播放默认音效
     */
    public playDefaultEffect(onPlay?: (audioID: number) => void) {
        if (this.defaultEffectName) {
            this.playEffect({ name: <E>this.defaultEffectName, volume: this.defaultEffectVolume, onPlay });
        } else {
            this.warn('defaultEffectName 不存在');
        }
    }

    /**
     * 播放音效
     * @param name 音效
     * @param loop 循环播放
     * @param volume 音量
     * @param interval 多少秒内不会重复播放
     */
    public playEffect({ name, volume = 1, loop = false, interval = 0, onEnded, onPlay, onError }: playEffect<E> = { name: <E>'' }) {
        // 静音不允许播放
        if (this.isEffectMute) return;
        // 正在播放中，不允许重复播放
        if (this.effectInterval[name] && Date.now() < this.effectInterval[name]) return;

        // 加载音乐
        this.load(name, (audioClip) => {
            // 静音不允许播放
            if (this.isEffectMute) return;
            // 正在播放中，不允许重复播放
            if (this.effectInterval[name] && Date.now() < this.effectInterval[name]) return;

            if (audioClip) {
                AudioEngine.inst.playEffect(audioClip, volume, loop, onPlay, onEnded);

                if (interval > 0) {
                    this.effectInterval[name] = Date.now() + interval * 1000;
                }
            } else {
                this.error(`playEffect ${name} 不存在或加载失败`);
                onError && onError();
            }
        });
    }

    /**
     * 暂停音效
     * @param id 
     * @returns 
     */
    public pauseEffect(id: number) {
        return AudioEngine.inst.pauseEffect(id);
    }

    /**
     * 暂停所有音效
     * @returns 
     */
    public pauseAllEffects() {
        return AudioEngine.inst.pauseAllEffects();
    }

    /**
     * 恢复音效
     * @param id 
     * @returns 
     */
    public resumeEffect(id: number) {
        return AudioEngine.inst.resumeEffect(id);
    }

    /**
     * 恢复所有音效
     * @returns 
     */
    public resumeAllEffects() {
        return AudioEngine.inst.resumeAllEffects();
    }

    /**
     * 停止音效
     * @param id 
     * @returns 
     */
    public stopEffect(id: number) {
        return AudioEngine.inst.stopEffect(id);
    }

    /**
     * 停止所有音效
     * @returns 
     */
    public stopAllEffects() {
        return AudioEngine.inst.stopAllEffects();
    }

    /**
     * 播放音乐
     * @param volume 音量
     * @param force 是否强制重新播放
     */
    public playMusic({ name, volume = 1, force = false, onPlay, onError }: playMusic<M> = { name: <M>'' }) {
        if (!name) return onError && onError();

        // 该音乐正在播放中
        if (!force && this.playingMusic.id !== -1 && this.playingMusic.name === name) {
            AudioEngine.inst.setMusicVolume(volume);
            return onPlay && onPlay();
        }

        // 先停止当前音乐
        this.stopMusic();

        // 播放操作uuid
        const uuid = this.createUUID();
        this.playingMusic.uuid = uuid;
        // 记录要播放音乐的名字
        this.playingMusic.name = name;
        // 记录要播放音乐的音量
        this.playingMusic.volume = volume;
        // 记录音乐状态
        this.playingMusic.playing = true;
        this.playingMusic.paused = false;

        // 静音
        if (this.isMusicMute) return onPlay && onPlay();

        // 加载音乐
        this.load(name, (audioClip) => {
            // 不合法
            if (this.playingMusic.id !== -1) return onError && onError();
            if (this.playingMusic.name !== name) return onError && onError();
            if (this.playingMusic.uuid !== this.playingMusic.uuid) return onError && onError();
            // 静音
            if (this.isMusicMute) return onPlay && onPlay();

            if (!audioClip) {
                this.error(`playMusic ${name} 不存在或加载失败`);
                onError && onError();
                return;
            }

            this.playingMusic.id = AudioEngine.inst.playMusic(audioClip, volume, onPlay);
        });
    }

    /**
     * 重新播放音乐
     */
    public replayMusic(onPlay?: Function) {
        if (!this.playingMusic.playing) return;
        if (!this.playingMusic.name) return;
        this.playMusic({
            name: this.playingMusic.name as any,
            volume: this.playingMusic.volume,
            force: true,
            onPlay
        });
    }

    /**
     * 暂停音乐
     */
    public pauseMusic() {
        if (!this.playingMusic.playing) return false;
        this.playingMusic.paused = true;
        return AudioEngine.inst.pauseMusic();
    }

    /**
     * 恢复音乐
     */
    public resumeMusic() {
        if (!this.playingMusic.playing) return false;
        this.playingMusic.paused = false;
        return AudioEngine.inst.resumeMusic();
    }

    /**
     * 停止音乐
     */
    public stopMusic() {
        this.playingMusic.playing = false;
        this.playingMusic.paused = false;
        this.playingMusic.volume = 1;
        this.playingMusic.name = '';
        this.playingMusic.uuid = '';
        this.playingMusic.id = -1;
        return AudioEngine.inst.stopMusic();
    }

    /**
     * 设置音乐静音
     * @param mute 是否静音
     * @param isCache 静音状态是否写入缓存(通过localstorage)
     */
    public setMusicMute(mute: boolean, isCache = false) {
        isCache && storage.set(this.musicMuteCacheKey, mute);
        AudioEngine.inst.setMusicMute(mute);
        if (!mute && this.playingMusic.name) {
            this.playMusic({
                name: this.playingMusic.name as any,
                volume: this.playingMusic.volume
            });
        }
    }

    get isMusicPlaying() {
        return this.playingMusic.playing;
    }

    get isMusicPaused() {
        return this.playingMusic.paused;
    }

    public get isMusicMute() {
        return AudioEngine.inst.getMusicMute();
    }

    /**
     * 设置音效静音
     * @param mute 是否静音
     * @param isCache 静音状态是否写入缓存(通过localstorage)
     */
    public setEffectMute(mute: boolean, isCache = false) {
        AudioEngine.inst.setAllEffectsMute(mute);
        isCache && storage.set(this.effectMuteCacheKey, mute);
    }

    public get isEffectMute() {
        return AudioEngine.inst.getAllEffectsMute();
    }
}