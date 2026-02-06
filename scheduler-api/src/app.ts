import { config } from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from "./middleware/index.middleware";
import { connectToDB, createPool, createLogs } from 'scheduler-node-models/config';
import initialRoutes from './routes/initialRoutes'
import employeeRoutes from './routes/employeeRoutes';
import employeeAssignmentRoutes from './routes/employeeAssignmentRoutes';
import employeeVariationRoutes from './routes/employeeVariationRoutes';
import employeeLeaveRoutes from './routes/employeeLeaveRoutes';
import employeeBalanceRoutes from './routes/employeeBalanceRoutes';
import employeeMiscRoutes from './routes/employeeMiscRoutes';

connectToDB();
createPool();
createLogs('scheduler');

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
app.use('/api/scheduler', initialRoutes);
app.use('/api/scheduler', employeeRoutes);
app.use('/api/scheduler', employeeAssignmentRoutes);
app.use('/api/scheduler', employeeVariationRoutes);
app.use('/api/scheduler', employeeLeaveRoutes);
app.use('/api/scheduler', employeeBalanceRoutes);
app.use('/api/scheduler', employeeMiscRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;