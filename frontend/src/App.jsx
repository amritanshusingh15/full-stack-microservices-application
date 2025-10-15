import React, { useEffect, useState } from 'react';
import ProductCard from './components/ProductCard';
import SegmentEditor from './components/SegmentEditor';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function App() {
  const [products, setProducts] = useState([]);
  const [segmentResult, setSegmentResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/products`);
      const json = await resp.json();
      if (json.success) setProducts(json.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadProducts(); }, []);

  async function evaluateSegment(rules) {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/segments/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules })
      });
      const json = await resp.json();
      setSegmentResult(json);
    } catch (err) {
      console.error(err);
      setSegmentResult({ success: false, error: err.message });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <h1>Woo Products — Segment Editor</h1>
      <p>Products fetched from the ingestion microservice.</p>

      <section>
        <h2>Segment Editor</h2>
        <SegmentEditor onEvaluate={evaluateSegment} />
        <div style={{ marginTop: 12 }}>
          <h3>Result</h3>
          <pre style={{ background: '#f5f5f5', padding: 12, maxHeight: 300, overflow: 'auto' }}>
            {segmentResult ? JSON.stringify(segmentResult, null, 2) : 'No result yet.'}
          </pre>
        </div>
      </section>

      <hr />

      <section>
        <h2>Products {loading ? '(loading...)' : `(${products.length})`}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
