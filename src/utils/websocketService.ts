class WebSocketService {
    private socket: WebSocket | null = null
    private url: string
    private reconnectInterval = 5000
    private isManualClose = false

    constructor(url: string) {
        this.url = url
    }

    connect(onMessage: (data: any) => void) {
        this.socket = new WebSocket(this.url)

        this.socket.onopen = () => {
            console.log('[WebSocket] 连接成功')
        }

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                onMessage(data)
            } catch (e) {
                console.warn('[WebSocket] 非 JSON 数据：', event.data)
                onMessage(event.data)
            }
        }

        this.socket.onerror = (error) => {
            console.error('[WebSocket] 发生错误：', error)
        }

        this.socket.onclose = (event) => {
            console.warn('[WebSocket] 连接关闭：', event.code)
            if (!this.isManualClose) {
                console.log('[WebSocket] 尝试重连中...')
                setTimeout(() => this.connect(onMessage), this.reconnectInterval)
            }
        }
    }

    send(data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data))
        } else {
            console.warn('[WebSocket] 连接尚未建立')
        }
    }

    close() {
        this.isManualClose = true
        this.socket?.close()
    }
}

export default WebSocketService
