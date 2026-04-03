import WebSocket from 'ws';

const URL = 'ws://localhost:9001';
const TOTAL_USERS = 10000;
const STAGGER_MS = 2; // 2ms between connections to avoid CPU spikes

console.log(`🚀 Launching 10,000 users with mixed distribution...`);

for (let i = 0; i < TOTAL_USERS; i++) {
    setTimeout(() => {
        const ws = new WebSocket(URL);
        
        // DISTRIBUTION LOGIC:
        // Users 0-4999: Go into "crowded_0" through "crowded_9" (500 users/room)
        // Users 5000-9999: Go into "solo_5000" through "solo_9999" (1 user/room)
        let roomId;
        if (i < 5000) {
            roomId = `crowded_${i % 10}`; 
        } else {
            roomId = `solo_${i}`;
        }

        ws.on('open', () => {
            // Join Room
            ws.send(JSON.stringify({ type: 'join', sessionId: roomId }));

            // Simulate drawing: 1KB update every 4 seconds
            setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(Buffer.alloc(1024, i % 255));
                }
            }, 4000);
        });

        ws.on('error', () => {}); // Ignore disconnects during flood
        
        if (i % 1000 === 0) console.log(`[stress] Connected ${i} users...`);
    }, i * STAGGER_MS);
}