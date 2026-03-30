// Centralized static values used across routes.
// Keeping constants in one file makes validation and rendering rules
// easier to inspect and update safely.
const CERTIFICATE_LEVELS = ['T4', 'T5', 'T6', 'S4', 'S5', 'S6', 'L4', 'L5', 'L6'];

const REQUESTER_USER_KEYS = [
  'userId',
  'displayName',
  'currentJobName',
  'currentSchoolLoc',
  'currentSchoolName',
  'principal'
];

const JOB_KEYS = ['id', 'jobName'];

const ADMIN_APPLICATION_KEYS = [
  'id',
  'locationStatus',
  'dateSubmitted',
  'certificationID',
  'curPositionType',
  'displayName',
  'currentSchoolName',
  'principal',
  'schoolLoc',
  'preferredLocationName'
];

const EMPLOYEE_APPLICATION_KEYS = [
  'id',
  'requesterId',
  'dateSubmitted',
  'certificationID',
  'locationStatus',
  'schoolLoc',
  'preferredLocationName'
];

const APPLICATION_KEYS = [
  'id',
  'requesterId',
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

const PREFERRED_LOCATION_STATUS_KEYS = ['schoolLoc', 'schoolName', 'status'];

module.exports = {
  CERTIFICATE_LEVELS,
  REQUESTER_USER_KEYS,
  JOB_KEYS,
  ADMIN_APPLICATION_KEYS,
  EMPLOYEE_APPLICATION_KEYS,
  APPLICATION_KEYS,
  PREFERRED_LOCATION_STATUS_KEYS
};
