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

#### 示例

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

// 原始的WebSocket
console.log(socket.ws)

// 当前状态
console.log(socket.status)

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
  url: string
  maxReconnectTime?: number // 最大连续重连次数，默认：10
  reconnectDelay?: number // 每次重连时间间隔，默认：3000
  requestTimeout?: number // 请求超时时间，默认：30000
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
// timeout - 本次请求超时时间
// onCreateMsg - 可以获取封装好的数据（包括id）
function sendRequest(method: string, params?: object, timeout?: number, onCreateMsg?: Function): Promise<any>;
// 发送通知
function sendNotification(method: string, params?: object): void;
// 关闭连接
function close(): void;
```

#### 设置调试输出

``` js
import { setLogger } from 'socket-json-rpc/dist/logger'

setLogger(param)

```
param为数值时：
* 0 - 关闭所有调试输出
* 1 - 只输出Error消息
* 2 - 输出Error、Warning消息
* 3 - 输出Error、Warning、Debug消息

param为对象时，直接替换，请参考以下结构：

``` ts
interface Logger {
  debug: Function
  warn: Function
  error: Function
}
```
