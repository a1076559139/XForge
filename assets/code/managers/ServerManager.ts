
import { _decorator, Component, Node, Enum, Label } from 'cc';
import roleData from '../models/roleData';
import { EcsManager } from './EcsManager';
const { ccclass, property, type } = _decorator;

export type ISendData = number

export interface IServerData {
    event: string;
    data: any
}

export interface IFrame {
    [roleid: string]: number
}

export type IFrameMode = number;

export enum FrameMode {
    Normal = 0,
    Forecast = 1
}

enum ServerType {
    Local,
    Remote
}

const localData = {
    roleid: 'localRole',
    roomRoles: []
}

let instance: ServerManager | null = null;
@ccclass('ServerManager')
export class ServerManager extends Component {
    @type(Enum(ServerType))
    private type: ServerType = ServerType.Remote;

    @type(Label)
    private cacheNum: Label = null!;

    @type(Label)
    private forecastNum: Label = null!;

    @type(Label)
    private delayNum: Label = null!;

    static get instance() { return instance; }
    onLoad() { instance = this; }


    // private url = 'ws://192.168.1.116:8080/';
    private url = 'ws://api.csgblog.com/lockstep/';
    private client: WebSocket | null = null;
    private frameCount = 0;

    // 记录要发送的数据
    private readlData: ISendData = 0;

    start() {
        //@ts-ignore
        window['serverManager'] = this;
        this.connect();
        this.pingPong();

        this.node.on('init', function (this: ServerManager) {
            this.frameCount = 0;
            this.readlData = 0;
            this.sendTime = 0;
            this.frames.length = 0;
            this.handling = false;
            this.forecastCount = 0;
        }, this)
    }

    private connect() {
        if (this.type === ServerType.Remote) {
            let url = this.url;
            if (roleData.roleid && roleData.roomid) {
                url += '?roleid=' + roleData.roleid + '&roomid=' + roleData.roomid + '&frame=' + this.frameCount;
            }

            this.close();
            this.client = new WebSocket(url);
            this.client.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
                if (event.data instanceof ArrayBuffer) {
                    // todo
                } else {
                    const message: IServerData = JSON.parse(event.data);
                    this.handleRemoteData(message);
                }
            }
            this.client.onclose = () => {
                this.close()
                this.node.emit('reconnect');
                this.scheduleOnce(this.connect, 1);
            }
        } else {
            this.scheduleOnce(function (this: ServerManager) {
                this.node.emit('init', localData.roleid);
                this.node.emit('initRoom', localData.roomRoles);
                this.node.emit('joinRoom', localData.roleid);
            })
        }
    }

    private close() {
        if (!this.client) return;
        this.client!.onmessage = null;
        this.client!.onclose = null;
        this.client?.close();
        this.client = null;
    }

    private _pingPong() {
        if (this.client && this.client.readyState === WebSocket.OPEN) {
            this.sendRemoteData('ping', Date.now());
            this.scheduleOnce(this.pongTimeout, 0.5);
        } else {
            // 离线
            this.delayNum.string = '延迟: -1';
        }
    }
    private pongTimeout() {
        // 500;
        this.delayNum.string = '延迟: 500';
    }
    private onPong(data: number) {
        const time = Date.now() - data;
        this.delayNum.string = `延迟: ${time}`;
        this.unschedule(this.pongTimeout);
    }
    private pingPong() {
        this.node.on('pong', this.onPong, this);
        this.schedule(this._pingPong, 1);
    }


    private _running = true;
    get running() { return this._running; }
    pause() {
        if (this.type !== ServerType.Remote) return;
        this._running = false;
    }

    resume() {
        if (this.type !== ServerType.Remote) return;
        this._running = true;
    }

    sendRemoteData(event: string, data?: any) {
        this.client?.send(JSON.stringify({
            event,
            data
        }));
    }

    // 帧帧率
    public readonly frameRate = 20;
    // 帧间隔
    public readonly interval = 1 / this.frameRate;

    // 记录要发送的数据
    sendToFrame(data: ISendData) {
        this.readlData = data;
    }

    // 给服务器发送数据
    private sendTime = 0;
    private sendRemoteFrame(deltaTime: number) {
        if (this.type !== ServerType.Remote) return;
        this.sendTime += deltaTime;
        while (this.sendTime >= this.interval / 2) {
            this.readlData && this.client?.send(JSON.stringify(this.readlData));
            this.readlData = 0;
            this.sendTime -= this.interval / 2;
        }
    }

    private frames: (IFrame | null)[] = [];
    // 从服务器接收数据
    private handleRemoteData(message: IServerData) {
        if (message.event === 'update') {
            this.frameCount++;
            this.frames.push(message.data);
        } else if (message.event === 'updates') {
            const frames: IFrame[] = message.data;
            this.frameCount += frames.length;
            Array.prototype.push.apply(this.frames, frames);
        } else {
            this.node.emit(message.event, message.data);
        }
    }
    // 本地模拟数据
    private createTime = 0;
    private createLocalFrame(deltaTime: number) {
        this.createTime += deltaTime;
        while (this.createTime >= this.interval) {
            this.frames.push({
                [localData.roleid]: this.readlData
            });
            this.readlData = 0;
            this.createTime -= this.interval;
        }
    }

    // 消化frame数据
    private handling = false;
    private forecastCount = 0;
    // private testForecast = false;
    // private testForecastCount = 0;
    private handleFrames(deltaTime: number) {
        if (!this.handling) {
            if (this.frames.length >= 3) this.handling = true;
            else return;
        }

        // 测试预测帧
        // if (this.testForecast) {
        //     if (this.testForecastCount) {
        //         if (!EcsManager.instance?.isFree) return;

        //         this.testForecastCount--;
        //         this.forecastCount++;

        //         EcsManager.instance?.handleFrame(null!, FrameMode.Forecast);
        //         return;
        //     } else {
        //         this.testForecast = false;
        //     }
        // } else {
        //     this.testForecast = Math.random() > 0.9;
        //     if (this.testForecast) {
        //         // this.testForecastCount = Math.floor(Math.random() * 50) + 10
        //         this.testForecastCount = 20
        //     }
        // }

        // 填充预测帧
        if (this.forecastCount && this.frames.length) {
            const index = EcsManager.instance?.handleIndex;
            while (this.forecastCount && this.frames.length) {
                this.forecastCount--;
                const frame = this.frames.shift();
                EcsManager.instance?.handleFrame(frame!, FrameMode.Normal, index);
            }
            for (let i = 0; i < this.forecastCount; i++) {
                EcsManager.instance?.handleFrame(null!, FrameMode.Forecast, index);
            }
        }

        // 加速消耗
        if (this.forecastCount === 0 && this.frames.length >= 4) {
            const speed = Math.min(Math.floor(this.frames.length / 10) + 1, 30);
            for (let index = 0; index < speed; index++) {
                const frame = this.frames.shift();
                EcsManager.instance?.handleFrame(frame!, FrameMode.Normal);
            }
            return;
        }

        // 正常消耗
        if (!EcsManager.instance?.isFree) return;
        if (this.frames.length === 0) {
            if (this.frameCount + this.forecastCount >= 36000) return;
            this.forecastCount++;
            EcsManager.instance?.handleFrame(null!, FrameMode.Forecast);
        } else {
            const frame = this.frames.shift();
            EcsManager.instance?.handleFrame(frame!, FrameMode.Normal);
        }
    }

    update(deltaTime: number) {
        if (this._running) {
            if (this.type === ServerType.Remote) {
                this.sendRemoteFrame(deltaTime);
            } else {
                this.createLocalFrame(deltaTime);
            }
            this.handleFrames(deltaTime);
        }

        this.cacheNum.string = `缓存: ${this.frames.length}`;
        this.forecastNum.string = `预测: ${this.forecastCount}`;
    }
}