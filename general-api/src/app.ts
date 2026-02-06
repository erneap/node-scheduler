import { config } from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from "./middleware/index.middleware";
import { connectToDB, createPool } from 'scheduler-node-models/config';
import printRoutes from './routes/printRoutes';
import logsRoutes from './routes/logsRoutes';
import noticeRoutes from './routes/noticeRoutes';

connectToDB();
createPool();

const app = express();

app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());
app.use(cors({
  origin: ['https://www.osanscheduler.com', 'https://osanscheduler.com', 'http://localhost:4200', 'https://docker', 'null'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  exposedHeaders: [
    'Content-Type', 'Authorization', 
    'refreshToken', 'X-Custom-Header',
    'Content-Disposition'
  ]
}));
app.use(express.json({ limit: '10mb'}));

// add routes to the application interface
app.use('/api/general', printRoutes);
app.use('/api/general', logsRoutes);
app.use('/api/general', noticeRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;