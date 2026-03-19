import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import connectDB from './config/db';
import authRoutes from './api/authRoutes';
//import boardRoutes from './api/boardRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);   // api/auth/login for login
// app.use('/api/boards', boardRoutes);

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
