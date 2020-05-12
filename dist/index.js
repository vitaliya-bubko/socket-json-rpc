import { Logger } from './logger';
const JsonRpcVersion = '2.0';
export var SocketStatus;
(function (SocketStatus) {
    SocketStatus[SocketStatus["OPEN"] = WebSocket.OPEN] = "OPEN";
    SocketStatus[SocketStatus["CONNECTING"] = WebSocket.CONNECTING] = "CONNECTING";
    SocketStatus[SocketStatus["CLOSED"] = WebSocket.CLOSED] = "CLOSED";
})(SocketStatus || (SocketStatus = {}));
export class SocketJsonRpc {
    constructor(config) {
        this.ws = null;
        this.status = SocketStatus.CLOSED;
        this.id = 0;
        this.requestCallbacks = {};
        this.notify = {};
        this.isClose = false;
        this.reconnectTime = 0;
        this.reconnectTimer = null;
        this.config = {
            url: '',
            maxReconnectTime: 10,
            reconnectDelay: 3000,
            requestTimeout: 30000,
            onOpen: null,
            onClose: null,
            onError: null,
            onConnecting: null,
            notify: null
        };
        if (config) {
            Object.assign(this.config, config);
        }
        this.notify = this.config.notify || {};
        this.connect();
    }
    get isWsOpenOrConnecting() {
        return this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING);
    }
    get isWsOpen() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
    get isWsClose() {
        return !this.ws || this.ws.readyState === WebSocket.CLOSED;
    }
    open() {
        if (this.status !== SocketStatus.CLOSED) {
            Logger.error('socket connection already exists');
            return;
        }
        this.isClose = false;
        this.connect();
    }
    async sendRequest(method, params, timeout, onCreateMsg) {
        if (this.id === Number.MAX_SAFE_INTEGER) {
            this.id = 0;
        }
        let msg = {
            jsonrpc: JsonRpcVersion,
            method,
            params,
            id: ++this.id
        };
        onCreateMsg && onCreateMsg(msg);
        return new Promise((resolve, reject) => {
            let timer = null;
            if (this.requestCallbacks[msg.id]) {
                reject(new Error('repeat request'));
                return;
            }
            if (!this.isWsOpen) {
                reject(new Error('socket not open'));
                return;
            }
            this.requestCallbacks[msg.id] = (result) => {
                if (timer) {
                    clearTimeout(timer);
                }
                delete this.requestCallbacks[msg.id];
                if (result.error) {
                    reject(result.error);
                }
                else {
                    resolve(result.result);
                }
            };
            this.ws.send(JSON.stringify(msg));
            timer = setTimeout(() => {
                delete this.requestCallbacks[msg.id];
                reject(new Error('request timeout: ' + msg.method));
            }, timeout || this.config.requestTimeout);
        });
    }
    sendNotification(method, params) {
        if (this.isWsOpen) {
            this.ws.send(JSON.stringify({
                jsonrpc: JsonRpcVersion,
                method,
                params
            }));
        }
    }
    close() {
        this.isClose = true;
        this.reconnectTime = 0;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.isWsOpenOrConnecting) {
            this.ws.close();
        }
        else if (this.isWsClose) {
            this.config.onClose && this.config.onClose();
        }
    }
    connect() {
        if (!this.config.url) {
            Logger.error('url cannot be empty');
            return;
        }
        if (this.isWsOpenOrConnecting) {
            Logger.error('socket connection already exists');
            return;
        }
        this.setStatus(SocketStatus.CONNECTING);
        const ws = new WebSocket(this.config.url);
        ws.onopen = this.onSocketOpen.bind(this);
        ws.onclose = this.onSocketClose.bind(this);
        ws.onerror = this.onSocketError.bind(this);
        ws.onmessage = this.onSocketMessage.bind(this);
        this.ws = ws;
    }
    onSocketOpen(e) {
        Logger.debug('ws open', e);
        this.reconnectTime = 0;
        this.setStatus(SocketStatus.OPEN);
    }
    onSocketClose(e) {
        Logger.debug('ws close', e);
        if (!this.isClose && this.reconnectTime < this.config.maxReconnectTime) {
            this.setStatus(SocketStatus.CONNECTING);
            this.reconnectTimer = setTimeout(() => {
                if (!this.isClose) {
                    this.reconnectTime++;
                    this.connect();
                }
            }, this.config.reconnectDelay);
        }
        else {
            this.setStatus(SocketStatus.CLOSED);
        }
    }
    onSocketError(e) {
        Logger.debug('ws error', e);
        if (this.config.onError) {
            this.config.onError();
        }
    }
    onSocketMessage(msgEvent) {
        Logger.debug('ws message', msgEvent.data);
        if (!msgEvent.data) {
            Logger.warn('ignore empty data', msgEvent);
            return;
        }
        let result = null;
        try {
            result = JSON.parse(msgEvent.data);
        }
        catch (e) { }
        // if (!result.jsonrpc || result.jsonrpc !== JsonRpcVersion) {
        //     Logger.warn('ignore non-standard data', msgEvent);
        //     return;
        // }
        let cb = null;
        if (result.id) {
            cb = this.requestCallbacks[result.id];
        }
        else if (result.method) {
            cb = this.notify[result.method];
        }
        if (cb) {
            cb(result);
            return;
        }
        Logger.warn('ignore message', result);
    }
    setStatus(status) {
        if (this.status !== status) {
            if (status === SocketStatus.OPEN) {
                this.config.onOpen && this.config.onOpen();
            }
            else if (status === SocketStatus.CONNECTING) {
                this.config.onConnecting && this.config.onConnecting();
            }
            else if (status === SocketStatus.CLOSED) {
                this.config.onClose && this.config.onClose();
            }
            this.status = status;
        }
    }
}
