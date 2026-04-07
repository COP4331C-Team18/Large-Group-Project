// Exporting the app separately from the server lets us 
// cleanly import it for our tests without actually starting the server
// Follows the exact same stuff as server.ts just moved here and without the http and Socket.io setup
// Also loading the .env here so that it's available for the tests as well
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimiter from './middleware/rateLimiter';
import authRoutes from './routers/authRoutes';
import userRoutes from './routers/userRoutes';
import boardRoutes from './routers/boardRoutes';

const app = express();

// ── Security Headers & COOP ────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

const corsOptions = {
  origin: ['http://localhost:5173', 'https://inkboard.xyz'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(rateLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);

export default app;
