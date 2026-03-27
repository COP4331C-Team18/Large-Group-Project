import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
// Change these:
import connectDB from './config/db';
import authRoutes from './api/authRoutes';
import userRoutes from './api/userRoutes';
import boardRoutes from './api/boardRoutes';

const app = express();
app.use(cors());
app.use(express.json());

connectDB();


app.use('/api/auth', authRoutes);
// Can be uncommented when these routes are implemented (mainly CRUD stuff + board related stuff)
/*
    app.use('/api/users', userRoutes);
    app.use('/api/boards', boardRoutes);
*/
const server = http.createServer(app);

const PORT = process.env.PORT;
if(!PORT) {
    throw new Error("PORT is not defined in .env");
}
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
