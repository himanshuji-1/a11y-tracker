-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScanRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "pagesScanned" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    CONSTRAINT "ScanRun_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanRunId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "wcagCriterion" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "htmlSnippet" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "firstDetected" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerified" DATETIME,
    "explanation" TEXT,
    "fixSnippet" TEXT,
    CONSTRAINT "Issue_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
