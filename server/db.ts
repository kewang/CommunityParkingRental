import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// 確保數據庫 URL 存在
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using in-memory storage instead of PostgreSQL.");
}

// 建立連接池
let pool: Pool | null = null;
let db: any = null;

// 初始化數據庫 (只在有 DATABASE_URL 時)
if (process.env.DATABASE_URL) {
  try {
    console.log("Initializing database connection...");
    
    // 處理 Heroku 的 SSL 要求
    const config: any = {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
    
    // 如果是生產環境（通常是 Heroku），需要啟用 SSL
    if (process.env.NODE_ENV === 'production') {
      config.ssl = {
        rejectUnauthorized: false // Heroku 需要此設置
      };
    }
    
    pool = new Pool(config);
    db = drizzle(pool, { schema });
    
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