import dotenv from 'dotenv';
import  express from "express";
import cors from 'cors';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json';
import { connectToDB } from 'scheduler-node-models/config';

dotenv.config();
connectToDB();

const app = express();

app.use(cors({ 
  origin: process.env.CORS_ORIGIN, 
  credentials: true,
  exposedHeaders: ['Content-Type', 'Authorization', 'refreshToken', 'X-Custom-Header']
}));
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '16kb'}));
app.use(express.static('public'));

app.use('/api/authentication', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;