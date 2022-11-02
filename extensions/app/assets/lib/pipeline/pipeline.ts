/**
 * 管线能执行指令达到某个效果
 */
// type ptype = string | number | boolean | object | Array<any>;
// type result = Promise<ptype> | ptype;
interface finish {
    (data?: any): void
}

/**
 * 执行者
 */
export interface IReceiver {
    execute(data?: any): any;
    revoke?(data?: any): any;
}

/**
 * 指令
 */
class Command {
    static create(receiver: IReceiver): Command {
        return new Command(receiver);
    }

    protected receiver: IReceiver;

    constructor(receiver: IReceiver) {
        this.receiver = receiver;
    }

    public async execute(data?: any): Promise<any> {
        let result = this.receiver.execute(data);
        if (result instanceof Promise) {
            result = await result;
        }

        return typeof result === 'undefined' ? data : result;
    }

    public async revoke(data?: any): Promise<any> {
        let result = this.receiver.revoke(data);
        if (result instanceof Promise) {
            result = await result;
        }

        return typeof result === 'undefined' ? data : result;
    }
}

/**
 * 链式指令
 */
class ChainCommand extends Command {
    static create(receiver: IReceiver): ChainCommand {
        return new ChainCommand(receiver);
    }

    private nextCmd: ChainCommand = null;

    public connect(other: ChainCommand) {
        this.nextCmd = other;
    }

    public async execute(data?: any): Promise<any> {
        let result = this.receiver.execute(data);
        if (result instanceof Promise) {
            result = await result;
        }

        if (typeof result === 'undefined') {
            result = data;
        }

        if (this.nextCmd) {
            return await this.nextCmd.execute(result);
        } else {
            return result;
        }
    }

    public async revoke(data?: any): Promise<any> {
        if (this.nextCmd) {
            const res = await this.nextCmd.revoke(data);
            let result = this.receiver.revoke(res);
            if (result instanceof Promise) {
                result = await result;
            }
            return typeof result === 'undefined' ? data : result;
        } else {
            let result = this.receiver.revoke(data);
            if (result instanceof Promise) {
                result = await result;
            }
            return typeof result === 'undefined' ? data : result;
        }
    }
}

/**
 * 调用者
 */
class Invoker {
    static create(data?: any): Invoker {
        return new Invoker(data);
    }

    private data: any = null;

    private index: number = 0;
    private commands: Command[] = [];

    constructor(data?: any) {
        this.data = data;
    }

    public add(command: Command) {
        this.commands.push(command);
        return this;
    }

    public execute(finish?: finish) {
        if (this.index < this.commands.length) {
            const result = this.commands[this.index++].execute(this.data);
            if (result instanceof Promise) {
                result.then((data) => finish && finish(data));
            } else {
                finish && finish(result);
            }
        }
    }

    public revoke(finish?: finish) {
        if (this.index > 0) {
            const result = this.commands[--this.index].revoke(this.data);
            if (result instanceof Promise) {
                result.then((data) => finish && finish(data));
            } else {
                finish && finish(result);
            }
        }
    }
}
const pipeline = {
    Command, ChainCommand, Invoker
}
export default pipeline;