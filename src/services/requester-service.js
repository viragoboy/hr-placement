const { query } = require('../db');
const {
  REQUESTER_USER_KEYS,
  JOB_KEYS,
  APPLICATION_KEYS,
  PREFERRED_LOCATION_STATUS_KEYS
} = require('../constants');
const { normalizeRowKeys, normalizeRows } = require('../utils/normalization');

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
  const jobs = normalizeRows(jobsResult.recordset, JOB_KEYS);
  const application = normalizeRowKeys(applicationResult.recordset[0], APPLICATION_KEYS);

  if (!application) {
    return {
      user,
      schools: schoolsResult.recordset,
      jobs,
      application,
      selectedLocations: [],
      preferredLocationStatuses: []
    };
  }

  const preferredLocationsResult = await query(`
    SELECT apl.schoolLoc, s.locname AS schoolName, apl.status
    FROM ApplicationPreferredLocations apl
    LEFT JOIN Schools s ON s.loc = apl.schoolLoc
    WHERE apl.applicationId = @applicationId
    ORDER BY s.locname
  `, { applicationId: application.id });

  const preferredLocationStatuses = normalizeRows(preferredLocationsResult.recordset, PREFERRED_LOCATION_STATUS_KEYS);

  return {
    user,
    schools: schoolsResult.recordset,
    jobs,
    application,
    selectedLocations: preferredLocationStatuses.map((location) => location.schoolLoc),
    preferredLocationStatuses
  };
}

async function getApplicationContext(applicationId) {
  const applicationResult = await query(`
    SELECT a.id, a.requesterId
    FROM Applications a
    WHERE a.id = @applicationId
  `, { applicationId });

  const applicationRecord = normalizeRowKeys(applicationResult.recordset[0], APPLICATION_KEYS);
  if (!applicationRecord) return null;

  const requesterContext = await getRequesterContext(applicationRecord.requesterId);
  if (!requesterContext.application) return null;

  return requesterContext;
}

module.exports = { getRequesterContext, getApplicationContext };
