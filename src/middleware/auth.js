function mockAuth(req, res, next) {
  // This app currently runs without a full auth provider in development.
  // We support header/query overrides so admins can test both personas.
  req.user = {
    userId: req.header('x-user-id') || req.query.asUser || 'u10001',
    role: req.header('x-role') || req.query.asRole || 'requester'
  };
  next();
}

module.exports = { mockAuth };
