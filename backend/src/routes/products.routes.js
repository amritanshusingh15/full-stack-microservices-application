const express = require('express');
const router = express.Router();
const { getAllProducts } = require('../controllers/products.controller');

router.get('/products', getAllProducts);

module.exports = router;
