function parseBool(value) {
  return value === 'on' || value === 'true' || value === true;
}

function normalizeRowKeys(row, expectedKeys) {
  if (!row) return row;

  // PostgreSQL drivers can return column names in different casing depending
  // on query style and aliases. We normalize once so route logic can use a
  // consistent camelCase contract.
  const lowerCaseLookup = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.toLowerCase(), value])
  );

  const normalized = { ...row };
  expectedKeys.forEach((key) => {
    const lowerCaseKey = key.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(lowerCaseLookup, lowerCaseKey)) {
      normalized[key] = lowerCaseLookup[lowerCaseKey];
    }
  });

  return normalized;
}

function normalizeRows(recordset, expectedKeys) {
  return recordset.map((row) => normalizeRowKeys(row, expectedKeys));
}

module.exports = { parseBool, normalizeRowKeys, normalizeRows };
