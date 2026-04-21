# Quick Start: Using Socket.IO Fallback in Whiteboard

## Minimal Change to Whiteboard.tsx

Replace the `connectToCollabServer` function with socket.io-enabled version:

### Original Code (before line 1332)
```typescript
const connectToCollabServer = useCallback((sessionId: string) => {
  if (wsRef.current) return; // already connected

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:9001';
  const ws = new WebSocket(WS_URL);
  wsRef.current = ws;
  ws.binaryType = 'arraybuffer';
  // ... rest of the code
```

### Updated Code (use socket.io fallback)
```typescript
import { createYjsConnection } from '@/utils/yjsSocketAdapter';

const connectToCollabServer = useCallback((sessionId: string) => {
  if (wsRef.current) return; // already connected

  // Use socket.io fallback if USESOCKETIO is true, otherwise use WebSocket
  const ws = createYjsConnection({
    useSocketIO: import.meta.env.USESOCKETIO === 'true',
  });
  
  wsRef.current = ws;
  // ws.binaryType is already set by the adapter
  
  // ... rest of the code stays exactly the same!
```

## Environment Setup

### .env (root directory)
```bash
# Frontend
USESOCKETIO=false    # Set to true to use socket.io
VITE_WS_URL=ws://localhost:9001

# Server
PORT=5000
API_URL=http://localhost:5001
INTERNAL_SECRET=your_secret_here
```

### server/.env
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inksubserver
INTERNAL_SECRET=your_secret_here
API_URL=http://localhost:5001
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Two Ways to Run

### Way 1: Keep Using Inksubserver (Current Setup)
```bash
# Terminal 1: Inksubserver
cd inksubserver
./scripts/run_local.sh

# Terminal 2: Node.js Server
cd server
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Way 2: Use Socket.IO Fallback (No Inksubserver)
```bash
# Terminal 1: Node.js Server (handles both API + Yjs collab)
cd server
npm run dev

# Terminal 2: Frontend
cd frontend
USESOCKETIO=true npm run dev
```

## How to Test

### Test 1: Basic Connection
```bash
# With inksubserver
npm run dev  # frontend with USESOCKETIO=false (default)

# Check browser console:
# ✓ "Connecting to room..." message appears
# ✓ "Collab active" after 2-3 seconds
```

### Test 2: Multiple Users
1. Open board in Tab A
2. Create new incognito window, join same board
3. Both tabs should see:
   - User count increases to 2
   - Cursor position syncs
   - Drawing strokes appear on both

### Test 3: State Persistence
1. Open board and draw something
2. Refresh page
3. Drawing should still be there (persisted to MongoDB)
4. Other users should see it too

### Test 4: Switch Between Modes
```bash
# Run with socket.io
USESOCKETIO=true npm run dev

# Then switch back
VITE_WS_URL=ws://localhost:9001 npm run dev
```

## Verification Checklist

- [ ] Server starts without errors
  ```bash
  npm run dev  # in server/ directory
  ```

- [ ] Frontend loads
  ```bash
  npm run dev  # in frontend/ directory
  ```

- [ ] Board creation works
  - Click "Create Board"
  - Board appears in list

- [ ] Collaboration works
  - Create/edit board
  - Check `USESOCKETIO` environment
  - Server logs show `[yjs]` events
  - Drawing syncs to other connected users

- [ ] Persistence works
  - Draw something
  - Refresh page
  - Strokes remain
  - Check MongoDB has `Board.yjsUpdate` field

- [ ] Error handling works
  - Stop server
  - Frontend shows "Reconnecting..." message
  - Restart server
  - Frontend auto-reconnects

## Debugging

### Check Connection Mode
Browser console:
```javascript
// Check if using socket.io
window.io  // should exist if socket.io is loaded
localStorage  // check for socket.io debug logs
```

### Enable Debug Logs
```bash
# Frontend
DEBUG=* npm run dev

# Server
DEBUG=socket.io* npm run dev
```

### Check Room State
```bash
# Server logs should show:
[yjs] <socket_id> joined <sessionId> | Room size: 1
[yjs] Fetched X bytes for room <sessionId>
[yjs] hydrated <sessionId> with N updates
[yjs] Threshold reached (512000 bytes) for <sessionId>. Flushed to API.
```

## Common Issues & Fixes

### Issue: "Connection error" in UI
```bash
# Check 1: Is server running?
curl http://localhost:5000/api/boards

# Check 2: Is socket.io mode set correctly?
grep USESOCKETIO .env

# Check 3: Check browser console for specific error
```

### Issue: "Reconnecting" loop
```bash
# Server crashed or socket.io not responding
npm run dev  # in server/ directory to restart

# Browser will auto-reconnect with exponential backoff
```

### Issue: Drawings not syncing between users
```bash
# Check 1: Are both users in same room?
# Server logs should show both users with same sessionId

# Check 2: Is Yjs update being sent?
# Check network tab - should see websocket/socket.io messages

# Check 3: Is binary type set correctly?
# adapter handles this automatically, but check console
```

### Issue: Data not persisting
```bash
# Check 1: Is MongoDB running?
mongosh  # test connection

# Check 2: Check INTERNAL_SECRET is set
grep INTERNAL_SECRET .env

# Check 3: Check API_URL is correct
curl http://localhost:5001/api/boards/yjs/test
```

## Next Steps

1. **Test the fallback**: 
   - Set `USESOCKETIO=true` 
   - Stop inksubserver
   - Verify everything still works

2. **Production deployment**:
   - Remove inksubserver from deployment
   - Socket.IO fallback handles everything
   - Simpler DevOps (one process instead of two)

3. **Performance tuning** (if needed):
   - Adjust buffer size in server.ts (512 KB default)
   - Add Redis for horizontal scaling
   - Consider compression settings

4. **Monitor health**:
   - Log room sizes and buffer flushes
   - Track connection success rates
   - Monitor update latency
