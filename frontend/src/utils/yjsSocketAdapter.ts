/**
 * WebSocket adapter that bridges raw WebSocket protocol to socket.io backend.
 * Allows the frontend Yjs collaboration code to work with either:
 * 1. Direct WebSocket connection to inksubserver (port 9001)
 * 2. Socket.io fallback connection to Node.js server (port 5000)
 * 
 * Usage:
 *   const ws = new YjsSocketAdapter({
 *     useSocketIO: true,  // Use socket.io instead of WebSocket
 *     url: 'http://localhost:5000'
 *   });
 */

import { io, Socket } from 'socket.io-client';

export interface YjsSocketAdapterOptions {
  useSocketIO?: boolean;
  url?: string;
}

export class YjsSocketAdapter {
  private mode: 'websocket' | 'socketio';
  private ws: WebSocket | null = null;
  private socket: Socket | null = null;
  private url: string;

  binaryType: 'arraybuffer' | 'blob' = 'arraybuffer';
  readyState: number = WebSocket.CONNECTING;

  // Event callbacks (mimics WebSocket API)
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(options: YjsSocketAdapterOptions = {}) {
    this.mode = options.useSocketIO ? 'socketio' : 'websocket';
    
    if (this.mode === 'socketio') {
      this.url = options.url || 'http://localhost:5000';
      this.initSocketIO();
    } else {
      // WebSocket mode - derive from environment or default
      const wsUrl = import.meta?.env?.VITE_WS_URL || 'ws://localhost:9001';
      this.url = wsUrl;
      this.initWebSocket();
    }
  }

  private initWebSocket(): void {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = (event) => {
        this.readyState = WebSocket.OPEN;
        if (this.onopen) this.onopen(event);
      };

      this.ws.onmessage = (event) => {
        if (this.onmessage) this.onmessage(event);
      };

      this.ws.onclose = (event) => {
        this.readyState = WebSocket.CLOSED;
        if (this.onclose) this.onclose(event);
      };

      this.ws.onerror = (event) => {
        if (this.onerror) this.onerror(event);
      };
    } catch (err) {
      console.error('[YjsSocketAdapter] WebSocket initialization failed:', err);
      this.readyState = WebSocket.CLOSED;
      if (this.onerror) this.onerror(new Event('error'));
    }
  }

  private initSocketIO(): void {
    try {
      this.socket = io(this.url, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });

      this.socket.on('connect', () => {
        this.readyState = WebSocket.OPEN;
        if (this.onopen) this.onopen(new Event('open'));
        console.log('[YjsSocketAdapter] Socket.io connected');
      });

      this.socket.on('disconnect', () => {
        this.readyState = WebSocket.CLOSED;
        if (this.onclose) this.onclose(new CloseEvent('close'));
        console.log('[YjsSocketAdapter] Socket.io disconnected');
      });

      this.socket.on('error', (err) => {
        console.error('[YjsSocketAdapter] Socket.io error:', err);
        if (this.onerror) this.onerror(new Event('error'));
      });

      // Listen for all incoming messages (both text and binary)
      this.socket.onAny((event: string, ...args: any[]) => {
        // Handle different message types
        if (event === 'joined' || event === 'userCount' || event === 'cursor' || event === 'error') {
          // Text message - JSON
          const data = args[0];
          const messageEvent = new MessageEvent('message', {
            data: JSON.stringify({ type: event, ...data }),
          });
          if (this.onmessage) this.onmessage(messageEvent);
        } else if (event === 'replay_updates' || event === 'yjs_update') {
  // Binary message - Yjs update
  const payload = args[0];
  let arrayBuffer: ArrayBuffer;

  if (payload instanceof ArrayBuffer) {
    arrayBuffer = payload;
  } else if (ArrayBuffer.isView(payload)) {
    // FIX: force-convert to guaranteed ArrayBuffer
    arrayBuffer = new Uint8Array(
  payload.buffer,
  payload.byteOffset,
  payload.byteLength
).slice().buffer;

  } else if (typeof Blob !== 'undefined' && payload instanceof Blob) {
    payload.arrayBuffer().then((buffer) => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data: buffer }));
      }
    });
    return;
  } else {
    arrayBuffer = new Uint8Array(payload ?? []).buffer;
  }

  const messageEvent = new MessageEvent('message', {
    data: arrayBuffer,
  });
  if (this.onmessage) this.onmessage(messageEvent);
}

      });
    } catch (err) {
      console.error('[YjsSocketAdapter] Socket.io initialization failed:', err);
      this.readyState = WebSocket.CLOSED;
      if (this.onerror) this.onerror(new Event('error'));
    }
  }

  send(data: string | ArrayBufferLike): void {
  if (this.mode === 'websocket') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {

      if (typeof data === 'string') {
        this.ws.send(data);
      } else if (data instanceof ArrayBuffer) {
        this.ws.send(data);
      } else if (ArrayBuffer.isView(data)) {
        // FIX: convert to guaranteed ArrayBuffer
        const buf = new Uint8Array(
          data.buffer,
          data.byteOffset,
          data.byteLength
        ).slice().buffer;
        this.ws.send(buf);
      } else {
        // fallback for SharedArrayBuffer or unknown binary
        const buf = new Uint8Array(data as any).buffer;
        this.ws.send(buf);
      }

    }
  } else {
    // Socket.io mode
    if (!this.socket || !this.socket.connected) {
      console.warn('[YjsSocketAdapter] Socket not connected');
      return;
    }

    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        const { type, ...payload } = msg;
        if (type) {
          this.socket.emit(type, payload);
        }
      } catch (err) {
        console.error('[YjsSocketAdapter] Failed to parse message:', err);
      }
    } else {
      // Binary message - Yjs update
      this.socket.emit('yjs_update', data);
    }
  }
}


  close(): void {
    if (this.mode === 'websocket' && this.ws) {
      this.ws.close();
      this.ws = null;
    } else if (this.mode === 'socketio' && this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.readyState = WebSocket.CLOSED;
  }
}

/**
 * Factory function to create the appropriate adapter based on configuration
 */
export function createYjsConnection(options: YjsSocketAdapterOptions = {}): YjsSocketAdapter {
  // Check environment variable to decide which to use
  const useSocketIO = options.useSocketIO ?? 
    (import.meta?.env?.VITE_USE_SOCKETIO === 'true');
  
  return new YjsSocketAdapter({ ...options, useSocketIO });
}
