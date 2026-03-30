const express = require('express');
const { mockAuth } = require('./middleware/auth');
const requesterRoutes = require('./routes/requester-routes');
const adminRoutes = require('./routes/admin-routes');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(mockAuth);

app.get('/', (req, res) => {
  if (req.user.role === 'admin') {
    return res.redirect('/admin/applications');
  }

  return res.redirect('/request');
});

app.use(requesterRoutes);
app.use(adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Unexpected server error');
});

module.exports = app;
