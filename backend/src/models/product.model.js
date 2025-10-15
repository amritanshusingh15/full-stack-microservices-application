const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true }, // WooCommerce product id
  title: { type: String },
  price: { type: String }, // may come as string per spec
  stock_status: { type: String }, // e.g., instock, outofstock
  stock_quantity: { type: Number, default: null },
  category: { type: String, default: null }, // first category name
  tags: { type: [String], default: [] }, // array of tag names
  on_sale: { type: Boolean, default: false },
  created_at: { type: String } // ISO string
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
