# socket-json-rpc

#### 介绍

* 基于WebSocket
* 根据 [JSON-RPC 2.0](https://www.jsonrpc.org/specification) 规范设计
* 支持自动重连
* 支持TypeScript

#### 安装

```
npm i socket-json-rpc
```

#### 使用方法

``` js
import { SocketJsonRpc } from 'socket-json-rpc'

const socket = new SocketJsonRpc({
  url: '',
  onOpen: () => {
    console.log('open !!')
    send()
  },
  onConnecting: () => {
    console.log('connecting !!')
  },
  onClose: () => {
    console.log('close !!')
  },
  notify: {
    notificationName: () => {
      console.log('notification !!')
    }
  }
})

async function send() {
  try {
    const result = await socket.sendRequest('methodName', {param: 'value'})
    console.log('request success', result)
  } catch (e) {
    console.error('request error', e)
  }
}
```


#### 配置

``` ts
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
```

#### 方法

``` ts
// 发送请求
function sendRequest(method: string, params?: object, timeout?: number, onCreateMsg?: Function): Promise<any>;
// 发送通知
function sendNotification(method: string, params?: object): void;
// 关闭连接
function close(): void;
```




