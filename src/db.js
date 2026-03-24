const { Pool } = require('pg');

const config = {
  host: process.env.PGHOST || process.env.DB_SERVER || 'localhost',
  port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
  database: process.env.PGDATABASE || process.env.DB_NAME || 'hr_placement',
  user: process.env.PGUSER || process.env.DB_USER,
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
  ssl: process.env.DB_ENCRYPT === 'true'
    ? { rejectUnauthorized: process.env.DB_TRUST_SERVER_CERT === 'false' }
    : false
};

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool(config);
  }
  return pool;
}

function normalizeStatement(statement, bind = {}) {
  const parameterOrder = [];
  const parameterIndex = new Map();

  let text = '';
  let i = 0;
  let inSingleQuote = false;

  while (i < statement.length) {
    const current = statement[i];

    if (current === "'") {
      text += current;
      if (inSingleQuote && statement[i + 1] === "'") {
        text += statement[i + 1];
        i += 2;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      i += 1;
      continue;
    }

    if (!inSingleQuote && current === '@') {
      const match = statement.slice(i).match(/^@([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (match) {
        const key = match[1];
        if (!Object.prototype.hasOwnProperty.call(bind, key)) {
          throw new Error(`Missing bind parameter: ${key}`);
        }

        if (!parameterIndex.has(key)) {
          parameterOrder.push(key);
          parameterIndex.set(key, parameterOrder.length);
        }

        text += `$${parameterIndex.get(key)}`;
        i += key.length + 1;
        continue;
      }
    }

    text += current;
    i += 1;
  }

  const values = parameterOrder.map((key) => bind[key]);
  return { text, values };
}

async function query(statement, bind = {}) {
  const client = getPool();
  const normalized = normalizeStatement(statement, bind);
  const values = Array.isArray(normalized.values) ? normalized.values : [];
  const result = await client.query({ text: normalized.text, values });
  return { ...result, recordset: result.rows };
}

module.exports = { getPool, query };
