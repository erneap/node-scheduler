import dotenv from 'dotenv';
import  express from "express";
import cors from 'cors';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true}));
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '16kb'}));
app.use(express.static('public'));

app.use('/api/v1', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;