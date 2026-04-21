# Socket.IO Fallback for Inksubserver

This fallback allows the frontend Yjs collaboration code to work with Node.js socket.io backend instead of requiring the separate inksubserver (C++ uWebSockets server on port 9001).

## When to Use

- **inksubserver is down or not working**: Use the socket.io fallback temporarily
- **Development environment**: Simpler to run everything in Node.js
- **Deployment simplification**: Don't need to compile/run the C++ server

## How It Works

The socket.io fallback implements the exact same protocol as inksubserver:

### What's Implemented in `server/src/server.ts`

✅ **Room Management**
- Join rooms with `sessionId` (join code)
- Track user identities (userId, username)
- Broadcast user count updates
- Clean up empty rooms

✅ **Yjs Binary Updates**
- Buffer updates until 512 KB high-water mark
- Persist to MongoDB via Node API
- Relay updates to room peers
- Hydrate joining clients with saved state

✅ **Cursor Positions**
- Broadcast cursor coordinates
- Server-inject identity (prevent spoofing)
- Real-time cursor sync

✅ **State Persistence**
- Fetch saved Yjs state when first user joins
- Serialize/deserialize with length-prefix format
- Automatic persistence when buffer fills

## How to Use

### Option 1: Use Socket.IO on Frontend

In your `Whiteboard.tsx`, replace the WebSocket connection with:

```typescript
import { createYjsConnection } from '@/utils/yjsSocketAdapter';

// Instead of:
// const ws = new WebSocket(WS_URL);

// Use:
const ws = createYjsConnection({ useSocketIO: true });
// Now use ws exactly like WebSocket - all events work the same
```

### Option 2: Environment Variable

Set in `.env`:
```
USESOCKETIO=true
```

Then in your connection code:
```typescript
import { createYjsConnection } from '@/utils/yjsSocketAdapter';

const ws = createYjsConnection(); // Will auto-detect USESOCKETIO
```

### Option 3: Keep Existing Code, Disable Inksubserver

If you don't want to change the frontend, just don't run inksubserver:

1. Comment out the `VITE_WS_URL` environment variable
2. Frontend will try to connect to `ws://localhost:9001`
3. It will fail and retry with exponential backoff
4. Meanwhile, socket.io fallback runs on the same Node.js server at port 5000

However, **this is not recommended** since the frontend will keep trying to reconnect to port 9001.

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Use socket.io fallback instead of inksubserver
USESOCKETIO=true

# Or keep WebSocket mode and disable WS_URL so it fails gracefully
VITE_WS_URL=ws://localhost:9001

# Node API for Yjs persistence
API_URL=http://localhost:5001
INTERNAL_SECRET=your_internal_secret_here
```

### Server Configuration

The server automatically handles:
- **512 KB buffer threshold** for automatic persistence
- **Length-prefixed update format** for MongoDB storage
- **User identity injection** for cursor positions
- **Room cleanup** when last user leaves

## Protocol Reference

### Client → Server

#### Join Room
```json
{ 
  "type": "join",
  "sessionId": "abc123",
  "userId": "user_456", 
  "username": "Alice"
}
```

#### Send Cursor
```json
{
  "type": "cursor",
  "x": 100.5,
  "y": 200.3
}
```

#### Send Yjs Update
Binary frame (ArrayBuffer) - automatically handled by adapter

### Server → Client

#### Room Joined
```json
{
  "type": "joined",
  "sessionId": "abc123",
  "ok": true
}
```

#### User Count Update
```json
{
  "type": "userCount",
  "count": 3
}
```

#### Remote Cursor
```json
{
  "type": "cursor",
  "userId": "user_123",
  "username": "Bob",
  "x": 150.2,
  "y": 250.8
}
```

#### Error
```json
{
  "type": "error",
  "message": "invalid room code"
}
```

#### Yjs Update Replay (on join)
Binary frame (ArrayBuffer) - from MongoDB

#### Yjs Update (from peers)
Binary frame (ArrayBuffer) - relayed in real-time

## Testing

### Start Backend
```bash
cd server
npm install
npm run dev
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### Test Collaboration

1. Open http://localhost:5173
2. Create a board and enable collab
3. Open same board in another browser tab
4. Both should sync through socket.io on port 5000 (no port 9001 needed)

## Migration from Inksubserver

If you want to fully migrate away from inksubserver:

1. **Add socket.io fallback** (already done - see `server/src/server.ts`)
2. **Update frontend** to use `YjsSocketAdapter`
3. **Stop running inksubserver** - no longer needed
4. **Ensure INTERNAL_SECRET is set** in server .env
5. **Test thoroughly** - cursor sync, update relay, persistence

## Troubleshooting

### Frontend shows "Connection error"
- Check if Node.js server is running: `npm run dev` in `/server`
- Check if socket.io is enabled: verify `USESOCKETIO=true`
- Check console for specific error messages

### Updates not persisting
- Verify `INTERNAL_SECRET` in server `.env` matches what frontend expects
- Check MongoDB connection: see server logs
- Verify `API_URL` points to correct Node API endpoint

### User count not updating
- Check socket.io connection is established
- Verify room join was successful (check for "joined" message)
- Check server logs for room membership changes

### Binary updates not syncing
- Ensure `binaryType` is set to `'arraybuffer'`
- Check that updates are sent as `Buffer` or `ArrayBuffer`
- Verify room has multiple peers before expecting relay

## Performance Notes

The socket.io fallback is production-ready but note:
- Updates are buffered in-memory (512 KB max before flush)
- No compression (unlike inksubserver's optional compression)
- Single Node.js process (no load balancing)
- For high-traffic apps, consider sticking with optimized C++ inksubserver

## Architecture Diagram

```
Before (with inksubserver):
  Frontend (port 5173)
    ↓ ws://localhost:9001
  Inksubserver (C++, port 9001) 
    ↓ HTTP
  Node.js API (port 5000)
    ↓
  MongoDB

After (socket.io fallback):
  Frontend (port 5173)
    ↓ socket.io:// localhost:5000
  Node.js Server (port 5000)
    ├─ Socket.IO handler (Yjs collab)
    ├─ REST API (board CRUD)
    └─ HTTP client to MongoDB
```

## Files Modified/Created

- `server/src/server.ts` - Added socket.io Yjs handlers
- `frontend/src/utils/yjsSocketAdapter.ts` - WebSocket → Socket.IO adapter
- `frontend/src/pages/Whiteboard.tsx` - (update to use adapter if needed)
