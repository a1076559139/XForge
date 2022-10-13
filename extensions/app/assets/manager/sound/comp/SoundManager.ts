import { AssetManager, AudioClip, AudioSource, sys, _decorator } from 'cc';
import { IEffecName, IMusicName } from '../../../../../../assets/app/executor';
import BaseManager from '../../../base/BaseManager';
const { ccclass, property } = _decorator;

interface playMusic<T> { name: T, volum?: number, fadeTime?: number, onPlay?: Function, onError?: Function }
interface playEffect<T> { name: T, volum?: number, loop?: boolean, interval?: number, onPlay?: Function, onError?: Function, onFinish?: Function }

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

const Bundle = 'app-sound';

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
    private musicMute = false;
    private effectMute = false;
    private playingEffect = {};
    private playingMusic = { id: -1, name: '', volum: 0 };

    protected onLoad() { }

    protected init(finish: Function) {
        const setting = SoundManager.setting;

        if (setting.musicMuteCacheKey) this.musicMuteCacheKey = setting.musicMuteCacheKey;
        if (setting.effectMuteCacheKey) this.musicMuteCacheKey = setting.effectMuteCacheKey;
        if (setting.defaultMusicName) this.defaultMusicName = setting.defaultMusicName;
        if (typeof setting.defaultMusicVolum === 'number') this.defaultMusicVolum = setting.defaultMusicVolum;

        if (this.musicMuteCacheKey) {
            this.musicMute = storage.get(this.musicMuteCacheKey) === true;
        } else {
            this.warn('musicMuteCacheKey不能为空');
        }
        if (this.effectMuteCacheKey) {
            this.effectMute = storage.get(this.effectMuteCacheKey) === true;
        } else {
            this.warn('effectMuteCacheKey不能为空');
        }

        super.init(finish, { bundle: Bundle, preload: SoundManager.setting.preload });
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
    public playEffect({ name, volum = 1, loop = false, interval = 0, onFinish, onPlay, onError }: playEffect<E> = { name: <E>'' }) {
        if (this.effectMute) {
            return -1;
        }

        // 加载音乐
        this.load(name, (audioClip) => {
            // 正在播放中，不允许重复播放
            if (this.playingEffect[<string>name] >= 0) {
                return this.playingEffect[<string>name];
            }

            if (audioClip) {
                const id = cc.audioEngine.play(audioClip, loop, volum * cc.audioEngine.getMusicVolume());
                onPlay && onPlay(id);
                onFinish && cc.audioEngine.setFinishCallback(id, function () { onFinish(id); });

                if (interval) {
                    this.playingEffect[<string>name] = id;
                    this.scheduleOnce(function () {
                        delete this.playingEffect[name];
                    }, interval);
                }
            } else {
                this.error(`playEffect ${name} 不存在或加载失败`);
                onError && onError();
            }
        });
    }

    public stopEffect({ id = -1 } = {}) {
        return cc.audioEngine.stop(id);
    }

    private fadeInMusicCount = 0;
    private fadeInMusicCountMax = 0;
    private fadeIntMusic() {
        const volum = Math.min(++this.fadeInMusicCount / this.fadeInMusicCountMax, 1) * this.playingMusic.volum;
        cc.audioEngine.setVolume(this.playingMusic.id, volum * cc.audioEngine.getMusicVolume());
    }
    public playMusic({ name, volum = 1, fadeTime = 0, onPlay, onError }: playMusic<M> = { name: <M>'' }) {
        if (!name) return -1;

        // 该音乐正在播放，直接返回ID
        if (this.playingMusic.id !== -1 && this.playingMusic.name === name) {
            return this.playingMusic.id;
        }

        // 先停止当前音乐
        this.stopMusic();

        // 记录当前播放的音乐音乐
        this.playingMusic.name = name;
        this.playingMusic.volum = volum;

        if (this.musicMute) return -1;

        // 加载音乐
        this.load(name, (audioClip: AudioClip) => {
            if (this.playingMusic.id === -1 && this.playingMusic.name === name) {
                if (audioClip) {
                    if (fadeTime > 0) {
                        this.fadeInMusicCount = 0;
                        this.fadeInMusicCountMax = Math.round(fadeTime / 0.1);
                        const audioSource = this.node.addComponent(AudioSource);
                        audioSource.clip = audioClip;
                        audioSource.loop = true;
                        audioSource.play();
                        // audioSource.volume = 

                        this.playingMusic.id = cc.audioEngine.playMusic(audioClip, true);
                        cc.audioEngine.setVolume(this.playingMusic.id, 0);
                        this.schedule(this.fadeIntMusic, 0.1, this.fadeInMusicCountMax - 1);
                    } else {
                        this.playingMusic.id = cc.audioEngine.playMusic(audioClip, true);
                        cc.audioEngine.setVolume(this.playingMusic.id, volum * cc.audioEngine.getMusicVolume());
                    }
                    onPlay && onPlay(this.playingMusic.id);
                } else {
                    this.error(`playMusic ${name} 不存在或加载失败`);
                    onError && onError();
                }
            }
        });
    }

    private fadeOutMusicID = -1;
    private fadeOutMusicVolum = 0;
    private fadeOutMusicCount = 0;
    private fadeOutMusicCountMax = 0;
    private fadeOutMusic() {
        if (++this.fadeOutMusicCount === this.fadeOutMusicCountMax) {
            cc.audioEngine.stop(this.fadeOutMusicID);
            this.fadeOutMusicID = 0;
        } else {
            const volum = this.fadeOutMusicVolum - Math.min(this.fadeOutMusicCount / this.fadeOutMusicCountMax, 1) * this.fadeOutMusicVolum;
            cc.audioEngine.setVolume(this.fadeOutMusicID, Math.max(volum, 0));
        }
    }
    public stopMusic(fadeTime = 0) {
        if (this.playingMusic.id !== -1) {
            // 停止渐进定时器
            this.unschedule(this.fadeIntMusic);
            if (fadeTime > 0) {
                this.fadeOutMusicCount = 0;
                this.fadeOutMusicCountMax = Math.round(fadeTime / 0.1);
                this.fadeOutMusicID = this.playingMusic.id;
                this.fadeOutMusicVolum = cc.audioEngine.getVolume(this.playingMusic.id);
                this.schedule(this.fadeOutMusic, 0.1, this.fadeOutMusicCountMax - 1);
            } else {
                cc.audioEngine.stop(this.playingMusic.id);
            }
            this.playingMusic.id = -1;
        } else if (this.fadeOutMusicID !== -1) {
            this.unschedule(this.fadeOutMusic);
            cc.audioEngine.stop(this.fadeOutMusicID);
            this.fadeOutMusicID = 0;
        }
    }

    public setMusicMute(boo, isCache = true) {
        if (this.musicMute !== !!boo) {
            this.musicMute = !!boo;
            isCache && storage.set(this.musicMuteCacheKey, this.musicMute);
            boo ? this.stopMusic() : this.playMusic({ name: <M>this.playingMusic.name, volum: this.playingMusic.volum });
        }
    }

    public get isMusicMute() {
        return this.musicMute;
    }

    public setEffectMute(boo, isCache = true) {
        if (this.effectMute !== !!boo) {
            this.effectMute = !!boo;
            isCache && storage.set(this.effectMuteCacheKey, this.effectMute);
        }
    }

    public get isEffectMute() {
        return this.effectMute;
    }
}