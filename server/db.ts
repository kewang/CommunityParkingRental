import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// 確保數據庫 URL 存在
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using in-memory storage instead of PostgreSQL.");
}

// 建立連接池
let pool: ReturnType<typeof pg.Pool> | null = null;
let db: any = null;

// 初始化數據庫 (只在有 DATABASE_URL 時)
if (process.env.DATABASE_URL) {
  try {
    console.log("Initializing database connection with URL:", process.env.DATABASE_URL.replace(/\/\/.*:.*@/, '//***:***@'));
    
    // 處理 Heroku 的 SSL 要求
    const config: any = {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
    
    // 如果是生產環境（通常是 Heroku），需要啟用 SSL
    // Heroku 會自動設置 DATABASE_URL，但需要特殊的 SSL 配置
    if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('heroku')) {
      config.ssl = {
        rejectUnauthorized: false // Heroku 需要此設置
      };
      console.log('Enabling SSL for Heroku PostgreSQL');
    } else {
      // 即使非 Heroku 環境，如果連接到 Heroku 資料庫，也啟用 SSL
      config.ssl = {
        rejectUnauthorized: false
      };
      console.log('Enabling SSL for external PostgreSQL connection');
    }
    
    pool = new Pool(config);
    db = drizzle(pool, { schema });
    
    // 註冊 pool 錯誤處理，以便捕獲所有連接錯誤
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
    
    // 測試連接
    testConnection();
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
  }
}

// 測試連接功能
export async function testConnection() {
  if (!pool) {
    console.warn("No database pool available.");
    return false;
  }
  
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log("Database connection successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// 導出連接池和 ORM 實例
export { pool, db };