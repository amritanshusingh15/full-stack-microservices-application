const Product = require('../models/product.model');

/**
 * Parse a single line like: `price > 1000` or `stock_status = instock` or `on_sale = true`
 * Returns an object: { field, op, value }
 */
function parseCondition(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // support operators in order of multi-char first
  const operators = ['>=', '<=', '!=', '==', '=', '>', '<'];
  let found = null;
  for (const op of operators) {
    const idx = trimmed.indexOf(op);
    if (idx !== -1) {
      found = { op, idx };
      break;
    }
  }
  if (!found) throw new Error(`Invalid condition (no operator found): "${line}"`);
  const op = found.op;
  const parts = trimmed.split(op);
  if (parts.length !== 2) throw new Error(`Malformed condition: "${line}"`);
  const field = parts[0].trim();
  let rawValue = parts[1].trim();

  // normalize booleans and numbers
  let value = rawValue;
  // if value wrapped in quotes remove them
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  } else if (/^(true|false)$/i.test(value)) {
    value = value.toLowerCase() === 'true';
  } else if (!isNaN(Number(value))) {
    // numeric
    value = Number(value);
  }
  return { field, op, value };
}

/**
 * Build a MongoDB query from parsed conditions
 * For simplicity, we map ops to Mongo operators or do transformations
 */
function buildMongoQuery(conditions) {
  const query = {};
  for (const c of conditions) {
    const { field, op, value } = c;

    // Only allow whitelisted fields (to avoid injection)
    const allowedFields = ['price','stock_status','stock_quantity','category','tags','on_sale','created_at','title','id'];
    if (!allowedFields.includes(field)) {
      throw new Error(`Unsupported field "${field}". Allowed fields: ${allowedFields.join(', ')}`);
    }

    // Special handling for price (stored as string)
    if (field === 'price') {
      // We'll convert price in DB query by matching numeric comparisons on Number(price)
      // Mongo doesn't easily cast in query without aggregation. We'll do server-side filtering after fetching a subset.
      // For now, we'll store this condition separately as 'postFilter' to apply in JS.
      query.__postFilters = query.__postFilters || [];
      query.__postFilters.push({ field, op, value });
      continue;
    }

    // tags: check membership
    if (field === 'tags') {
      if (op === '=' || op === '==') {
        query.tags = value;
      } else if (op === '!=') {
        query.tags = { $ne: value };
      } else {
        throw new Error('Unsupported operator for tags: ' + op);
      }
      continue;
    }

    // on_sale: boolean
    if (field === 'on_sale') {
      if (typeof value !== 'boolean') throw new Error('on_sale expects true/false');
      query.on_sale = value;
      continue;
    }

    // stock_quantity numeric
    if (field === 'stock_quantity') {
      switch (op) {
        case '=':
        case '==':
          query.stock_quantity = value;
          break;
        case '!=':
          query.stock_quantity = { $ne: value };
          break;
        case '>':
          query.stock_quantity = { $gt: value };
          break;
        case '<':
          query.stock_quantity = { $lt: value };
          break;
        case '>=':
          query.stock_quantity = { $gte: value };
          break;
        case '<=':
          query.stock_quantity = { $lte: value };
          break;
        default:
          throw new Error('Invalid operator for stock_quantity');
      }
      continue;
    }

    // created_at (ISO string): we'll allow equality or range with ISO strings or YYYY-MM-DD
    if (field === 'created_at') {
      // convert value to ISO if it's a string date
      const dt = (typeof value === 'string') ? new Date(value) : null;
      if (isNaN(dt)) {
        // if not a valid date, treat as string equality
        if (op === '=' || op === '==') {
          query.created_at = value;
        } else {
          throw new Error('Invalid date for created_at');
        }
      } else {
        switch (op) {
          case '>':
            query.created_at = { $gt: dt.toISOString() };
            break;
          case '<':
            query.created_at = { $lt: dt.toISOString() };
            break;
          case '>=':
            query.created_at = { $gte: dt.toISOString() };
            break;
          case '<=':
            query.created_at = { $lte: dt.toISOString() };
            break;
          case '=':
          case '==':
            query.created_at = dt.toISOString();
            break;
          default:
            throw new Error('Invalid operator for created_at');
        }
      }
      continue;
    }

    // stock_status and category and title and id
    if (['stock_status','category','title','id'].includes(field)) {
      if (op === '=' || op === '==') {
        query[field] = value;
      } else if (op === '!=') {
        query[field] = { $ne: value };
      } else if (['>','<','>=','<='].includes(op)) {
        // numeric compare only valid for 'id'
        if (field === 'id') {
          const map = { '>': '$gt', '<': '$lt', '>=': '$gte', '<=': '$lte' };
          query.id = { [map[op]]: value };
        } else {
          throw new Error(`Operator ${op} unsupported for field ${field}`);
        }
      } else {
        throw new Error('Unsupported operator: ' + op);
      }
      continue;
    }

    throw new Error(`Unhandled field ${field}`);
  }
  return query;
}

/**
 * Evaluate segment rules: input is string with one condition per line
 * Returns filtered product documents
 */
async function evaluateSegment(rulesText) {
  if (!rulesText || typeof rulesText !== 'string') throw new Error('rulesText required');

  // split into lines; parse conditions
  const lines = rulesText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('At least one condition required');

  const parsed = lines.map(parseCondition);

  // Build query
  const mongoQuery = buildMongoQuery(parsed);

  // pull __postFilters out for price (since price stored as string)
  const postFilters = mongoQuery.__postFilters || [];
  delete mongoQuery.__postFilters;

  // Query DB
  const candidates = await Product.find(mongoQuery).lean();

  // JS-level filtering for postFilters (price)
  const result = candidates.filter(doc => {
    for (const pf of postFilters) {
      const { field, op, value } = pf;
      if (field === 'price') {
        // convert doc.price to number
        const num = Number(doc.price);
        if (isNaN(num)) return false;
        switch (op) {
          case '>': if (!(num > value)) return false; break;
          case '<': if (!(num < value)) return false; break;
          case '>=': if (!(num >= value)) return false; break;
          case '<=': if (!(num <= value)) return false; break;
          case '=':
          case '==': if (!(num === value)) return false; break;
          case '!=': if (!(num !== value)) return false; break;
          default: return false;
        }
      } else {
        // other postFilter types (not used) - fail safe
        return false;
      }
    }
    return true;
  });

  return result;
}

module.exports = { parseCondition, buildMongoQuery, evaluateSegment };
