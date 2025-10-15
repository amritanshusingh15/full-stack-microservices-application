const { evaluateSegment } = require('../services/segmentEvaluator.service');

async function evaluate(req, res) {
  try {
    const { rules } = req.body;
    if (typeof rules !== 'string') {
      return res.status(400).json({ success: false, error: 'rules (string) required in body' });
    }
    const results = await evaluateSegment(rules);
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = { evaluate };
