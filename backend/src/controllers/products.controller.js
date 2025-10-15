const Product = require('../models/product.model');

async function getAllProducts(req, res) {
  try {
    const products = await Product.find({}).lean();
    res.json({ success: true, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getAllProducts };
