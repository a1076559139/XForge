class EventEmitter {
    private listeners: Map<string, Map<any, Set<(data?: any) => void>>> = new Map();

    public on(event: string, cb: (data?: any) => void, target?: unknown) {
        if (typeof target === 'undefined') {
            target = this;
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Map());
        }

        const map = this.listeners.get(event);

        if (!map.has(target)) {
            map.set(target, new Set());
        }

        const set = map.get(target);

        set.add(cb);
    }

    public off(event?: string, cb?: (data?: any) => void, target?: unknown) {
        if (!event) {
            this.listeners.clear();
            return;
        }

        if (typeof target === 'undefined') {
            target = this;
        }

        if (!this.listeners.has(event)) {
            return;
        }

        const map = this.listeners.get(event);

        if (!map.has(target)) {
            return;
        }

        const set = map.get(target);

        if (cb) {
            set.delete(cb);
        } else {
            set.clear();
        }
    }

    public offTarget(target?: unknown) {
        if (typeof target === 'undefined') {
            target = this;
        }

        this.listeners.forEach(function (map) {
            map.delete(target);
        });
    }

    protected emit(event: string, data?: any) {
        if (!this.listeners.has(event)) {
            return;
        }

        const map = this.listeners.get(event);

        map.forEach(function (set, target) {
            set.forEach(function (cb) {
                cb.call(target, data);
            });
        });
    }
}

interface IEncode {
    (event: string, data?: any): string | ArrayBuffer
}

interface IDecode {
    (param: string | ArrayBuffer): { event: string, data?: any }
}

interface IOpt {
    msgKey: string,
    binaryType?: BinaryType,
    connectTimeOut?: number,
    useAutoReconnect?: boolean,
    autoReconnectDelay?: number,
    useHeartbeat?: boolean,
    heartbeatDelay?: number,
    heartbeatTimeOut?: number,
    reconnectMax?: number,
    encode?: IEncode,
    decode?: IDecode
}

enum ErrorEvent {
    ConnectTimeOut = 'ConnectTimeOut'
}

//构建版本不输出socket日志 
const LOG_ENABLED: boolean = window['CC_DEV'];

export default class Socket extends EventEmitter {

    static create(url: string, opt?: IOpt): Socket {
        return new Socket(url, opt);
    }

    // 心跳间隔定时器
    private heartbeatTimer = null;
    // 心跳超时定时器
    private heartbeatTimeOutTimer = null;
    // 连接超时定时器
    private connectTimeOutTimer = null;
    // 自动重连定时器
    private autoReconnectTimer = null;
    // websocket状态
    private _state = WebSocket.CLOSED;
    // websocket对象
    private socket: WebSocket = null;
    // 重连次数
    private reconnectCount: number = 0;

    // 消息id
    private msgKey: string = '';
    // 服务器地址
    private url = '';
    // 编码类型
    private binaryType: BinaryType = null;
    // 状态
    public get state() { return this._state; }
    // 连接超时时间
    public connectTimeOut = 5000;
    // 重连等待时间
    public autoReconnectDelay = 2000;
    // 重连最大次数
    public reconnectMax = 0;
    // 心跳等待时间
    public heartbeatDelay = 10000;
    // 心跳超时时间
    public heartbeatTimeOut = 15000;

    // 是否开启自动重连
    public useAutoReconnect = true;
    // 是否启用心跳
    public useHeartbeat = true;

    // 编码
    public encode: IEncode = null;
    // 解码
    public decode: IDecode = null;

    constructor(url: string, opt?: IOpt) {
        super();
        // 初始化url
        this.url = url;
        // 参数设置
        if (opt) {
            for (const key in opt) {
                this[key] = opt[key];
            }
        }
    }

    /**
     * @description: 消息事件
     * @param {string} event 事件名
     * @param {any} data 数据
     */
    protected emit(event: string, data?: any) {
        super.emit('message', { event, data });
        super.emit(event, data);
    }

    /**
     * @description: 建立连接
     * @param {boolean} useAutoReconnect 是否开启自动重连
     * @param {boolean} useHeartbeat 是否开启心跳
     */
    public connect(useAutoReconnect?: boolean, useHeartbeat?: boolean) {
        if (LOG_ENABLED) console.log('%c(Socket) 连接服务器:%s', 'font-weight:bold;color:blue;', this.url);

        if (typeof useAutoReconnect !== 'undefined') {
            this.useAutoReconnect = !!useAutoReconnect;
        }
        if (typeof useHeartbeat !== 'undefined') {
            this.useHeartbeat = !!useHeartbeat;
        }
        this._state = WebSocket.CONNECTING;
        this.emit('connecting');
        this.createSocket();
    }

    /**
     * @description: 创建连接 绑定回调
     */
    private createSocket() {
        this.clearSocket();
        this.socket = new WebSocket(this.url);

        if (this.binaryType) this.socket.binaryType = this.binaryType;

        // 连接成功
        this.socket.onopen = this.onopen.bind(this);
        // 收到消息
        this.socket.onmessage = this.onmessage.bind(this);
        // 连接错误
        this.socket.onerror = this.onerror.bind(this);
        // 连接关闭
        this.socket.onclose = this.onclose.bind(this);

        this.startConnectTimeOutListen();
    }

    /**
     * @description: 发送消息
     * @param {any} data 数据
     */
    public send(data: any) {
        // websocket是否存在 是否在连接状态
        if (this.isValid() && this.isOpened()) {
            // 消息编码
            const encodeData = this.onEncode(data);
            if (LOG_ENABLED && data[this.msgKey] !== 'ping') {
                console.log('%c(Socket) 发送消息 %o', 'font-weight:bold;color:blue', data);
            }
            // 发送
            this.socket.send(encodeData);
        }
    }

    /**
     * @description: 关闭连接
     * @param {boolean} useAutoReconnect 是否开启自动重连
     */
    public close(useAutoReconnect: boolean = false) {
        if (LOG_ENABLED) console.log('%c(Socket) 主动断开连接', 'font-weight:bold;color:red');
        if (typeof useAutoReconnect !== 'undefined') {
            this.useAutoReconnect = !!useAutoReconnect;
        }
        this._state = WebSocket.CLOSING;
        this.emit('closing');
        this.onclose();
    }

    /**
     * @description: 清理websocket
     */
    private clearSocket() {
        if (this.socket) {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onerror = null;
            this.socket.onclose = null;
            this.socket.close();
            this.socket = null;

            this.clearHeartbeat();
            this.clearHeartbeatTimeOutListen();
            this.clearConnectTimeOutListen();
            this.clearAutoReconnect();
        }
    }

    /**
     * @description 开启连接超时监听
     */
    private startConnectTimeOutListen() {
        this.clearConnectTimeOutListen();
        this.connectTimeOutTimer = setTimeout(() => {
            this.connectTimeOutTimer = null;
            if (!this.isOpened() && this.isConnecting()) {
                if (LOG_ENABLED) console.log('%c(Socket) onTimeOut', 'font-weight:bold;color:red');
                this.onerror(ErrorEvent.ConnectTimeOut);
                this.close(true);
            }
        }, this.connectTimeOut);
    }

    /**
     * @description 清理连接超时监听
     */
    private clearConnectTimeOutListen() {
        this.connectTimeOutTimer && clearTimeout(this.connectTimeOutTimer);
        this.connectTimeOutTimer = null;
    }

    /**
     * @description 开始自动重连
     */
    private startAutoReconnect() {
        this.clearAutoReconnect();
        this.autoReconnectTimer = setTimeout(() => {
            this.reconnect();
        }, this.autoReconnectDelay);
    }

    /**
     * @description 清理自动重连
     */
    private clearAutoReconnect() {
        this.autoReconnectTimer && clearTimeout(this.autoReconnectTimer);
        this.autoReconnectTimer = null;
    }

    /**
     * @description 开始心跳
     */
    private startHeartbeat() {
        this.clearHeartbeat();
        this.heartbeatTimer = setTimeout(() => {
            this.ping();
        }, this.heartbeatDelay);
    }

    /**
     * @description 清理心跳
     */
    private clearHeartbeat() {
        this.heartbeatTimer && clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = null;
    }

    /**
     * @description 开始心跳超时监听
     */
    private startHeartbeatTimeOutListen() {
        this.clearHeartbeatTimeOutListen();
        this.heartbeatTimeOutTimer = setTimeout(() => {
            if (LOG_ENABLED) console.log('%c(Socket) onHeartbeatTimeOut', 'font-weight:bold;color:red');
            this.emit('timeout');
            this.reconnect();
        }, this.heartbeatTimeOut);
    }

    /**
     * @description 清理心跳超时监听
     */
    private clearHeartbeatTimeOutListen() {
        this.heartbeatTimeOutTimer && clearTimeout(this.heartbeatTimeOutTimer);
        this.heartbeatTimeOutTimer = null;
    }

    /**
     * @description: 重连
     */
    private reconnect() {
        if (this.reconnectCount < this.reconnectMax) {
            if (LOG_ENABLED) console.log('%c(Socket) 尝试重连', 'font-weight:bold;color:orange');
            this.reconnectCount++;
            this._state = WebSocket.CONNECTING;
            this.emit('reconnecting');
            this.createSocket();
        } else {
            if (LOG_ENABLED) console.log('%c(Socket) 多次重连失败 降级', 'font-weight:bold;color:red');
            this.useAutoReconnect = false;
            this.emit('demote');
            this.close();
        }
    }

    /**
     * @description:  收到消息处理
     * @param {any} event 返回数据
     */
    private onmessage(event: any) {
        if (!event || typeof event.data === 'undefined') {
            return;
        }
        // pong消息
        if (typeof event.data === 'string' && event.data.indexOf('PONG') === 0) {
            this.onpong();
        } else {
            const decodeData = this.onDecode(event.data);
            if (LOG_ENABLED) console.log('%c(Socket) 收到消息  %o', 'font-weight:bold;color:green', decodeData);
            this.emit('message', decodeData);
        }
    }

    /**
     * @description 连接服务器成功回掉
     */
    private onopen() {
        if (LOG_ENABLED) console.log('%c(Socket) 连接网络:成功:', 'font-weight:bold;color:green');
        this.clearAutoReconnect();
        this.clearConnectTimeOutListen();

        // 设置状态
        this._state = WebSocket.OPEN;
        this.emit('open');

        // 发心跳
        this.heartbeat();
    }

    /**
     * @description: 异常处理
     * @param {string} data
     */
    private onerror(data?: string) {
        if (LOG_ENABLED) console.log('%c(Socket) 连接出错', 'font-weight:bold;color:red');
        this.emit('error', data);
    }

    /**
     * @description: 关闭处理
     */
    private onclose() {
        if (LOG_ENABLED) console.log('%c(Socket) onClose', 'font-weight:bold;color:red');
        if (this._state === WebSocket.CLOSED) {
            return;
        }
        this.clearSocket();

        this._state = WebSocket.CLOSED;
        this.emit('closed');

        // 自动重连
        if (this.useAutoReconnect) {
            this.startAutoReconnect();
        }
    }

    /**
     * @description: 心跳
     */
    private heartbeat() {
        // 清理心跳
        this.clearHeartbeat();
        this.clearHeartbeatTimeOutListen();

        // 开启心跳
        if (this.useHeartbeat) {
            this.startHeartbeat();
            this.startHeartbeatTimeOutListen();
        }
    }

    /**
     * @description: ping消息
     */
    private ping() {
        if (this._state === WebSocket.OPEN) {
            this.socket.send('PING');
            this.emit('ping');
        }
    }

    /**
     * @description: pong处理
     */
    private onpong() {
        this.emit('pong');
        this.heartbeat();
    }

    /**
     * @description: 编码
     * @param {any} data 编码数据
     */
    private onEncode(data?: any) {
        if (this.encode) {
            return this.encode(data);
        } else {
            return JSON.stringify(data);
        }
    }

    /**
     * @description: 解码
     * @param {string} param 解码数据
     */
    private onDecode(param: string) {
        if (this.decode) {
            return this.decode(param);
        } else {
            return JSON.parse(param);
        }
    }

    /**
     * @description: websocket是否存在
     */
    public isValid() {
        return !!this.socket;
    }

    /**
     * @description: 是否建立连接
     */
    public isOpened() {
        return this._state === WebSocket.OPEN;
    }

    /**
     * @description: 是否关闭
     */
    public isClosed() {
        return this._state === WebSocket.CLOSED;
    }

    /**
     * @description: 是否正在建立连接
     */
    public isConnecting() {
        return this._state === WebSocket.CONNECTING;
    }

    /**
     * @description: 是否正在关闭
     */
    public isClosing() {
        return this._state === WebSocket.CLOSING;
    }

}