-- 創建車位表
CREATE TABLE IF NOT EXISTS "parking_spaces" (
  "id" SERIAL PRIMARY KEY,
  "space_number" VARCHAR(255) NOT NULL,
  "area" VARCHAR(255) NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  "notes" TEXT
);

-- 創建住戶表
CREATE TABLE IF NOT EXISTS "households" (
  "id" SERIAL PRIMARY KEY,
  "household_number" VARCHAR(255) NOT NULL,
  "contact_name" VARCHAR(255),
  "contact_phone" VARCHAR(255),
  "notes" TEXT
);

-- 創建租賃表
CREATE TABLE IF NOT EXISTS "rentals" (
  "id" SERIAL PRIMARY KEY,
  "parking_space_id" INTEGER NOT NULL,
  "household_id" INTEGER NOT NULL,
  "license_plate" VARCHAR(255) NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("parking_space_id") REFERENCES "parking_spaces" ("id"),
  FOREIGN KEY ("household_id") REFERENCES "households" ("id")
);

-- 創建活動日誌表
CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" SERIAL PRIMARY KEY,
  "activity_type" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "related_id" INTEGER
);

-- 創建租借請求表（簡化版停車系統）
CREATE TABLE IF NOT EXISTS "rental_requests" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "contact" VARCHAR(255) NOT NULL,
  "license_plate" VARCHAR(255) NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "notes" TEXT,
  "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 創建車位提供表（簡化版停車系統）
CREATE TABLE IF NOT EXISTS "parking_offers" (
  "id" SERIAL PRIMARY KEY,
  "request_id" INTEGER NOT NULL,
  "space_number" VARCHAR(255) NOT NULL,
  "owner_name" VARCHAR(255) NOT NULL,
  "owner_contact" VARCHAR(255) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("request_id") REFERENCES "rental_requests" ("id")
);

-- 添加索引以提高查詢性能
CREATE INDEX IF NOT EXISTS "idx_parking_spaces_status" ON "parking_spaces" ("status");
CREATE INDEX IF NOT EXISTS "idx_rentals_is_active" ON "rentals" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_rental_requests_status" ON "rental_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_parking_offers_request_id" ON "parking_offers" ("request_id");