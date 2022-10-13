/**
 * 生产消费队列，先进先出原则
 * @param {(data: any, next: Function)} cb 处理回调
 * @param {*} target    
 */

 interface handle {
    (data: any, next: Function): void
}

export default class Queue {
    static create(handle: handle, target?: any) {
        return new Queue(handle, target);
    }

    private queue = [];
    private handle: handle = null;
    private target: any = null;

    private running = false;
    private delaying = false;

    constructor(handle: handle, target?: any) {
        this.handle = handle;
        this.target = target;
    }

    public add(data: any) {
        this.queue.push(data);

        if (!this.running) return;

        if (this.delaying) {
            this.next();
        }
    }

    public start() {
        if (this.running) return;
        this.running = true;
        this.delaying = false;
        this.next();
    }

    public stop() {
        this.running = false;
    }

    private next() {
        if (!this.running) return;

        if (this.size() === 0) {
            return this.delaying = true;
        } else {
            this.delaying = false;
        }

        this.handle.call(this.target, this.queue.shift(), () => {
            this.next();
        });
    }

    public size() {
        return this.queue.length;
    }

    public clear() {
        this.queue.length = 0;
    }
}
