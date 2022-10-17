import { AudioClip } from "cc";
import Audio from "./Audio";
import AudioManager from "./AudioManager";

export default class AudioEngine {
    private static _inst: AudioEngine = null;
    static get inst() {
        if (!this._inst) this._inst = new AudioEngine();
        return this._inst;
    }
    private constructor() { }

    /**effect的id从1开始，music的id始终为0 */
    private audioID = 1;
    private callbackMap: Map<number, Function> = new Map();
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
    playEffect(audioClip: AudioClip, volum = 1, loop = false) {
        if (this.audioID > 100000) this.audioID = 1;

        const audioID = this.audioID++;
        const audio = AudioManager.inst.getAudio();
        this.effectMap.set(audioID, audio);

        audio.setLoop(loop)
            .setMute(this.effectMute)
            .setVolume(volum, this.effectVolumeScale)
            .play(audioClip, () => {
                AudioManager.inst.putAudio(audio);
                this.effectMap.delete(audioID);
                const callback = this.callbackMap.get(audioID);
                if (callback) {
                    this.callbackMap.delete(audioID);
                    callback();
                }
            });

        return audioID;
    }

    stopEffect(id: number) {
        return !!this.effectMap.get(id)?.stop();
    }

    stopAllEffects() {
        this.effectMap.forEach((audio) => {
            audio.stop();
        })
    }

    pauseEffect(id: number) {
        return !!this.effectMap.get(id)?.pause();
    }

    pauseAllEffects() {
        this.effectMap.forEach((audio) => {
            audio.pause();
        })
    }

    resumeEffect(id: number) {
        return !!this.effectMap.get(id)?.resume();
    }

    resumeAllEffects() {
        this.effectMap.forEach((audio) => {
            audio.resume();
        })
    }

    setEffectMute(id: number, mute: boolean) {
        return !!this.effectMap.get(id)?.setMute(mute);
    }

    setAllEffectsMute(mute: boolean) {
        this.effectMute = mute;
        this.effectMap.forEach((audio) => {
            audio.setMute(mute);
        })
    }

    getEffectMute(id: number) {
        return !!this.effectMap.get(id)?.getMute();
    }

    getAllEffectsMute() {
        return this.effectMute;
    }

    setEffectVolum(id: number, volum: number) {
        return !!this.effectMap.get(id)?.setVolume(volum);
    }

    setAllEffectsVolum(volum: number) {
        this.effectVolume = volum
        this.effectMap.forEach((audio) => {
            audio.setVolume(volum);
        })
    }

    getEffectVolum(id: number) {
        return this.effectMap.get(id)?.getVolume() || 0;
    }

    getAllEffectsVolum() {
        return this.effectVolume;
    }

    setEffectVolumScale(id: number, volum: number) {
        return !!this.effectMap.get(id)?.setVolumeScale(volum);
    }

    setAllEffectsVolumScale(scale: number) {
        this.effectVolumeScale = scale
        this.effectMap.forEach((audio) => {
            audio.setVolumeScale(scale);
        })
    }

    getEffectVolumScale(id: number) {
        return this.effectMap.get(id)?.getVolumeScale() || 0;
    }

    getAllEffectsVolumScale() {
        return this.effectVolumeScale;
    }

    ////////////////////////////////
    // 音乐                        //
    ////////////////////////////////
    playMusic(audioClip: AudioClip, volum = 1) {
        if (!this.music) this.music = AudioManager.inst.getAudio();

        this.music
            .setLoop(true)
            .setVolume(volum)
            .play(audioClip);

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
                this.callbackMap.set(audioID, callback);
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
            return this.setEffectVolum(audioID, volume);
        }
    }

    getVolume(audioID: number) {
        if (audioID === 0) {
            return this.getMusicVolume();
        } else {
            return this.getEffectVolum(audioID);
        }
    }

    setVolumeScale(audioID: number, scale: number) {
        if (audioID === 0) {
            return this.setMusicVolumeScale(scale);
        } else {
            return this.setEffectVolumScale(audioID, scale);
        }
    }

    getVolumeScale(audioID: number) {
        if (audioID === 0) {
            return this.getMusicVolumeScale();
        } else {
            return this.getEffectVolumScale(audioID);
        }
    }
}