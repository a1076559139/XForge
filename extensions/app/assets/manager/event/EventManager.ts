import { EventTarget, _decorator } from 'cc';
import BaseManager from '../../base/BaseManager';
const { ccclass } = _decorator;

@ccclass('EventManager')
export default class EventManager extends BaseManager {
    private events: Map<string | number, EventTarget> = new Map();

    clear() {
        return this.events.clear();
    }

    delete(rootName: string | number) {
        return this.events.delete(rootName);
    }

    get(rootName: string | number): EventTarget {
        if (this.events.has(rootName)) {
            return this.events.get(rootName);
        }

        const event = new EventTarget();
        this.events.set(rootName, event);

        return event;
    }
}
