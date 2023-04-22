import { AudioClip, AudioSource, Node } from 'cc';

export default class Audio {
    private volume = 1;
    private volumeScale = 1;
    private mute = false;
    private endedCallback: Function = null;
    private startedCallback: Function = null;

    private audioSource: AudioSource = null;
    constructor() {
        const node = new Node('audio');
        this.audioSource = node.addComponent(AudioSource);
        node.on(AudioSource.EventType.ENDED, this.onAudioEnded, this);
        node.on(AudioSource.EventType.STARTED, this.onAudioStarted, this);
    }

    private onAudioEnded() {
        if (this.endedCallback) {
            const endedCallback = this.endedCallback;
            this.endedCallback = null;
            endedCallback();
        }
    }

    private onAudioStarted() {
        if (this.startedCallback) {
            const startedCallback = this.startedCallback;
            this.startedCallback = null;
            startedCallback();
        }
    }

    play(clip: AudioClip, onEnded: Function = null, onStarted: Function = null) {
        this.audioSource.clip = clip;
        this.endedCallback = onEnded;
        this.startedCallback = onStarted;
        this.audioSource.play();
        return this;
    }

    stop() {
        this.audioSource.stop();
        this.audioSource.node.emit(AudioSource.EventType.ENDED);
        return this;
    }

    pause() {
        this.audioSource.pause();
        return this;
    }

    resume() {
        this.audioSource.play();
        return this;
    }

    setVolume(volume = 1, scale?: number) {
        this.volume = volume;
        if (typeof scale === 'number') this.volumeScale = scale;
        this.audioSource.volume = volume * this.volumeScale * (this.mute ? 0 : 1);
        return this;
    }

    getVolume() {
        return this.volume;
    }

    setVolumeScale(scale = 1) {
        this.volumeScale = scale;
        this.audioSource.volume = this.volume * scale * (this.mute ? 0 : 1);
        return this;
    }

    getVolumeScale() {
        return this.volumeScale;
    }

    setLoop(loop: boolean) {
        this.audioSource.loop = loop;
        return this;
    }

    getLoop() {
        return this.audioSource.loop;
    }

    setMute(mute = true) {
        this.mute = mute;
        this.setVolume(this.volume);
        return this;
    }

    getMute() {
        return this.mute;
    }

    onEnded(endedCallback: Function) {
        this.endedCallback = endedCallback;
        return this;
    }

    clear() {
        this.volume = 1;
        this.volumeScale = 1;
        this.mute = false;
        this.endedCallback = null;
        this.startedCallback = null;
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource.volume = 1;
            this.audioSource.clip = null;
            this.audioSource.loop = false;
        }
        return this;
    }

    destroy() {
        this.clear();
        this.audioSource.destroy();
        this.audioSource.node.destroy();
        this.audioSource = null;
    }
}