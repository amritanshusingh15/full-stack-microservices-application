const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Woo Segments API",
      version: "1.0.0",
      description: "API docs for WooCommerce ingestion and segment evaluation"
    }
  },
  apis: ['./src/routes/*.js'] // we can also programmatically add docs
};

const specs = swaggerJsdoc(options);

function setupDocs(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = setupDocs;
