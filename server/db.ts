import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// 設置 Neon 配置，這對於在 Node.js 環境中使用 Neon Serverless 是必要的
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = false; // 對於 Replit，有時需要禁用安全 WebSocket
neonConfig.pipelineTLS = false; // 禁用 TLS 管道

// 確保數據庫 URL 存在
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// 初始化數據庫連接池
console.log("Initializing database connection...");
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 連接參數，優化連接管理
  max: 10, // 連接池中的最大連接數
  idleTimeoutMillis: 30000, // 連接可以空閒的最長時間
  connectionTimeoutMillis: 10000, // 連接超時時間
});

// 初始化 Drizzle ORM 實例
export const db = drizzle(pool, { schema });

// 導出測試連接的功能
export async function testConnection() {
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log("Database connection successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// 測試連接
testConnection().then(connected => {
  if (connected) {
    console.log("Database is ready to use!");
  } else {
    console.log("Database connection failed. Check your configuration.");
  }
});