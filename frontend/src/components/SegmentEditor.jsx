import React, { useState } from 'react';

export default function SegmentEditor({ onEvaluate }) {
  const [text, setText] = useState(`price > 1000\nstock_status = instock\non_sale = true`);

  function submit() {
    // simple client-side input validation: non-empty and lines simple
    if (!text.trim()) {
      alert('Enter at least one condition');
      return;
    }
    onEvaluate(text);
  }

  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={6} style={{ width: '100%' }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={submit}>Evaluate Segment</button>
      </div>
      <p style={{ fontSize: 12 }}>One condition per line. Examples: <code>price &gt; 1000</code>, <code>stock_status = instock</code>, <code>on_sale = true</code></p>
    </div>
  );
}
