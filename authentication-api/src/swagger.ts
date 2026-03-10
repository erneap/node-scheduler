import swaggerAutogen from "swagger-autogen";

const port = process.env.PORT || 7004;

const doc = {
  info: {
    version: 'v1.0.0',
    title: 'Osan Scheduler Authentication API',
    description: 'Osan Scheduler Authentication handles all authentication and user requests'
  },
  host: `localhost:${port}`,
  basePath: '/',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = [ 'src/routes/authenticateRoutes.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);