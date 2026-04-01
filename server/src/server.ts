import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import cookieParser from 'cookie-parser';
import rateLimiter from './middleware/rateLimiter.js';

import connectDB from './config/db.js';


import authRoutes from './routers/authRoutes.js';
import userRoutes from './routers/userRoutes.js';
import boardRoutes from './routers/boardRoutes.js';

const app = express();

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
/*
// Required for cookies to work cross-origin
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

*/
app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);

connectDB();



app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);

const server = http.createServer(app);

const PORT = process.env.PORT;
if(!PORT) {
    throw new Error("PORT is not defined in .env");
}
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
