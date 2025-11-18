import { config } from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from "./middleware/index.middleware";
import { connectToDB } from './config/mongoconnect';
import authenticateRoutes from './routes/authenticateRoutes';
import resetRoutes from './routes/resetRoutes';
import userRoutes from './routes/userRoutes';
import usersRoutes from './routes/usersRoutes';

connectToDB();

const app = express();

app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());
app.use(cors({
  origin: ['https://www.osanscheduler.com', 'https://osanscheduler.com', 'http://localhost:4200', 'https://docker'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  exposedHeaders: ['Content-Type', 'Authorization', 'refreshToken', 'X-Custom-Header']
}));
app.use(express.json({ limit: '10mb'}));

// add routes to the application interface
app.use('/api/authentication', authenticateRoutes);
app.use('/api/authentication', resetRoutes);
app.use('/api/authentication', userRoutes);
app.use('/api/authentication', usersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;