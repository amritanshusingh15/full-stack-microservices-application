const express = require('express');
const router = express.Router();
const { evaluate } = require('../controllers/segments.controller');

router.post('/segments/evaluate', evaluate);

module.exports = router;
