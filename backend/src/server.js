require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodeCron = require('node-cron');

const productsRoutes = require('./routes/products.routes');
const segmentsRoutes = require('./routes/segments.routes');
const { ingestProducts } = require('./services/wooIngest.service');
const setupDocs = require('./swagger');

const Product = require('./models/product.model');

const app = express();
app.use(cors());
app.use(express.json());

// mount routes
app.use('/', productsRoutes);
app.use('/', segmentsRoutes);

// swagger
setupDocs(app);

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Connect to Mongo
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/woo_segments_db';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGODB_URI, { })
  .then(() => {
    console.log('Connected to MongoDB');
    // start server after DB connection
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // run initial ingestion at startup
    (async () => {
      try {
        console.log('Running initial ingestion...');
        const res = await ingestProducts(process.env.WOO_BASE_URL, process.env.WOO_CONSUMER_KEY, process.env.WOO_CONSUMER_SECRET);
        console.log('Initial ingestion result:', res);
      } catch (err) {
        console.error('Initial ingestion failed:', err.message);
      }
    })();

    // schedule cron ingestion
    const schedule = process.env.INGEST_CRON_SCHEDULE || '*/30 * * * *'; // default every 30 mins
    nodeCron.schedule(schedule, async () => {
      try {
        console.log('Running scheduled ingestion...');
        const res = await ingestProducts(process.env.WOO_BASE_URL, process.env.WOO_CONSUMER_KEY, process.env.WOO_CONSUMER_SECRET);
        console.log('Scheduled ingestion result:', res);
      } catch (err) {
        console.error('Scheduled ingestion failed:', err.message);
      }
    });

  })
  .catch(err => {
    console.error('Mongo connection error:', err);
  });

module.exports = app;
