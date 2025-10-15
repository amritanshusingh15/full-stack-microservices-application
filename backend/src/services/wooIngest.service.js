const axios = require('axios');
const Product = require('../models/product.model');

const ingestProducts = async (baseUrl, consumerKey, consumerSecret) => {
  // Use query auth as the assignment requests
  const url = `${baseUrl}/wp-json/wc/v3/products?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}&per_page=100`;

  // pagination support: WooCommerce may return max per_page; we'll loop pages until empty
  let page = 1;
  let fetched = 0;
  let totalSaved = 0;

  while (true) {
    const pageUrl = `${url}&page=${page}`;
    const resp = await axios.get(pageUrl, { timeout: 20000 });
    const items = resp.data;
    if (!Array.isArray(items) || items.length === 0) break;

    fetched += items.length;

    // map items
    for (const item of items) {
      const doc = {
        id: item.id,
        title: item.name,
        price: item.price != null ? String(item.price) : "",
        stock_status: item.stock_status || null,
        stock_quantity: item.stock_quantity != null ? item.stock_quantity : null,
        category: (Array.isArray(item.categories) && item.categories.length > 0) ? item.categories[0].name : null,
        tags: Array.isArray(item.tags) ? item.tags.map(t => t.name) : [],
        on_sale: !!item.on_sale,
        created_at: item.date_created || item.date_created_gmt || null
      };

      // upsert by id
      await Product.findOneAndUpdate({ id: doc.id }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
      totalSaved++;
    }

    // if fewer than per_page, finish
    if (items.length < 100) break;
    page++;
  }

  return { fetched, totalSaved };
};

module.exports = { ingestProducts };
