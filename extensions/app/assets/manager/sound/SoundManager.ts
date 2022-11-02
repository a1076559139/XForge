import { AssetManager, AudioClip, Game, game, sys, _decorator } from 'cc';
import { IEffecName, IMusicName } from '../../../../../assets/app-builtin/app-admin/executor';
import BaseManager from '../../base/BaseManager';
import AudioEngine from './AudioEngine';
const { ccclass, property } = _decorator;

interface playMusic<T> { name: T, volum?: number, force?: boolean, onPlay?: Function, onError?: Function }
interface playEffect<T> { name: T, volum?: number, loop?: boolean, interval?: number, onPlay?: Function, onError?: Function, onEnded?: Function }

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
    static setting: {
        /**预加载 */
        preload?: (IMusicName | IEffecName)[],
        /**音乐静音缓存key名 */
        musicMuteCacheKey?: string,
        /**音效静音缓存key名 */
        effectMuteCacheKey?: string,
        /**默认播放的音乐名 */
        defaultMusicName?: IMusicName | '',
        /**默认音乐音量: 0-1 */
        defaultMusicVolum?: number
    } = {};

    private musicMuteCacheKey = 'musicMute';
    private effectMuteCacheKey = 'effectMute';

    private defaultMusicName = '';
    private defaultMusicVolum = 1;

    private audioCache = {};
    private effectInterval: { [key in string]: number } = {};
    private playingMusic = { id: -1, name: '', volum: 1 };

    protected init(finish: Function) {
        const setting = SoundManager.setting;

        if (setting.musicMuteCacheKey) this.musicMuteCacheKey = setting.musicMuteCacheKey;
        if (setting.effectMuteCacheKey) this.musicMuteCacheKey = setting.effectMuteCacheKey;
        if (setting.defaultMusicName) this.defaultMusicName = setting.defaultMusicName;
        if (typeof setting.defaultMusicVolum === 'number') this.defaultMusicVolum = setting.defaultMusicVolum;

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

        super.init(finish, { bundle: BundleName, preload: SoundManager.setting.preload });
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
     * 预加载
     * @param {(E|M) | { url: (E|M) }} soundPath sound路径
     * @param {(num:number,total:number)=>any} progress
     * @param {(result: any)=>any} complete
     * @example
     * load(soundPath, complete)
     * load(soundPath, progress, complete)
     */
    public load(soundPath: (E | M) | { path: (E | M), type: Function }): boolean;
    public load(soundPath: (E | M) | { path: (E | M), type: Function }, complete: (result: any) => any): boolean;
    public load(soundPath: (E | M) | { path: (E | M), type: Function }, progress: (finish: number, total: number, item: AssetManager.RequestItem) => void, complete: (result: any) => any): boolean;
    public load(soundPath: (E | M) | { path: (E | M), type: Function }, ...args: Function[]): boolean {
        const progress = (args[1] && args[0]) as (finish: number, total: number, item: AssetManager.RequestItem) => void;
        const complete = args[1] || args[0];

        if (!soundPath) {
            this.error(`load ${soundPath} fail`);
            complete && complete(null);
            return true;
        }

        // 兼容setting中传入{path:'', type:AudioClip}结构
        if (typeof soundPath !== 'string') {
            soundPath = soundPath.path;
        }

        if (soundPath.indexOf('effect') !== 0 && soundPath.indexOf('music') !== 0) {
            this.error(`load ${soundPath} fail`);
            complete && complete(null);
            return true;
        }

        // 判断有无缓存
        let audio = this.audioCache[soundPath as string];
        if (audio) {
            complete && complete(audio);
            return true;
        }

        super.load({ path: soundPath, type: AudioClip }, progress, (audioClip) => {
            if (audioClip) {
                this.audioCache[soundPath as string] = audioClip;
                complete && complete(audioClip);
            } else {
                complete && complete(null);
            }
        });

        return false;
    }

    /**
     * 释放声音资源
     * @param {*} soundPath 
     */
    public release(soundPath: E | M) {
        if (soundPath.indexOf('effect') !== 0 && soundPath.indexOf('music') !== 0) {
            this.error(`release ${soundPath} fail`);
            return;
        }

        delete this.audioCache[soundPath as string];
        super.release(soundPath, AudioClip);
    }

    /**
     * 播放默认音乐
     */
    public playDefaultMusic(onPlay?: Function) {
        if (this.defaultMusicName) {
            this.playMusic({ name: <M>this.defaultMusicName, volum: this.defaultMusicVolum, onPlay });
        } else {
            this.warn('defaultMusicName 不存在');
        }
    }

    /**
     * 
     * @param {Number} interval 多少秒内不会重复播放
     */
    public playEffect({ name, volum = 1, loop = false, interval = 0, onEnded, onPlay, onError }: playEffect<E> = { name: <E>'' }) {
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
                const id = AudioEngine.inst.playEffect(audioClip, volum, loop);

                if (onEnded) AudioEngine.inst.setEndedCallback(id, onEnded);

                if (interval) {
                    this.effectInterval[name] = Date.now() + interval * 1000;
                }

                onPlay && onPlay(id);
            } else {
                this.error(`playEffect ${name} 不存在或加载失败`);
                onError && onError();
            }
        });
    }

    public pauseEffect(id: number) {
        return AudioEngine.inst.pauseEffect(id);
    }

    public pauseAllEffects() {
        return AudioEngine.inst.pauseAllEffects();
    }

    public resumeEffect(id: number) {
        return AudioEngine.inst.resumeEffect(id);
    }

    public resumeAllEffects() {
        return AudioEngine.inst.resumeAllEffects();
    }

    public stopEffect(id: number) {
        return AudioEngine.inst.stopEffect(id);
    }

    public stopAllEffects() {
        return AudioEngine.inst.stopAllEffects();
    }

    public playMusic({ name, volum = 1, force = false, onPlay, onError }: playMusic<M> = { name: <M>'' }) {
        if (!name) return onError && onError(0);

        // 该音乐正在播放中
        if (!force && this.playingMusic.id !== -1 && this.playingMusic.name === name) {
            AudioEngine.inst.setMusicVolume(volum);
            return onPlay && onPlay();
        }

        // 先停止当前音乐
        this.stopMusic();

        // 记录要播放音乐的名字
        this.playingMusic.name = name;
        // 记录要播放音乐的音量
        this.playingMusic.volum = volum;

        // 静音
        if (this.isMusicMute) return onError && onError(2);

        // 加载音乐
        this.load(name, (audioClip) => {
            // 不合法
            if (this.playingMusic.id !== -1) return onError && onError(1);
            if (this.playingMusic.name !== name) return onError && onError(1);
            // 静音
            if (this.isMusicMute) return onError && onError();

            if (!audioClip) {
                this.error(`playMusic ${name} 不存在或加载失败`);
                onError && onError(0);
                return;
            }

            this.playingMusic.id = AudioEngine.inst.playMusic(audioClip, volum);

            onPlay && onPlay();
        });
    }

    public pauseMusic() {
        return AudioEngine.inst.pauseMusic();
    }

    public resumeMusic() {
        return AudioEngine.inst.resumeMusic();
    }

    public stopMusic() {
        this.playingMusic.volum = 1;
        this.playingMusic.name = '';
        this.playingMusic.id = -1;
        return AudioEngine.inst.stopMusic();
    }

    public setMusicMute(mute: boolean, isCache = false) {
        isCache && storage.set(this.musicMuteCacheKey, mute);
        const result = AudioEngine.inst.setMusicMute(mute);
        if (!result && this.playingMusic.name) {
            this.playMusic({
                name: this.playingMusic.name as any,
                volum: this.playingMusic.volum
            })
        }
    }

    public get isMusicMute() {
        return AudioEngine.inst.getMusicMute();
    }

    public setEffectMute(mute: boolean, isCache = false) {
        AudioEngine.inst.setAllEffectsMute(mute);
        isCache && storage.set(this.effectMuteCacheKey, mute);
    }

    public get isEffectMute() {
        return AudioEngine.inst.getAllEffectsMute();
    }
}