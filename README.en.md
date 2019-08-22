# socket-json-rpc

#### Introduction

* Based on WebSocket
* Designed according to [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
* Support automatic reconnection
* Support TypeScript

#### Install

```
npm i socket-json-rpc
```

#### Example

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

// Original WebSocket
console.log(socket.ws)

// Current state
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

#### Config

``` ts
interface SocketJsonRpcConfig {
  url: string
  maxReconnectTime?: number // Maximum number of consecutive reconnection, default: 10
  reconnectDelay?: number // Each reconnection interval, default: 3000
  requestTimeout?: number // Request timeout, default: 30000
  onOpen?: Function // Connected
  onClose?: Function // Disconnected
  onError?: Function // Socket error
  onConnecting?: Function // Connecting
  notify?: NotifyCallbacks // Notification callback
}
```

#### Methods

``` ts
// send request
// timeout - Timeout for this request
// onCreateMsg -Can get packed data (including id)
function sendRequest(method: string, params?: object, timeout?: number, onCreateMsg?: Function): Promise<any>;
// send notification
function sendNotification(method: string, params?: object): void;
// close websocket
function close(): void;
```

#### Set debug output

``` js
import { setLogger } from 'socket-json-rpc/dist/logger'

setLogger(param)

```
When param is a number:
* 0 - turn off all debug output
* 1 - only output Error message
* 2 - Output Error, Warning message
* 3 - Output Error, Warning, Debug messages

When param is an object, replace it directly, please refer to the following structure:

``` ts
interface Logger {
  debug: Function
  warn: Function
  error: Function
}
```
