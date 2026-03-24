CREATE TABLE Schools (
    loc VARCHAR(10) PRIMARY KEY,
    locname VARCHAR(255) NOT NULL,
    locationCluster VARCHAR(100),
    principal VARCHAR(255),
    category VARCHAR(20) NOT NULL
);

CREATE TABLE Users (
    userId VARCHAR(50) PRIMARY KEY,
    displayName VARCHAR(255) NOT NULL,
    currentSchoolLoc VARCHAR(10),
    currentJobCode VARCHAR(50),
    currentJobName VARCHAR(255),
    FOREIGN KEY (currentSchoolLoc) REFERENCES Schools(loc)
);

CREATE TABLE Jobs (
    id SERIAL PRIMARY KEY,
    jobName VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Applications (
    id SERIAL PRIMARY KEY,
    requesterId VARCHAR(50) NOT NULL UNIQUE,
    formStatus VARCHAR(50) DEFAULT 'Submitted',
    curPositionType VARCHAR(100) NOT NULL,
    reasonForRequest VARCHAR(100) NOT NULL,
    verifyPDP BOOLEAN NOT NULL,
    verifyCertificate BOOLEAN NOT NULL,
    yearsOfTeaching INT NOT NULL,
    yearsOfAdmin INT NOT NULL,
    yearsOfCertificated INT NOT NULL,
    yearsTotalGCPS INT NOT NULL,
    yearsTotalExpNonGCPS INT NOT NULL,
    verifyInvoluntarilyToCurLoc BOOLEAN DEFAULT FALSE,
    verifyToHeadCoach BOOLEAN DEFAULT FALSE,
    verifyToSpecialEd BOOLEAN DEFAULT FALSE,
    prefTeachingAssignment1 INT,
    additionalInfo1 TEXT,
    prefTeachingAssignment2 INT,
    additionalInfo2 TEXT,
    prefTeachingAssignment3 INT,
    additionalInfo3 TEXT,
    speaksFrench BOOLEAN DEFAULT FALSE,
    speaksKorean BOOLEAN DEFAULT FALSE,
    speaksSpanish BOOLEAN DEFAULT FALSE,
    speaksOther BOOLEAN DEFAULT FALSE,
    otherLang VARCHAR(255),
    extraCurriculum TEXT,
    certificationID VARCHAR(100) NOT NULL,
    fieldCertification TEXT NOT NULL,
    certificateLevel VARCHAR(10) NOT NULL,
    areaOfConcentration TEXT,
    otherReason TEXT,
    dateSubmitted TIMESTAMP NOT NULL,
    FOREIGN KEY (requesterId) REFERENCES Users(userId),
    FOREIGN KEY (prefTeachingAssignment1) REFERENCES Jobs(id),
    FOREIGN KEY (prefTeachingAssignment2) REFERENCES Jobs(id),
    FOREIGN KEY (prefTeachingAssignment3) REFERENCES Jobs(id)
);

CREATE TABLE ApplicationPreferredLocations (
    applicationId INT NOT NULL,
    schoolLoc VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    PRIMARY KEY (applicationId, schoolLoc),
    FOREIGN KEY (applicationId) REFERENCES Applications(id) ON DELETE CASCADE,
    FOREIGN KEY (schoolLoc) REFERENCES Schools(loc) ON DELETE CASCADE
);
