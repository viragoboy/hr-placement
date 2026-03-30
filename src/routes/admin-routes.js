const express = require('express');
const { CERTIFICATE_LEVELS } = require('../constants');
const { getApplicationContext } = require('../services/requester-service');
const { getAdminApplications, updatePreferredLocationStatus } = require('../services/application-service');
const { groupApplicationsByLocationAndStatus } = require('../utils/grouping');

const router = express.Router();

router.get('/admin/applications', async (req, res, next) => {
  try {
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'employee';
    const rows = await getAdminApplications(sortBy);
    const selectedSchool = req.query.school ? String(req.query.school) : '';
    const selectedStatus = req.query.status ? String(req.query.status) : '';
    const grouped = groupApplicationsByLocationAndStatus(rows, selectedSchool, selectedStatus);

    res.render('admin-dashboard', {
      grouped,
      sortBy,
      bannerMessage: process.env.BANNER_MESSAGE || '',
      selectedSchool,
      selectedStatus
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/applications/:id', async (req, res, next) => {
  try {
    const context = await getApplicationContext(Number(req.params.id));
    if (!context) {
      return res.status(404).send('Application not found.');
    }

    const selectedSchool = req.query.school ? String(req.query.school) : '';
    const selectedStatus = req.query.status ? String(req.query.status) : '';
    const filteredLocationStatuses = context.preferredLocationStatuses.filter((location) => {
      const schoolMatches = !selectedSchool || location.schoolName === selectedSchool;
      const statusMatches = !selectedStatus || location.status === selectedStatus;
      return schoolMatches && statusMatches;
    });

    res.render('request-form', {
      ...context,
      preferredLocationStatuses: filteredLocationStatuses,
      certificateLevels: CERTIFICATE_LEVELS,
      bannerMessage: process.env.BANNER_MESSAGE || '',
      errors: [],
      isReadOnly: true,
      isAdminView: true,
      selectedSortBy: req.query.sortBy ? String(req.query.sortBy) : 'employee',
      selectedSchool,
      selectedStatus
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/applications/:id/status', async (req, res, next) => {
  try {
    const schoolLoc = req.body.schoolLoc;
    if (!schoolLoc) {
      return res.status(400).send('Missing school location for status update.');
    }

    await updatePreferredLocationStatus(Number(req.params.id), schoolLoc, req.body.status);

    const returnToDetails = req.body.returnToDetails === 'true';
    if (!returnToDetails) {
      return res.redirect('/admin/applications');
    }

    const detailQuery = new URLSearchParams();
    if (req.body.selectedSchool) detailQuery.set('school', String(req.body.selectedSchool));
    if (req.body.selectedStatus) detailQuery.set('status', String(req.body.selectedStatus));
    if (req.body.selectedSortBy) detailQuery.set('sortBy', String(req.body.selectedSortBy));

    const detailPath = `/admin/applications/${Number(req.params.id)}`;
    res.redirect(detailQuery.toString() ? `${detailPath}?${detailQuery.toString()}` : detailPath);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
