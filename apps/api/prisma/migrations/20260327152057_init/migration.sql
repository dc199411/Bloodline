-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" BIGSERIAL NOT NULL,
    "agentId" BIGINT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadataUri" TEXT,
    "executionEndpoint" TEXT,
    "modelProvider" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'alive',
    "intelligence" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "creativity" INTEGER NOT NULL,
    "frugality" INTEGER NOT NULL,
    "riskAppetite" INTEGER NOT NULL,
    "socialEnergy" INTEGER NOT NULL,
    "loyalty" INTEGER NOT NULL,
    "resilience" INTEGER NOT NULL,
    "parentAgentId" BIGINT,
    "lineageDepth" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "offspringCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "bornAt" TIMESTAMP(3),
    "diedAt" TIMESTAMP(3),
    "lastWillUri" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BScoreSnapshot" (
    "id" BIGSERIAL NOT NULL,
    "agentId" BIGINT NOT NULL,
    "composite" DECIMAL(20,4) NOT NULL,
    "taskScore" DECIMAL(10,4) NOT NULL,
    "profitScore" DECIMAL(10,4) NOT NULL,
    "accuracyScore" DECIMAL(10,4) NOT NULL,
    "arenaScore" DECIMAL(10,4) NOT NULL,
    "uptimeScore" DECIMAL(10,4) NOT NULL,
    "communityScore" DECIMAL(10,4) NOT NULL,
    "snapshotBlock" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bounty" (
    "id" BIGSERIAL NOT NULL,
    "bountyId" BIGINT NOT NULL,
    "posterAddress" TEXT NOT NULL,
    "posterAgentId" BIGINT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "descriptionUri" TEXT,
    "bountyType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "prizeAmount" DECIMAL(20,6) NOT NULL,
    "prizeToken" TEXT NOT NULL DEFAULT 'USDC',
    "deadline" TIMESTAMP(3) NOT NULL,
    "minBScore" INTEGER NOT NULL DEFAULT 0,
    "minIntelligence" INTEGER NOT NULL DEFAULT 0,
    "minCreativity" INTEGER NOT NULL DEFAULT 0,
    "minSpeed" INTEGER NOT NULL DEFAULT 0,
    "verifyMode" TEXT NOT NULL DEFAULT 'human',
    "winnerAgentId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Bounty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BountyApplication" (
    "id" BIGSERIAL NOT NULL,
    "bountyId" BIGINT NOT NULL,
    "agentId" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "outputUri" TEXT,
    "score" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BountyApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRating" (
    "id" BIGSERIAL NOT NULL,
    "agentId" BIGINT NOT NULL,
    "raterAddress" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "taskQuality" INTEGER NOT NULL,
    "reliability" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" BIGSERIAL NOT NULL,
    "agentId" BIGINT NOT NULL,
    "trigger" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "farcasterHash" TEXT,
    "twitterId" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" BIGSERIAL NOT NULL,
    "followerAddress" TEXT NOT NULL,
    "agentId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_agentId_key" ON "Agent"("agentId");

-- CreateIndex
CREATE INDEX "Agent_ownerId_idx" ON "Agent"("ownerId");

-- CreateIndex
CREATE INDEX "Agent_stage_idx" ON "Agent"("stage");

-- CreateIndex
CREATE INDEX "Agent_parentAgentId_idx" ON "Agent"("parentAgentId");

-- CreateIndex
CREATE INDEX "BScoreSnapshot_agentId_idx" ON "BScoreSnapshot"("agentId");

-- CreateIndex
CREATE INDEX "BScoreSnapshot_createdAt_idx" ON "BScoreSnapshot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bounty_bountyId_key" ON "Bounty"("bountyId");

-- CreateIndex
CREATE INDEX "BountyApplication_bountyId_idx" ON "BountyApplication"("bountyId");

-- CreateIndex
CREATE INDEX "BountyApplication_agentId_idx" ON "BountyApplication"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "BountyApplication_bountyId_agentId_key" ON "BountyApplication"("bountyId", "agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentRating_agentId_raterAddress_key" ON "AgentRating"("agentId", "raterAddress");

-- CreateIndex
CREATE INDEX "SocialPost_agentId_idx" ON "SocialPost"("agentId");

-- CreateIndex
CREATE INDEX "SocialPost_trigger_idx" ON "SocialPost"("trigger");

-- CreateIndex
CREATE INDEX "Follow_agentId_idx" ON "Follow"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerAddress_agentId_key" ON "Follow"("followerAddress", "agentId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_parentAgentId_fkey" FOREIGN KEY ("parentAgentId") REFERENCES "Agent"("agentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BScoreSnapshot" ADD CONSTRAINT "BScoreSnapshot_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("agentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BountyApplication" ADD CONSTRAINT "BountyApplication_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty"("bountyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BountyApplication" ADD CONSTRAINT "BountyApplication_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("agentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRating" ADD CONSTRAINT "AgentRating_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("agentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
