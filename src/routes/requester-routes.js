const express = require('express');
const { CERTIFICATE_LEVELS } = require('../constants');
const { getRequesterContext, getApplicationContext } = require('../services/requester-service');
const {
  getEmployeeApplications,
  getApplicationOwner,
  getExistingPreferredLocations,
  insertApplication,
  updateApplication,
  replacePreferredLocations,
  addPreferredLocation
} = require('../services/application-service');
const { groupApplicationsByLocationAndStatus } = require('../utils/grouping');
const {
  parsePreferredLocations,
  mapApplicationBody,
  validateApplicationSubmission
} = require('../utils/application');

const router = express.Router();

router.get('/request', async (req, res, next) => {
  try {
    const context = await getRequesterContext(req.user.userId);
    if (context.application) {
      return res.redirect('/my/applications');
    }

    res.render('request-form', {
      ...context,
      certificateLevels: CERTIFICATE_LEVELS,
      bannerMessage: process.env.BANNER_MESSAGE || '',
      errors: [],
      isAdminView: false,
      isReadOnly: Boolean(context.application) || !context.user
    });
  } catch (err) {
    next(err);
  }
});

router.get('/my/applications', async (req, res, next) => {
  try {
    const rows = await getEmployeeApplications(req.user.userId);
    const selectedSchool = req.query.school ? String(req.query.school) : '';
    const selectedStatus = req.query.status ? String(req.query.status) : '';

    const grouped = groupApplicationsByLocationAndStatus(rows, selectedSchool, selectedStatus);

    res.render('employee-dashboard', {
      grouped,
      selectedSchool,
      selectedStatus,
      bannerMessage: process.env.BANNER_MESSAGE || ''
    });
  } catch (err) {
    next(err);
  }
});

router.get('/my/applications/:id', async (req, res, next) => {
  try {
    const applicationId = Number(req.params.id);
    const context = await getApplicationContext(applicationId);
    if (!context || context.user?.userId !== req.user.userId) {
      return res.status(404).send('Application not found.');
    }

    const selectedSchoolLoc = req.query.schoolLoc ? String(req.query.schoolLoc) : '';
    const selectedLocationStatus = selectedSchoolLoc
      ? context.preferredLocationStatuses.find((location) => location.schoolLoc === selectedSchoolLoc)
      : context.preferredLocationStatuses[0] || null;

    res.render('employee-application-details', {
      ...context,
      certificateLevels: CERTIFICATE_LEVELS,
      selectedLocationStatus,
      errors: [],
      bannerMessage: process.env.BANNER_MESSAGE || '',
      isReadOnly: true
    });
  } catch (err) {
    next(err);
  }
});

router.post('/my/applications/:id/schools', async (req, res, next) => {
  try {
    const applicationId = Number(req.params.id);
    const application = await getApplicationOwner(applicationId);
    if (!application || application.requesterId !== req.user.userId) {
      return res.status(404).send('Application not found.');
    }

    const existingLocations = await getExistingPreferredLocations(applicationId);
    const submittedLocations = [...new Set(parsePreferredLocations(req.body.preferredLocations))];

    // We intentionally disallow removals here because once workflow starts,
    // admins may already be reviewing these preferred locations.
    const missingExistingLocation = existingLocations.find((location) => !submittedLocations.includes(location));
    if (missingExistingLocation) {
      return res.status(400).send('Previously selected schools cannot be removed.');
    }

    for (const schoolLoc of submittedLocations) {
      if (existingLocations.includes(schoolLoc)) continue;
      await addPreferredLocation(applicationId, schoolLoc);
    }

    const redirectSchoolLoc = req.body.selectedSchoolLoc ? String(req.body.selectedSchoolLoc) : '';
    res.redirect(redirectSchoolLoc
      ? `/my/applications/${applicationId}?schoolLoc=${encodeURIComponent(redirectSchoolLoc)}`
      : `/my/applications/${applicationId}`);
  } catch (err) {
    next(err);
  }
});

router.post('/request', async (req, res, next) => {
  try {
    const context = await getRequesterContext(req.user.userId);
    if (!context.user) {
      return res.status(422).render('request-form', {
        ...context,
        certificateLevels: CERTIFICATE_LEVELS,
        errors: ['Your user profile was not found. Please contact an administrator before submitting a request.'],
        bannerMessage: process.env.BANNER_MESSAGE || '',
        isAdminView: false,
        isReadOnly: true
      });
    }

    const existing = context.application;
    const isReadOnly = Boolean(existing);
    if (isReadOnly) {
      return res.status(400).send('Application is no longer editable.');
    }

    const { errors, preferredLocations } = validateApplicationSubmission(req.body, CERTIFICATE_LEVELS);
    if (errors.length) {
      return res.status(422).render('request-form', {
        ...context,
        certificateLevels: CERTIFICATE_LEVELS,
        errors,
        bannerMessage: process.env.BANNER_MESSAGE || '',
        isAdminView: false,
        isReadOnly,
        application: { ...(context.application || {}), ...req.body },
        selectedLocations: preferredLocations
      });
    }

    const applicationValues = mapApplicationBody(req.body);

    if (!existing) {
      const applicationId = await insertApplication(req.user.userId, applicationValues);
      await replacePreferredLocations(applicationId, preferredLocations);
    } else {
      await updateApplication(existing.id, applicationValues);
      await replacePreferredLocations(existing.id, preferredLocations);
    }

    res.redirect('/request');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
