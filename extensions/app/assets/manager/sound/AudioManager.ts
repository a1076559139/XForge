import Audio from './Audio';

export default class AudioManager {
    private static _inst: AudioManager = null;
    static get inst() {
        if (!this._inst) this._inst = new AudioManager();
        return this._inst;
    }
    private constructor() { }

    private audioArray: Audio[] = [];

    getAudio() {
        if (this.audioArray.length) {
            return this.audioArray.pop();
        }
        return new Audio();
    }

    putAudio(audio: Audio) {
        audio.clear();
        this.audioArray.push(audio);
    }
}