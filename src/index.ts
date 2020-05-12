import { Logger } from './logger'

const JsonRpcVersion = '2.0'

interface SocketJsonRpcConfig {
  url: string // 要连接的服务器url
  maxReconnectTime?: number // 最大连续重连次数
  reconnectDelay?: number // 每次重连时间间隔
  requestTimeout?: number // 请求超时时间
  onOpen?: Function // 已连接
  onClose?: Function // 已断开连接
  onError?: Function // socket错误
  onConnecting?: Function // 连接中
  notify?: NotifyCallbacks // 通知回调
}

interface JsonRpcParams {
  readonly jsonrpc: string
  method: string
  params: any
  id: null | number
}

interface JsonRpcResult {
  readonly jsonrpc: string
  result?: any
  error?: any
  id: null | number
}

interface RequestCallbacks {
  [propName: number]: Function
}

interface NotifyCallbacks {
  [propName: string]: Function
}

export enum SocketStatus {
  OPEN = WebSocket.OPEN,
  CONNECTING = WebSocket.CONNECTING,
  CLOSED = WebSocket.CLOSED
}

export class SocketJsonRpc {
  public ws: WebSocket = null
  public status: SocketStatus = SocketStatus.CLOSED

  private id: number = 0 // request id
  private requestCallbacks: RequestCallbacks = {}
  private notify: NotifyCallbacks = {}
  private isClose: boolean = false
  private reconnectTime: number = 0
  private reconnectTimer: number = null

  private config: SocketJsonRpcConfig = {
    url: '',
    maxReconnectTime: 10,
    reconnectDelay: 3000,
    requestTimeout: 30000,
    onOpen: null,
    onClose: null,
    onError: null,
    onConnecting: null,
    notify: null
  }

  private get isWsOpenOrConnecting(): boolean {
    return this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
  }

  private get isWsOpen(): boolean {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }

  private get isWsClose(): boolean {
    return !this.ws || this.ws.readyState === WebSocket.CLOSED
  }

  public constructor(config: SocketJsonRpcConfig) {
    if (config) {
      Object.assign(this.config, config)
    }
    this.notify = this.config.notify || {}
    this.connect()
  }

  public open(): void {
    if (this.status !== SocketStatus.CLOSED) {
      Logger.error('socket connection already exists')
      return
    }
    this.isClose = false
    this.connect()
  }

  public async sendRequest(method: string, params?: object, timeout?: number, onCreateMsg?: Function): Promise<any> {
    if (this.id === Number.MAX_SAFE_INTEGER) {
      this.id = 0
    }
    let msg: JsonRpcParams = {
      jsonrpc: JsonRpcVersion,
      method,
      params,
      id: ++this.id
    }
    onCreateMsg && onCreateMsg(msg)
    return new Promise((resolve, reject): void => {
      let timer: number = null
      if (this.requestCallbacks[msg.id]) {
        reject(new Error('repeat request'))
        return
      }
      if (!this.isWsOpen) {
        reject(new Error('socket not open'))
        return
      }
      this.requestCallbacks[msg.id] = (result: JsonRpcResult): void => {
        if (timer) {
          clearTimeout(timer)
        }
        delete this.requestCallbacks[msg.id]
        if (result.error) {
          reject(result.error)
        } else {
          resolve(result.result)
        }
      }
      this.ws.send(JSON.stringify(msg))
      timer = setTimeout((): void => {
        delete this.requestCallbacks[msg.id]
        reject(new Error('request timeout: ' + msg.method))
      }, timeout || this.config.requestTimeout)
    })
  }

  public sendNotification(method: string, params?: object): void {
    if (this.isWsOpen) {
      this.ws.send(
        JSON.stringify({
          jsonrpc: JsonRpcVersion,
          method,
          params
        })
      )
    }
  }

  public close(): void {
    this.isClose = true
    this.reconnectTime = 0
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.isWsOpenOrConnecting) {
      this.ws.close()
    } else if (this.isWsClose) {
      this.config.onClose && this.config.onClose()
    }
  }

  private connect(): void {
    if (!this.config.url) {
      Logger.error('url cannot be empty')
      return
    }
    if (this.isWsOpenOrConnecting) {
      Logger.error('socket connection already exists')
      return
    }
    this.setStatus(SocketStatus.CONNECTING)
    const ws = new WebSocket(this.config.url)
    ws.onopen = this.onSocketOpen.bind(this)
    ws.onclose = this.onSocketClose.bind(this)
    ws.onerror = this.onSocketError.bind(this)
    ws.onmessage = this.onSocketMessage.bind(this)
    this.ws = ws
  }

  private onSocketOpen(e: Event): void {
    Logger.debug('ws open', e)
    this.reconnectTime = 0
    this.setStatus(SocketStatus.OPEN)
  }

  private onSocketClose(e: CloseEvent): void {
    Logger.debug('ws close', e)
    if (!this.isClose && this.reconnectTime < this.config.maxReconnectTime) {
      this.setStatus(SocketStatus.CONNECTING)
      this.reconnectTimer = setTimeout((): void => {
        if (!this.isClose) {
          this.reconnectTime++
          this.connect()
        }
      }, this.config.reconnectDelay)
    } else {
      this.setStatus(SocketStatus.CLOSED)
    }
  }

  private onSocketError(e: Event): void {
    Logger.debug('ws error', e)
    if (this.config.onError) {
      this.config.onError()
    }
  }

  private onSocketMessage(msgEvent: MessageEvent): void {
    Logger.debug('ws message', msgEvent.data)
    if (!msgEvent.data) {
      Logger.warn('ignore empty data', msgEvent)
      return
    }
    let result = null
    try {
      result = JSON.parse(msgEvent.data)
    } catch (e) {}
    // if (!result.jsonrpc || result.jsonrpc !== JsonRpcVersion) {
    //   Logger.warn('ignore non-standard data', msgEvent)
    //   return
    // }
    let cb: Function = null
    if (result.id) {
      cb = this.requestCallbacks[result.id]
    } else if (result.method) {
      cb = this.notify[result.method]
    }
    if (cb) {
      cb(result)
      return
    }
    Logger.warn('ignore message', result)
  }

  private setStatus(status: SocketStatus): void {
    if (this.status !== status) {
      if (status === SocketStatus.OPEN) {
        this.config.onOpen && this.config.onOpen()
      } else if (status === SocketStatus.CONNECTING) {
        this.config.onConnecting && this.config.onConnecting()
      } else if (status === SocketStatus.CLOSED) {
        this.config.onClose && this.config.onClose()
      }
      this.status = status
    }
  }
}
