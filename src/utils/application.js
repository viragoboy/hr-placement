const { parseBool } = require('./normalization');

function parsePreferredLocations(input) {
  if (Array.isArray(input)) return input.map((location) => String(location));
  if (input) return [String(input)];
  return [];
}

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

function validateApplicationSubmission(reqBody, certificateLevels) {
  const preferredLocations = parsePreferredLocations(reqBody.preferredLocations);
  const assignments = [reqBody.prefTeachingAssignment1, reqBody.prefTeachingAssignment2, reqBody.prefTeachingAssignment3]
    .filter(Boolean)
    .map((value) => Number(value));

  const errors = [];
  if (!preferredLocations.length) errors.push('Select at least one preferred location.');
  if (assignments.length < 1 || assignments.length > 3) errors.push('Select between one and three preferred assignments.');
  if (!certificateLevels.includes(reqBody.certificateLevel)) errors.push('Invalid certificate level selected.');

  return { errors, preferredLocations };
}

module.exports = {
  parsePreferredLocations,
  mapApplicationBody,
  validateApplicationSubmission
};
