import { AudioClip } from 'cc';
import Audio from './Audio';
import AudioManager from './AudioManager';

export default class AudioEngine {
    private static _inst: AudioEngine = null;
    static get inst() {
        if (!this._inst) this._inst = new AudioEngine();
        return this._inst;
    }
    private constructor() { }

    /**effect的id从1开始，music的id始终为0 */
    private audioID = 1;
    private endedCallbackMap: Map<number, Function> = new Map();
    private effectMap: Map<number, Audio> = new Map();
    private music: Audio = null;

    private musicMute = false;
    private effectMute = false;
    private musicVolume = 1;
    private musicVolumeScale = 1;
    private effectVolume = 1;
    private effectVolumeScale = 1;

    ////////////////////////////////
    // 音效                        //
    ////////////////////////////////
    playEffect(audioClip: AudioClip, volume = 1, loop = false, onStarted: (audioID: number) => any = null, onEnded: Function = null) {
        if (this.audioID > 100000) this.audioID = 1;

        const audioID = this.audioID++;
        const audio = AudioManager.inst.getAudio();
        this.effectMap.set(audioID, audio);
        if (onEnded) this.endedCallbackMap.set(audioID, onEnded);

        audio.setLoop(loop)
            .setMute(this.effectMute)
            .setVolume(volume, this.effectVolumeScale)
            .play(audioClip, () => {
                AudioManager.inst.putAudio(audio);
                this.effectMap.delete(audioID);
                const callback = this.endedCallbackMap.get(audioID);
                if (callback) {
                    this.endedCallbackMap.delete(audioID);
                    callback();
                }
            }, () => {
                onStarted && onStarted(audioID);
            });

        return audioID;
    }

    stopEffect(id: number) {
        return !!this.effectMap.get(id)?.stop();
    }

    stopAllEffects() {
        this.effectMap.forEach((audio) => {
            audio.stop();
        });
    }

    pauseEffect(id: number) {
        return !!this.effectMap.get(id)?.pause();
    }

    pauseAllEffects() {
        this.effectMap.forEach((audio) => {
            audio.pause();
        });
    }

    resumeEffect(id: number) {
        return !!this.effectMap.get(id)?.resume();
    }

    resumeAllEffects() {
        this.effectMap.forEach((audio) => {
            audio.resume();
        });
    }

    setEffectMute(id: number, mute: boolean) {
        return !!this.effectMap.get(id)?.setMute(mute);
    }

    setAllEffectsMute(mute: boolean) {
        this.effectMute = mute;
        this.effectMap.forEach((audio) => {
            audio.setMute(mute);
        });
    }

    getEffectMute(id: number) {
        return !!this.effectMap.get(id)?.getMute();
    }

    getAllEffectsMute() {
        return this.effectMute;
    }

    setEffectVolume(id: number, volume: number) {
        return !!this.effectMap.get(id)?.setVolume(volume);
    }

    setAllEffectsVolume(volume: number) {
        this.effectVolume = volume;
        this.effectMap.forEach((audio) => {
            audio.setVolume(volume);
        });
    }

    getEffectVolume(id: number) {
        return this.effectMap.get(id)?.getVolume() || 0;
    }

    getAllEffectsVolume() {
        return this.effectVolume;
    }

    setEffectVolumeScale(id: number, volume: number) {
        return !!this.effectMap.get(id)?.setVolumeScale(volume);
    }

    setAllEffectsVolumeScale(scale: number) {
        this.effectVolumeScale = scale;
        this.effectMap.forEach((audio) => {
            audio.setVolumeScale(scale);
        });
    }

    getEffectVolumeScale(id: number) {
        return this.effectMap.get(id)?.getVolumeScale() || 0;
    }

    getAllEffectsVolumeScale() {
        return this.effectVolumeScale;
    }

    ////////////////////////////////
    // 音乐                        //
    ////////////////////////////////
    playMusic(audioClip: AudioClip, volume = 1, onStarted: Function = null) {
        if (this.music) {
            this.music.destroy();
        }
        this.music = AudioManager.inst.getAudio();
        this.music
            .setLoop(true)
            .setVolume(volume)
            .play(audioClip, null, onStarted);

        return 0;
    }

    stopMusic() {
        return !!this.music?.stop();
    }

    pauseMusic() {
        return !!this.music?.pause();
    }

    resumeMusic() {
        return !!this.music?.resume();
    }

    setMusicMute(mute: boolean) {
        this.musicMute = mute;
        return !!this.music?.setMute(mute);
    }

    getMusicMute() {
        return this.musicMute;
    }

    setMusicVolume(volume: number) {
        this.musicVolume = volume;
        return !!this.music?.setVolume(volume);
    }

    getMusicVolume() {
        return this.musicVolume;
    }

    setMusicVolumeScale(scale: number) {
        this.musicVolumeScale = scale;
        return !!this.music?.setVolumeScale(scale);
    }

    getMusicVolumeScale() {
        return this.musicVolumeScale;
    }

    ////////////////////////////////
    // 通用                        //
    ////////////////////////////////
    setEndedCallback(audioID: number, callback: Function) {
        if (audioID === 0) {
            return !!this.music?.onEnded(callback);
        } else {
            if (this.effectMap.has(audioID)) {
                this.endedCallbackMap.set(audioID, callback);
                return true;
            }
            return false;
        }
    }

    stop(audioID: number) {
        if (audioID === 0) {
            return this.stopMusic();
        } else {
            return this.stopEffect(audioID);
        }
    }

    pause(audioID: number) {
        if (audioID === 0) {
            return this.pauseMusic();
        } else {
            return this.pauseEffect(audioID);
        }
    }

    resume(audioID: number) {
        if (audioID === 0) {
            return this.resumeMusic();
        } else {
            return this.resumeEffect(audioID);
        }
    }

    pauseAll() {
        this.pauseMusic();
        this.pauseAllEffects();
    }

    resumeAll() {
        this.resumeMusic();
        this.resumeAllEffects();
    }

    stopAll() {
        this.stopMusic();
        this.stopAllEffects();
    }

    setVolume(audioID: number, volume: number) {
        if (audioID === 0) {
            return this.setMusicVolume(volume);
        } else {
            return this.setEffectVolume(audioID, volume);
        }
    }

    getVolume(audioID: number) {
        if (audioID === 0) {
            return this.getMusicVolume();
        } else {
            return this.getEffectVolume(audioID);
        }
    }

    setVolumeScale(audioID: number, scale: number) {
        if (audioID === 0) {
            return this.setMusicVolumeScale(scale);
        } else {
            return this.setEffectVolumeScale(audioID, scale);
        }
    }

    getVolumeScale(audioID: number) {
        if (audioID === 0) {
            return this.getMusicVolumeScale();
        } else {
            return this.getEffectVolumeScale(audioID);
        }
    }
}