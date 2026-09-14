-- Hub & Spoke Delivery Schema
-- Consolidated shipping to preserve bulk discounts

-- Delivery hubs for splitting bulk orders
CREATE TABLE "DeliveryHub" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- AMAZON_FLEX, LOCAL_COURIER, COWORKER, SELF_MANAGED
  "region" TEXT NOT NULL, -- northeast, southeast, midwest, southwest, west
  "address" JSONB NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 1000, -- max units can hold
  "availableSpace" INTEGER DEFAULT 1000,
  "deliveryRadiusMiles" INTEGER DEFAULT 25,
  "costPerDelivery" DECIMAL(10,2) DEFAULT 8.00, -- base delivery fee
  "costPerUnit" DECIMAL(10,2) DEFAULT 0.50, -- handling per unit
  "operatingHours" JSONB DEFAULT '{"mon":"09:00-18:00","tue":"09:00-18:00"}',
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "verified" BOOLEAN DEFAULT FALSE,
  "rating" DECIMAL(3,2) DEFAULT 5.0,
  "totalDeliveries" INTEGER DEFAULT 0,
  "active" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Pool delivery assignments (which hub handles which pool)
CREATE TABLE "GroupPurchaseDelivery" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "poolId" UUID NOT NULL REFERENCES "GroupPurchasingPool"(id),
  "hubId" UUID NOT NULL REFERENCES "DeliveryHub"(id),
  "manufacturerShipmentId" TEXT,
  "shippedToHubAt" TIMESTAMPTZ,
  "receivedAtHubAt" TIMESTAMPTZ,
  "hubReceivedBy" TEXT,
  "status" TEXT DEFAULT 'PENDING', -- PENDING, SHIPPED_TO_HUB, RECEIVED_AT_HUB, SPLITTING, IN_DELIVERY, COMPLETED
  "hubStorageFees" DECIMAL(10,2) DEFAULT 0,
  "totalDeliveryCost" DECIMAL(10,2),
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Individual deliveries from hub to business
CREATE TABLE "GroupPurchaseLocalDelivery" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "poolDeliveryId" UUID NOT NULL REFERENCES "GroupPurchaseDelivery"(id),
  "commitmentId" UUID NOT NULL REFERENCES "GroupPurchaseCommitment"(id),
  "businessId" UUID NOT NULL,
  "deliveryAddress" JSONB NOT NULL,
  "quantity" INTEGER NOT NULL,
  "deliveryCost" DECIMAL(10,2),
  "deliveryDate" DATE,
  "deliveryWindowStart" TIMESTAMPTZ,
  "deliveryWindowEnd" TIMESTAMPTZ,
  "deliveryType" TEXT DEFAULT 'STANDARD', -- STANDARD, EXPRESS, SCHEDULED
  "trackingNumber" TEXT,
  "status" TEXT DEFAULT 'PENDING', -- PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, FAILED
  "signedBy" TEXT,
  "deliveredAt" TIMESTAMPTZ,
  "deliveryPhoto" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX "idx_hub_region_type" ON "DeliveryHub"(region, type);
CREATE INDEX "idx_hub_active" ON "DeliveryHub"(active);
CREATE INDEX "idx_delivery_pool" ON "GroupPurchaseDelivery"(poolId);
CREATE INDEX "idx_delivery_hub" ON "GroupPurchaseDelivery"(hubId);
CREATE INDEX "idx_localdelivery_status" ON "GroupPurchaseLocalDelivery"(status);
CREATE INDEX "idx_localdelivery_business" ON "GroupPurchaseLocalDelivery"(businessId);

-- Sample data for major regions
INSERT INTO "DeliveryHub" (name, type, region, address, capacity, deliveryRadiusMiles, costPerDelivery, contactEmail) VALUES
  ('NYC Amazon Flex Hub', 'AMAZON_FLEX', 'northeast', '{"city":"New York","state":"NY","zip":"10001"}', 5000, 15, 6.50, 'nyc@tasklinkr.local'),
  ('LA Flex Partners', 'AMAZON_FLEX', 'west', '{"city":"Los Angeles","state":"CA","zip":"90210"}', 8000, 20, 7.00, 'la@tasklinkr.local'),
  ('Chicago Local Courier', 'LOCAL_COURIER', 'midwest', '{"city":"Chicago","state":"IL","zip":"60601"}', 3000, 30, 8.50, 'chi@tasklinkr.local'),
  ('Miami Coworker Hub', 'COWORKER', 'southeast', '{"city":"Miami","state":"FL","zip":"33101"}', 2000, 25, 10.00, 'miami@tasklinkr.local'),
  ('Dallas Distribution', 'SELF_MANAGED', 'southwest', '{"city":"Dallas","state":"TX","zip":"75201"}', 10000, 50, 5.00, 'dallas@tasklinkr.local')
ON CONFLICT DO NOTHING;