import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * 初始化資料庫架構
 * 這個腳本會檢查數據庫中是否存在所需的表，如果不存在則創建它們
 */
export async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL 未設置，跳過資料庫初始化");
    return;
  }

  try {
    console.log("檢查資料庫表結構...");
    
    // 設置連接配置
    const config: any = {
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
    
    // 如果是 Heroku 環境，需要特殊的 SSL 配置
    if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('heroku')) {
      config.ssl = {
        rejectUnauthorized: false
      };
      console.log('啟用 Heroku PostgreSQL SSL 配置');
    }
    
    // 創建連接池
    const pool = new Pool(config);
    
    // 檢查表是否存在
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    console.log("現有表:", existingTables);
    
    // 必需的表清單
    const requiredTables = [
      'parking_spaces',
      'households',
      'rentals',
      'activity_logs',
      'rental_requests',
      'parking_offers'
    ];
    
    // 檢查是否缺少任何表
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`需要創建以下表: ${missingTables.join(', ')}`);
      
      // 直接使用內嵌的 SQL 來創建表
      const createTableSQL = generateCreateTableSQL();
      await pool.query(createTableSQL);
      console.log("通過生成的 SQL 成功創建所有缺少的表!");
    } else {
      console.log("所有必需的表都已存在，無需創建");
    }
    
    // 關閉連接池
    await pool.end();
    console.log("資料庫初始化完成");
    
  } catch (error) {
    console.error("資料庫初始化失敗:", error);
  }
}

/**
 * 生成創建表的 SQL
 */
function generateCreateTableSQL(): string {
  return `
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
  `;
}