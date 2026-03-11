import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from "./middleware/index.middleware";
import { connectToDB, createPool, createLogs } from 'scheduler-node-models/config';
import indexRoutes from './routes/index.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json';


dotenv.config();
connectToDB();
createPool();

const app = express();

app.use(cors({ 
  origin: process.env.CORS_ORIGIN, 
  credentials: true,
  exposedHeaders: ['Content-Type', 'Authorization', 'refreshToken', 'X-Custom-Header']
}));
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '16kb'}));
app.use(express.static('public'));

// add routes to the application interface
app.use('/api/scheduler', indexRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(notFound);
app.use(errorHandler);

export default app;