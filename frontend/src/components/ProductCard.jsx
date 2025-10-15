import React from 'react';

export default function ProductCard({ product }) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
      <h3>{product.title}</h3>
      <div>Price: {product.price}</div>
      <div>Stock: {product.stock_status} {product.stock_quantity != null ? `(${product.stock_quantity})` : ''}</div>
      <div>Category: {product.category}</div>
      <div>Tags: {(product.tags || []).join(', ')}</div>
      <div>On Sale: {product.on_sale ? 'Yes' : 'No'}</div>
      <div style={{ fontSize: 12, color: '#666' }}>Created: {product.created_at}</div>
    </div>
  );
}
