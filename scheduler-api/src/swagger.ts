import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    version: 'v1.0.0',
    title: 'OsanScheduler Scheduler API',
    description: 'OsanScheduler provides team/site scheduling information'
  },
  host: `localhost:${process.env.PORT || 7006}`,
  basePath: '/api/authentication',
  securityDefinitions: {
    authorization: {
      type: 'apiKey',
      name: 'authorization',
      in: 'header',
      description: 'Authentication token'
    },
    "refreshtoken": {
      type: 'apiKey',
      name: 'refreshtoken',
      in: 'header',
      description: 'Refresh token'
    }
  },
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['src/routes/index.routes.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);