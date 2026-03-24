const express = require('express');
const { query } = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const CERTIFICATE_LEVELS = ['T4', 'T5', 'T6', 'S4', 'S5', 'S6', 'L4', 'L5', 'L6'];
const REQUESTER_USER_KEYS = ['userId', 'displayName', 'currentJobName', 'currentSchoolLoc', 'currentSchoolName', 'principal'];
const JOB_KEYS = ['id', 'jobName'];
const APPLICATION_KEYS = [
  'id',
  'requesterId',
  'formStatus',
  'curPositionType',
  'reasonForRequest',
  'verifyPDP',
  'verifyCertificate',
  'yearsOfTeaching',
  'yearsOfAdmin',
  'yearsOfCertificated',
  'yearsTotalGCPS',
  'yearsTotalExpNonGCPS',
  'verifyInvoluntarilyToCurLoc',
  'verifyToHeadCoach',
  'verifyToSpecialEd',
  'prefTeachingAssignment1',
  'additionalInfo1',
  'prefTeachingAssignment2',
  'additionalInfo2',
  'prefTeachingAssignment3',
  'additionalInfo3',
  'speaksFrench',
  'speaksKorean',
  'speaksSpanish',
  'speaksOther',
  'otherLang',
  'extraCurriculum',
  'certificationID',
  'fieldCertification',
  'certificateLevel',
  'areaOfConcentration',
  'otherReason',
  'dateSubmitted'
];

function parseBool(value) {
  return value === 'on' || value === 'true' || value === true;
}

function normalizeRowKeys(row, expectedKeys) {
  if (!row) return row;
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

function auth(req, res, next) {
  req.user = {
    userId: req.header('x-user-id') || req.query.asUser || 'u10001',
    role: req.header('x-role') || req.query.asRole || 'requester'
  };
  next();
}

app.use(auth);

async function getRequesterContext(userId) {
  const userResult = await query(`
    SELECT u.userId, u.displayName, u.currentJobName, u.currentSchoolLoc, s.locname AS currentSchoolName, s.principal
    FROM Users u
    LEFT JOIN Schools s ON s.loc = u.currentSchoolLoc
    WHERE u.userId = @userId
  `, { userId });

  const schoolsResult = await query('SELECT loc, locname, category FROM Schools ORDER BY category, locname');
  const jobsResult = await query('SELECT id, jobName FROM jobs ORDER BY jobName');
  const applicationResult = await query(`
    SELECT a.*,
      j1.jobName AS prefJobName1,
      j2.jobName AS prefJobName2,
      j3.jobName AS prefJobName3
    FROM Applications a
    LEFT JOIN jobs j1 ON j1.id = a.prefTeachingAssignment1
    LEFT JOIN jobs j2 ON j2.id = a.prefTeachingAssignment2
    LEFT JOIN jobs j3 ON j3.id = a.prefTeachingAssignment3
    WHERE a.requesterId = @userId
  `, { userId });

  const user = normalizeRowKeys(userResult.recordset[0], REQUESTER_USER_KEYS);
  const jobs = jobsResult.recordset.map((job) => normalizeRowKeys(job, JOB_KEYS));
  const application = normalizeRowKeys(applicationResult.recordset[0], APPLICATION_KEYS);

  let selectedLocations = [];
  if (application) {
    const pref = await query(
      'SELECT schoolLoc FROM ApplicationPreferredLocations WHERE applicationId = @applicationId',
      { applicationId: application.id }
    );
    selectedLocations = pref.recordset.map((r) => r.schoolLoc);
  }

  return {
    user,
    schools: schoolsResult.recordset,
    jobs,
    application,
    selectedLocations
  };
}

app.get('/', (req, res) => {
  if (req.user.role === 'admin') {
    return res.redirect('/admin/applications');
  }
  return res.redirect('/request');
});

app.get('/request', async (req, res, next) => {
  try {
    const context = await getRequesterContext(req.user.userId);
    res.render('request-form', {
      ...context,
      certificateLevels: CERTIFICATE_LEVELS,
      bannerMessage: process.env.BANNER_MESSAGE || '',
      errors: [],
      isReadOnly: Boolean(context.application) || !context.user
    });
  } catch (err) {
    next(err);
  }
});

app.post('/request', async (req, res, next) => {
  try {
    const context = await getRequesterContext(req.user.userId);
    if (!context.user) {
      return res.status(422).render('request-form', {
        ...context,
        certificateLevels: CERTIFICATE_LEVELS,
        errors: ['Your user profile was not found. Please contact an administrator before submitting a request.'],
        bannerMessage: process.env.BANNER_MESSAGE || '',
        isReadOnly: true
      });
    }

    const existing = context.application;
    const isReadOnly = Boolean(existing);

    if (isReadOnly) {
      return res.status(400).send('Application is no longer editable.');
    }

    const preferredLocations = Array.isArray(req.body.preferredLocations)
      ? req.body.preferredLocations
      : req.body.preferredLocations
        ? [req.body.preferredLocations]
        : [];

    const assignments = [req.body.prefTeachingAssignment1, req.body.prefTeachingAssignment2, req.body.prefTeachingAssignment3]
      .filter(Boolean)
      .map((v) => Number(v));

    const errors = [];
    if (!preferredLocations.length) errors.push('Select at least one preferred location.');
    if (assignments.length < 1 || assignments.length > 3) errors.push('Select between one and three preferred assignments.');
    if (!CERTIFICATE_LEVELS.includes(req.body.certificateLevel)) errors.push('Invalid certificate level selected.');

    if (errors.length) {
      return res.status(422).render('request-form', {
        ...context,
        certificateLevels: CERTIFICATE_LEVELS,
        errors,
        bannerMessage: process.env.BANNER_MESSAGE || '',
        isReadOnly,
        application: { ...(context.application || {}), ...req.body },
        selectedLocations: preferredLocations
      });
    }

    if (!existing) {
      const inserted = await query(`
        INSERT INTO Applications (
          requesterId, formStatus, curPositionType, reasonForRequest, verifyPDP, verifyCertificate,
          yearsOfTeaching, yearsOfAdmin, yearsOfCertificated, yearsTotalGCPS, yearsTotalExpNonGCPS,
          verifyInvoluntarilyToCurLoc, verifyToHeadCoach, verifyToSpecialEd,
          prefTeachingAssignment1, additionalInfo1, prefTeachingAssignment2, additionalInfo2, prefTeachingAssignment3, additionalInfo3,
          speaksFrench, speaksKorean, speaksSpanish, speaksOther, otherLang, extraCurriculum,
          certificationID, fieldCertification, certificateLevel, areaOfConcentration, otherReason, dateSubmitted
        ) VALUES (
          @requesterId, 'Submitted', @curPositionType, @reasonForRequest, @verifyPDP, @verifyCertificate,
          @yearsOfTeaching, @yearsOfAdmin, @yearsOfCertificated, @yearsTotalGCPS, @yearsTotalExpNonGCPS,
          @verifyInvoluntarilyToCurLoc, @verifyToHeadCoach, @verifyToSpecialEd,
          @prefTeachingAssignment1, @additionalInfo1, @prefTeachingAssignment2, @additionalInfo2, @prefTeachingAssignment3, @additionalInfo3,
          @speaksFrench, @speaksKorean, @speaksSpanish, @speaksOther, @otherLang, @extraCurriculum,
          @certificationID, @fieldCertification, @certificateLevel, @areaOfConcentration, @otherReason, NOW()
        ) RETURNING id
      `, {
        requesterId: req.user.userId,
        ...mapApplicationBody(req.body)
      });

      const applicationId = inserted.recordset[0].id;
      for (const schoolLoc of preferredLocations) {
        await query(
          "INSERT INTO ApplicationPreferredLocations (applicationId, schoolLoc, status) VALUES (@applicationId, @schoolLoc, 'Pending')",
          { applicationId, schoolLoc }
        );
      }
    } else {
      await query(`
        UPDATE Applications SET
          curPositionType = @curPositionType,
          reasonForRequest = @reasonForRequest,
          verifyPDP = @verifyPDP,
          verifyCertificate = @verifyCertificate,
          yearsOfTeaching = @yearsOfTeaching,
          yearsOfAdmin = @yearsOfAdmin,
          yearsOfCertificated = @yearsOfCertificated,
          yearsTotalGCPS = @yearsTotalGCPS,
          yearsTotalExpNonGCPS = @yearsTotalExpNonGCPS,
          verifyInvoluntarilyToCurLoc = @verifyInvoluntarilyToCurLoc,
          verifyToHeadCoach = @verifyToHeadCoach,
          verifyToSpecialEd = @verifyToSpecialEd,
          prefTeachingAssignment1 = @prefTeachingAssignment1,
          additionalInfo1 = @additionalInfo1,
          prefTeachingAssignment2 = @prefTeachingAssignment2,
          additionalInfo2 = @additionalInfo2,
          prefTeachingAssignment3 = @prefTeachingAssignment3,
          additionalInfo3 = @additionalInfo3,
          speaksFrench = @speaksFrench,
          speaksKorean = @speaksKorean,
          speaksSpanish = @speaksSpanish,
          speaksOther = @speaksOther,
          otherLang = @otherLang,
          extraCurriculum = @extraCurriculum,
          certificationID = @certificationID,
          fieldCertification = @fieldCertification,
          certificateLevel = @certificateLevel,
          areaOfConcentration = @areaOfConcentration,
          otherReason = @otherReason
        WHERE id = @applicationId
      `, { applicationId: existing.id, ...mapApplicationBody(req.body) });

      await query('DELETE FROM ApplicationPreferredLocations WHERE applicationId = @applicationId', { applicationId: existing.id });
      for (const schoolLoc of preferredLocations) {
        await query(
          "INSERT INTO ApplicationPreferredLocations (applicationId, schoolLoc, status) VALUES (@applicationId, @schoolLoc, 'Pending')",
          { applicationId: existing.id, schoolLoc }
        );
      }
    }

    res.redirect('/request');
  } catch (err) {
    next(err);
  }
});

function mapApplicationBody(body) {
  return {
    curPositionType: body.curPositionType,
    reasonForRequest: body.reasonForRequest,
    verifyPDP: parseBool(body.verifyPDP),
    verifyCertificate: parseBool(body.verifyCertificate),
    yearsOfTeaching: Number(body.yearsOfTeaching || 0),
    yearsOfAdmin: Number(body.yearsOfAdmin || 0),
    yearsOfCertificated: Number(body.yearsOfCertificated || 0),
    yearsTotalGCPS: Number(body.yearsTotalGCPS || 0),
    yearsTotalExpNonGCPS: Number(body.yearsTotalExpNonGCPS || 0),
    verifyInvoluntarilyToCurLoc: parseBool(body.verifyInvoluntarilyToCurLoc),
    verifyToHeadCoach: parseBool(body.verifyToHeadCoach),
    verifyToSpecialEd: parseBool(body.verifyToSpecialEd),
    prefTeachingAssignment1: body.prefTeachingAssignment1 ? Number(body.prefTeachingAssignment1) : null,
    additionalInfo1: body.additionalInfo1 || null,
    prefTeachingAssignment2: body.prefTeachingAssignment2 ? Number(body.prefTeachingAssignment2) : null,
    additionalInfo2: body.additionalInfo2 || null,
    prefTeachingAssignment3: body.prefTeachingAssignment3 ? Number(body.prefTeachingAssignment3) : null,
    additionalInfo3: body.additionalInfo3 || null,
    speaksFrench: parseBool(body.speaksFrench),
    speaksKorean: parseBool(body.speaksKorean),
    speaksSpanish: parseBool(body.speaksSpanish),
    speaksOther: parseBool(body.speaksOther),
    otherLang: body.otherLang || null,
    extraCurriculum: body.extraCurriculum || null,
    certificationID: body.certificationID,
    fieldCertification: body.fieldCertification,
    certificateLevel: body.certificateLevel,
    areaOfConcentration: body.areaOfConcentration || null,
    otherReason: body.otherReason || null
  };
}

app.get('/admin/applications', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).send('Forbidden');
    }

    const sortMap = {
      employee: 'u.displayName',
      submitted: 'a.dateSubmitted',
      cert: 'a.certificationID',
      status: 'a.formStatus'
    };
    const sortBy = sortMap[req.query.sortBy] || 'u.displayName';

    const result = await query(`
      SELECT a.id, a.formStatus, a.dateSubmitted, a.certificationID, a.curPositionType,
             u.displayName, s.locname AS currentSchoolName, s.principal,
             STRING_AGG(ps.locname, ', ') AS preferredLocations
      FROM Applications a
      INNER JOIN Users u ON u.userId = a.requesterId
      LEFT JOIN Schools s ON s.loc = u.currentSchoolLoc
      LEFT JOIN ApplicationPreferredLocations apl ON apl.applicationId = a.id
      LEFT JOIN Schools ps ON ps.loc = apl.schoolLoc
      GROUP BY a.id, a.formStatus, a.dateSubmitted, a.certificationID, a.curPositionType, u.displayName, s.locname, s.principal
      ORDER BY ${sortBy}
    `);

    const grouped = result.recordset.reduce((acc, item) => {
      const key = item.currentSchoolName || 'Unknown School';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    res.render('admin-dashboard', { grouped, sortBy: req.query.sortBy || 'employee', bannerMessage: process.env.BANNER_MESSAGE || '' });
  } catch (err) {
    next(err);
  }
});

app.post('/admin/applications/:id/status', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
    await query('UPDATE Applications SET formStatus = @status WHERE id = @id', {
      id: Number(req.params.id),
      status: req.body.status
    });
    res.redirect('/admin/applications');
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Unexpected server error');
});

module.exports = app;
