interface IHandle {
    (next: (data?: any) => boolean, retry: (timeout?: number) => boolean | 'ASYNC', end: (data?: any) => boolean): void
}

interface IFinish<T> {
    (results?: T, success?: boolean): any
}

interface ITask<T> {
    size(): number;
    add(handle: IHandle): this;
    start(finish?: IFinish<T> | Function): this;
    stop(): boolean;
    isStop(): boolean;
}

class TaskItem {
    private handle: IHandle = null;

    constructor(handle: IHandle) {
        this.handle = handle;
    }

    public execute(next: (data?: any) => boolean, retry: (timeout?: number) => boolean | 'ASYNC', end: (data?: any) => boolean) {
        this.handle(next, retry, end);
    }
}

/**
 * 顺序执行
 */
class Sync<T extends Array<any>> implements ITask<T> {
    private running = false;
    private index: number = -1;
    private list: TaskItem[] = [];
    private finish: IFinish<T> | Function = null;

    // 每个item的返回值，通过next或end存储
    public results: T = [] as T;

    public size(): number {
        return this.list.length;
    }

    public add(handle: IHandle) {
        this.list.push(new TaskItem(handle));
        this.results.push(undefined);
        return this;
    }

    public start(finish?: IFinish<T> | Function) {
        if (this.running) {
            return this;
        }

        this.running = true;
        this.index = -1;
        this.finish = finish;

        this.next(this.index);

        return this;
    }

    public stop(): boolean {
        if (!this.running) {
            return false;
        }

        this.running = false;
        if (this.finish) {
            this.finish(this.results, false);
        }

        return true;
    }

    public isStop() {
        return !this.running;
    }

    private end(data?: any): boolean {
        if (!this.running) {
            return false;
        }

        if (typeof data !== 'undefined') {
            this.results[this.index] = data;
        }

        this.running = false;
        if (this.finish) {
            this.finish(this.results, true);
        }

        return true;
    }

    private next(index: number, data?: any): boolean {
        if (!this.running) {
            return false;
        }

        if (index !== this.index) return false;

        if (typeof data !== 'undefined') {
            this.results[this.index] = data;
        }

        if (++this.index < this.list.length) {
            this.retry(this.index);
        } else {
            this.end();
        }

        return true;
    }

    private retry(index: number): boolean {
        if (!this.running) {
            return false;
        }

        if (index !== this.index) return false;

        const taskItem = this.list[index];
        taskItem && taskItem.execute(
            (data?: any) => this.next(index, data),
            (timeout = 0) => Number(timeout) > 0 ? (setTimeout(() => this.retry(index), Number(timeout) * 1000), 'ASYNC') : this.retry(index),
            (data?: any) => this.end(data)
        );

        return true;
    }
}

/**
 * 同时执行
 */
class ASync<T extends Array<any>> implements ITask<T> {
    private running = false;
    private count: number = 0;
    private list: TaskItem[] = [];
    private finish: IFinish<T> | Function = null;

    // 每个item的返回值，通过next或end存储
    public results: T = [] as T;

    public size(): number {
        return this.list.length;
    }

    public add(handle: IHandle) {
        this.list.push(new TaskItem(handle));
        this.results.push(undefined);

        if (this.running) {
            this.retry(this.list.length - 1);
        }
        return this;
    }

    public start(finish?: IFinish<T> | Function) {
        if (this.running) {
            return this;
        }

        this.running = true;
        this.count = 0;
        this.finish = finish;

        if (this.list.length) {
            for (let index = 0; index < this.list.length; index++) {
                this.retry(index);
            }
        } else {
            this.end && this.end(this.count);
        }

        return this;
    }

    public stop(): boolean {
        if (!this.running) {
            return false;
        }
        this.running = false;
        if (this.finish) {
            this.finish(this.results, false);
        }

        return true;
    }

    public isStop() {
        return !this.running;
    }

    private end(index: number, data?: any): boolean {
        if (!this.running) {
            return false;
        }

        if (index >= 0 && index < this.results.length) {
            if (this.results[index] || this.results[index] === null) return false;
            this.results[index] = typeof data !== 'undefined' ? data : null;
        }

        this.running = false;
        if (this.finish) {
            this.finish(this.results, true);
        }

        return true;
    }

    private next(index: number, data?: any): boolean {
        if (!this.running) {
            return false;
        }

        if (index >= 0 && index < this.results.length) {
            if (this.results[index] || this.results[index] === null) return false;
            this.results[index] = typeof data !== 'undefined' ? data : null;
        }

        if (++this.count === this.list.length) {
            this.end && this.end(this.count);
        }

        return true;
    }

    private retry(index: number): boolean {
        if (!this.running) {
            return false;
        }

        const taskItem = this.list[index];
        taskItem && taskItem.execute(
            (data?: any) => this.next(index, data),
            (timeout = 0) => Number(timeout) > 0 ? (setTimeout(() => this.retry(index), Number(timeout) * 1000), 'ASYNC') : this.retry(index),
            (data?: any) => this.end(index, data)
        );

        return true;
    }
}

class Any<T extends Array<any>> implements ITask<T> {
    private task = new Sync();

    // 每个item的返回值，通过next或end存储
    public get results(): T {
        return this.task.results as T;
    }

    public size() {
        return this.task.size();
    }

    public add(handles: IHandle | IHandle[]) {
        if (handles instanceof Array) {
            const async = new ASync();
            handles.forEach(handle => async.add(handle));
            this.task.add(async.start.bind(async));
        } else {
            this.task.add(handles);
        }
        return this;
    }

    public start(finish?: IFinish<T> | Function) {
        this.task.start(finish);
        return this;
    }

    public stop() {
        return this.task.stop();
    }

    public isStop() {
        return this.task.isStop();
    }
}

interface IExecuteCallBack {
    (retry: (timeout?: number) => void): void
}

const task = {
    /**
     * 任务顺序执行
     */
    createSync<T extends Array<any>>(): Sync<T> {
        return new Sync<T>();
    },

    /**
     * 任务同时执行
     */
    createASync<T extends Array<any>>(): ASync<T> {
        return new ASync<T>();
    },

    /**
     * 根据参数指定执行顺序
     * @example
     * createAny()
     * .add(1).add(2).add(3).add(4)
     * .add([5,6,7])
     * .add(8)
     * 执行顺序，1，2，3，4依次执行，然后同时执行5，6，7，最后执行8
     */
    createAny<T extends Array<any>>() {
        return new Any<T>();
    },

    /**
     * 执行单个任务
     */
    execute(fun: IExecuteCallBack, retryMax = -1, retryFinish?: Function) {
        fun(function retry(timeout = 0) {
            if (retryMax === 0) return retryFinish && retryFinish();
            retryMax = retryMax > 0 ? retryMax - 1 : retryMax;
            if (timeout > 0) {
                setTimeout(() => task.execute(fun, retryMax, retryFinish), timeout * 1000);
            } else {
                task.execute(fun, retryMax, retryFinish);
            }
        });
    },

    /**
     * 执行单个任务
     * @deprecated
     */
    excute(fun: IExecuteCallBack, retryMax = -1, retryFinish?: Function) {
        return this.execute(fun, retryMax, retryFinish);
    }
};

export default task;