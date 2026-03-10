import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    version: 'v1.0.0',
    title: 'OsanScheduler Authentication API',
    description: 'OsanScheduler provides team/site scheduling information'
  },
  host: `localhost:${process.env.PORT || 7010}`,
  basePath: '/api/v1',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['src/routes/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);