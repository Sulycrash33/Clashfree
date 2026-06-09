-- CreateEnum
CREATE TYPE "SignupStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable: InstitutionSignup
CREATE TABLE "InstitutionSignup" (
    "id"              TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "shortName"       TEXT NOT NULL,
    "type"            "InstitutionType" NOT NULL,
    "city"            TEXT NOT NULL,
    "state"           TEXT NOT NULL,
    "website"         TEXT,
    "emailDomain"     TEXT,
    "contactName"     TEXT NOT NULL,
    "contactEmail"    TEXT NOT NULL,
    "contactPhone"    TEXT,
    "message"         TEXT,
    "status"          "SignupStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy"      TEXT,
    "reviewedAt"      TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InviteToken
CREATE TABLE "InviteToken" (
    "id"            TEXT NOT NULL,
    "token"         TEXT NOT NULL,
    "email"         TEXT NOT NULL,
    "role"          "UserRole" NOT NULL,
    "institutionId" TEXT,
    "invitedBy"     TEXT NOT NULL,
    "expiresAt"     TIMESTAMP(3) NOT NULL,
    "usedAt"        TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");
CREATE INDEX "InstitutionSignup_status_idx" ON "InstitutionSignup"("status");
CREATE INDEX "InstitutionSignup_contactEmail_idx" ON "InstitutionSignup"("contactEmail");
CREATE INDEX "InviteToken_token_idx" ON "InviteToken"("token");
CREATE INDEX "InviteToken_email_idx" ON "InviteToken"("email");
CREATE INDEX "InviteToken_institutionId_idx" ON "InviteToken"("institutionId");
