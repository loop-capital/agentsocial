-- Group Purchasing Schema
-- Enables collective buying for better manufacturer-direct pricing

-- Products available for group purchasing
CREATE TABLE "GroupPurchasingProduct" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "images" JSONB DEFAULT '[]',
  "manufacturerId" UUID NOT NULL,
  "basePrice" DECIMAL(10,2) NOT NULL,
  "msrp" DECIMAL(10,2),
  "unitOfMeasure" TEXT DEFAULT 'unit',
  "minOrderQty" INTEGER DEFAULT 1,
  "specs" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Active buying pools
CREATE TABLE "GroupPurchasingPool" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL REFERENCES "GroupPurchasingProduct"(id),
  "manufacturerId" UUID NOT NULL,
  "targetQuantity" INTEGER NOT NULL,
  "currentQuantity" INTEGER DEFAULT 0,
  "currentTier" INTEGER DEFAULT 1,
  "pricingTiers" JSONB NOT NULL, -- [{minQty: 1, price: 25}, {minQty: 100, price: 18}, ...]
  "deadline" TIMESTAMPTZ NOT NULL,
  "status" TEXT DEFAULT 'ACTIVE', -- ACTIVE, READY_TO_EXECUTE, EXECUTED, EXPIRED, CANCELLED
  "createdBy" UUID,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Business commitments to a pool
CREATE TABLE "GroupPurchaseCommitment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "poolId" UUID NOT NULL REFERENCES "GroupPurchasingPool"(id),
  "businessId" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "priceLocked" DECIMAL(10,2) NOT NULL, -- Price at time of commitment
  "status" TEXT DEFAULT 'PENDING', -- PENDING, PAID, WITHDRAWN, FULFILLED
  "escrowHeld" BOOLEAN DEFAULT FALSE,
  "shippingAddress" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Order execution (when pool hits target)
CREATE TABLE "GroupPurchaseOrder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "poolId" UUID NOT NULL REFERENCES "GroupPurchasingPool"(id),
  "manufacturerOrderId" TEXT,
  "totalQuantity" INTEGER NOT NULL,
  "totalValue" DECIMAL(12,2) NOT NULL,
  "status" TEXT DEFAULT 'PENDING', -- PENDING, SUBMITTED, CONFIRMED, SHIPPED, DELIVERED
  "submittedAt" TIMESTAMPTZ,
  "estimatedDelivery" DATE,
  "trackingInfo" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX "idx_pool_status_deadline" ON "GroupPurchasingPool"(status, deadline);
CREATE INDEX "idx_pool_product" ON "GroupPurchasingPool"(productId);
CREATE INDEX "idx_commitment_pool" ON "GroupPurchaseCommitment"(poolId);
CREATE INDEX "idx_commitment_business" ON "GroupPurchaseCommitment"(businessId);

-- RLS Policies
ALTER TABLE "GroupPurchasingPool" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupPurchaseCommitment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public pools are viewable by all" ON "GroupPurchasingPool"
  FOR SELECT USING (status = 'ACTIVE' OR status = 'READY_TO_EXECUTE');

CREATE POLICY "Businesses can view own commitments" ON "GroupPurchaseCommitment"
  FOR SELECT USING (true); -- In production, restrict to businessId match