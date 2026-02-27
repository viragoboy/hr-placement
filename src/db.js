const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'hr_placement',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false'
  }
};

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

async function query(statement, bind = {}) {
  const p = await getPool();
  const req = p.request();
  Object.entries(bind).forEach(([key, value]) => req.input(key, value));
  return req.query(statement);
}

module.exports = { sql, getPool, query };
