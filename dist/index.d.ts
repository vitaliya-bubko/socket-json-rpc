interface SocketJsonRpcConfig {
    url: string;
    maxReconnectTime?: number;
    reconnectDelay?: number;
    requestTimeout?: number;
    onOpen?: Function;
    onClose?: Function;
    onError?: Function;
    onConnecting?: Function;
    notify?: NotifyCallbacks;
}
interface NotifyCallbacks {
    [propName: string]: Function;
}
export declare enum SocketStatus {
    OPEN,
    CONNECTING,
    CLOSED
}
export declare class SocketJsonRpc {
    ws: WebSocket;
    status: SocketStatus;
    private id;
    private requestCallbacks;
    private notify;
    private isClose;
    private reconnectTime;
    private reconnectTimer;
    private config;
    private readonly isWsOpenOrConnecting;
    private readonly isWsOpen;
    private readonly isWsClose;
    constructor(config: SocketJsonRpcConfig);
    open(): void;
    sendRequest(method: string, params?: object, timeout?: number, onCreateMsg?: Function): Promise<any>;
    sendNotification(method: string, params?: object): void;
    close(): void;
    private connect;
    private onSocketOpen;
    private onSocketClose;
    private onSocketError;
    private onSocketMessage;
    private setStatus;
}
export {};
