const { parseCondition } = require('../services/segmentEvaluator.service');

test('parse simple conditions', () => {
  expect(parseCondition('price > 1000')).toEqual({ field: 'price', op: '>', value: 1000 });
  expect(parseCondition("stock_status = instock")).toEqual({ field: 'stock_status', op: '=', value: 'instock' });
  expect(parseCondition("on_sale = true")).toEqual({ field: 'on_sale', op: '=', value: true });
});
