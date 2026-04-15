const { query } = require('../db');
const {
  ADMIN_APPLICATION_KEYS,
  EMPLOYEE_APPLICATION_KEYS,
  PREFERRED_LOCATION_STATUS_KEYS
} = require('../constants');
const { normalizeRowKeys, normalizeRows } = require('../utils/normalization');

async function getEmployeeApplications(userId) {
  const result = await query(`
    SELECT a.id, a.requesterId, a.dateSubmitted, a.certificationID,
           apl.status AS locationStatus, apl.schoolLoc, ps.locname AS preferredLocationName
    FROM Applications a
    LEFT JOIN ApplicationPreferredLocations apl ON apl.applicationId = a.id
    LEFT JOIN Schools ps ON ps.loc = apl.schoolLoc
    WHERE a.requesterId = @userId
    ORDER BY ps.locname, apl.status
  `, { userId });

  return normalizeRows(result.recordset, EMPLOYEE_APPLICATION_KEYS);
}

async function getAdminApplications(sortBy) {
  const sortMap = {
    employee: 'u.displayName',
    submitted: 'a.dateSubmitted',
    cert: 'a.certificationID',
    status: 'apl.status'
  };
  const sortColumn = sortMap[sortBy] || sortMap.employee;

  const result = await query(`
    SELECT a.id, apl.status AS locationStatus, apl.schoolLoc, a.dateSubmitted, a.certificationID, a.curPositionType,
           u.displayName, s.locname AS currentSchoolName, s.principal,
           ps.locname AS preferredLocationName
    FROM Applications a
    INNER JOIN Users u ON u.userId = a.requesterId
    LEFT JOIN Schools s ON s.loc = u.currentSchoolLoc
    LEFT JOIN ApplicationPreferredLocations apl ON apl.applicationId = a.id
    LEFT JOIN Schools ps ON ps.loc = apl.schoolLoc
    ORDER BY ps.locname, apl.status, ${sortColumn}
  `);

  return normalizeRows(result.recordset, ADMIN_APPLICATION_KEYS);
}

async function getApplicationOwner(applicationId) {
  const applicationResult = await query(`
    SELECT id, requesterId
    FROM Applications
    WHERE id = @applicationId
  `, { applicationId });

  return normalizeRowKeys(applicationResult.recordset[0], EMPLOYEE_APPLICATION_KEYS);
}

async function getExistingPreferredLocations(applicationId) {
  const existingLocationsResult = await query(`
    SELECT schoolLoc
    FROM ApplicationPreferredLocations
    WHERE applicationId = @applicationId
  `, { applicationId });

  return normalizeRows(existingLocationsResult.recordset, PREFERRED_LOCATION_STATUS_KEYS)
    .map((row) => row.schoolLoc)
    .filter(Boolean);
}

async function insertApplication(requesterId, applicationValues) {
  if (applicationValues.curPositionType === 'y')
    applicationValues.curPositionType = 'N'
  
  const inserted = await query(`
    INSERT INTO Applications (
      requesterId, curPositionType, reasonForRequest, verifyPDP, verifyCertificate,
      yearsOfTeaching, yearsOfAdmin, yearsOfCertificated, yearsTotalGCPS, yearsTotalExpNonGCPS,
      verifyInvoluntarilyToCurLoc, verifyToHeadCoach, verifyToSpecialEd,
      prefTeachingAssignment1, additionalInfo1, prefTeachingAssignment2, additionalInfo2, prefTeachingAssignment3, additionalInfo3,
      speaksFrench, speaksKorean, speaksSpanish, speaksOther, otherLang, extraCurriculum,
      certificationID, fieldCertification, certificateLevel, areaOfConcentration, otherReason, dateSubmitted
    ) VALUES (
      @requesterId, @curPositionType, @reasonForRequest, @verifyPDP, @verifyCertificate,
      @yearsOfTeaching, @yearsOfAdmin, @yearsOfCertificated, @yearsTotalGCPS, @yearsTotalExpNonGCPS,
      @verifyInvoluntarilyToCurLoc, @verifyToHeadCoach, @verifyToSpecialEd,
      @prefTeachingAssignment1, @additionalInfo1, @prefTeachingAssignment2, @additionalInfo2, @prefTeachingAssignment3, @additionalInfo3,
      @speaksFrench, @speaksKorean, @speaksSpanish, @speaksOther, @otherLang, @extraCurriculum,
      @certificationID, @fieldCertification, @certificateLevel, @areaOfConcentration, @otherReason, NOW()
    ) RETURNING id
  `, {
    requesterId,
    ...applicationValues
  });

  return inserted.recordset[0].id;
}

async function updateApplication(applicationId, applicationValues) {
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
  `, { applicationId, ...applicationValues });
}

async function replacePreferredLocations(applicationId, preferredLocations) {
  await query('DELETE FROM ApplicationPreferredLocations WHERE applicationId = @applicationId', { applicationId });

  for (const schoolLoc of preferredLocations) {
    await addPreferredLocation(applicationId, schoolLoc);
  }
}

async function addPreferredLocation(applicationId, schoolLoc) {
  await query(
    "INSERT INTO ApplicationPreferredLocations (applicationId, schoolLoc, status) VALUES (@applicationId, @schoolLoc, 'Submitted')",
    { applicationId, schoolLoc }
  );
}

async function updatePreferredLocationStatus(applicationId, schoolLoc, status) {
  await query('UPDATE ApplicationPreferredLocations SET status = @status WHERE applicationId = @id AND schoolLoc = @schoolLoc', {
    id: applicationId,
    schoolLoc,
    status
  });
}

module.exports = {
  getEmployeeApplications,
  getAdminApplications,
  getApplicationOwner,
  getExistingPreferredLocations,
  insertApplication,
  updateApplication,
  replacePreferredLocations,
  addPreferredLocation,
  updatePreferredLocationStatus
};
