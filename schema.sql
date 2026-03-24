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

-- Seed data sourced from GCPS cluster and directory pages:
-- https://www.gcpsk12.org/schools/clusters/list-of-schools-by-cluster
-- https://www.gcpsk12.org/schools/about-our-schools
INSERT INTO Schools (loc, locname, locationCluster, principal, category) VALUES
    ('ARCHRHS', 'Archer High School', 'Archer Cluster', NULL, 'High School'),
    ('BRKMARHS', 'Berkmar High School', 'Berkmar Cluster', NULL, 'High School'),
    ('BRKWDHS', 'Brookwood High School', 'Brookwood Cluster', NULL, 'High School'),
    ('CENTGWHS', 'Central Gwinnett High School', 'Central Gwinnett Cluster', NULL, 'High School'),
    ('COLLHS', 'Collins Hill High School', 'Collins Hill Cluster', NULL, 'High School'),
    ('DACULAHS', 'Dacula High School', 'Dacula Cluster', NULL, 'High School'),
    ('DISCVRHS', 'Discovery High School', 'Discovery Cluster', NULL, 'High School'),
    ('DULUTHHS', 'Duluth High School', 'Duluth Cluster', NULL, 'High School'),
    ('GRAYSONHS', 'Grayson High School', 'Grayson Cluster', NULL, 'High School'),
    ('LANIERHS', 'Lanier High School', 'Lanier Cluster', NULL, 'High School'),
    ('MEADWHS', 'Meadowcreek High School', 'Meadowcreek Cluster', NULL, 'High School'),
    ('MCCLUREHS', 'McClure Health Science High School', 'Meadowcreek Cluster', NULL, 'High School'),
    ('MILLCRHS', 'Mill Creek High School', 'Mill Creek Cluster', NULL, 'High School'),
    ('MTNVIEWHS', 'Mountain View High School', 'Mountain View Cluster', NULL, 'High School'),
    ('NORCRSHS', 'Norcross High School', 'Norcross Cluster', NULL, 'High School'),
    ('PAULDUKHS', 'Paul Duke STEM High School', 'Norcross Cluster', NULL, 'High School'),
    ('NTHGWHS', 'North Gwinnett High School', 'North Gwinnett Cluster', NULL, 'High School'),
    ('PARKVWHS', 'Parkview High School', 'Parkview Cluster', NULL, 'High School'),
    ('PRIDGEHS', 'Peachtree Ridge High School', 'Peachtree Ridge Cluster', NULL, 'High School'),
    ('SECKNGHS', 'Seckinger High School', 'Seckinger Cluster', NULL, 'High School'),
    ('SHILOHHS', 'Shiloh High School', 'Shiloh Cluster', NULL, 'High School'),
    ('SOUTHGWHS', 'South Gwinnett High School', 'South Gwinnett Cluster', NULL, 'High School'),
    ('BAYCRKMS', 'Bay Creek Middle School', 'Grayson Cluster', NULL, 'Middle School'),
    ('COUCHMS', 'Couch Middle School', 'Grayson Cluster', NULL, 'Middle School'),
    ('FIVEFKMS', 'Five Forks Middle School', 'Brookwood Cluster', NULL, 'Middle School'),
    ('GRACESNMS', 'Grace Snell Middle School', 'South Gwinnett Cluster', NULL, 'Middle School'),
    ('HULLMS', 'Hull Middle School', 'Peachtree Ridge Cluster', NULL, 'Middle School'),
    ('JONESMS', 'Jones Middle School', 'Seckinger Cluster', NULL, 'Middle School'),
    ('LANIERMS', 'Lanier Middle School', 'Lanier Cluster', NULL, 'Middle School'),
    ('OSBRNMS', 'Osborne Middle School', 'Mill Creek Cluster', NULL, 'Middle School'),
    ('SHILOHMS', 'Shiloh Middle School', 'Shiloh Cluster', NULL, 'Middle School'),
    ('SNELLVMS', 'Snellville Middle School', 'South Gwinnett Cluster', NULL, 'Middle School'),
    ('ALCOVAES', 'Alcova Elementary School', 'Dacula Cluster', NULL, 'Elementary School'),
    ('ARCADOES', 'Arcado Elementary School', 'Parkview Cluster', NULL, 'Elementary School'),
    ('BETHDSES', 'Bethesda Elementary School', 'Berkmar Cluster', NULL, 'Elementary School'),
    ('BRITERES', 'Britt Elementary School', 'South Gwinnett Cluster', NULL, 'Elementary School'),
    ('DUNCANES', 'Duncan Creek Elementary School', 'Mill Creek Cluster', NULL, 'Elementary School'),
    ('HARMNYES', 'Harmony Elementary School', 'Seckinger Cluster', NULL, 'Elementary School'),
    ('HARBINSE', 'Harbins Elementary School', 'Archer Cluster', NULL, 'Elementary School'),
    ('IVYCRKES', 'Ivy Creek Elementary School', 'Seckinger Cluster', NULL, 'Elementary School'),
    ('JACKSNES', 'Jackson Elementary School', 'Peachtree Ridge Cluster', NULL, 'Elementary School'),
    ('PARTEEES', 'Partee Elementary School', 'Shiloh Cluster', NULL, 'Elementary School'),
    ('ROSEBDES', 'Rosebud Elementary School', 'South Gwinnett Cluster', NULL, 'Elementary School')
ON CONFLICT (loc) DO NOTHING;

INSERT INTO Jobs (jobName) VALUES
    ('Elementary Teacher'),
    ('Middle School Language Arts Teacher'),
    ('Middle School Math Teacher'),
    ('High School English Teacher'),
    ('High School Math Teacher'),
    ('High School Science Teacher'),
    ('High School Social Studies Teacher'),
    ('Special Education Teacher'),
    ('ESOL Teacher'),
    ('Media Specialist'),
    ('School Counselor'),
    ('Assistant Principal')
ON CONFLICT (jobName) DO NOTHING;

INSERT INTO Users (userId, displayName, currentSchoolLoc, currentJobCode, currentJobName) VALUES
    ('u10001', 'Avery Johnson', 'ARCHRHS', 'HS-MATH', 'High School Math Teacher'),
    ('u10002', 'Jordan Smith', 'PARKVWHS', 'HS-SCI', 'High School Science Teacher'),
    ('u10003', 'Casey Lee', 'NTHGWHS', 'HS-ELA', 'High School English Teacher'),
    ('u10004', 'Riley Brown', 'MILLCRHS', 'MS-MATH', 'Middle School Math Teacher'),
    ('u10005', 'Morgan Davis', 'SHILOHMS', 'SPED', 'Special Education Teacher'),
    ('u10006', 'Taylor Wilson', 'ALCOVAES', 'ELEM', 'Elementary Teacher')
ON CONFLICT (userId) DO NOTHING;
