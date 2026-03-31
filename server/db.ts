import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export const connectDatabase = async () => {
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    throw new Error("Database configuration missing.");
  }

  const primaryHost = process.env.DB_HOST || 'localhost';
  const hostsToTry = Array.from(new Set([primaryHost, '127.0.0.1', 'localhost']));

  for (const host of hostsToTry) {
    try {
      const dbConfig = {
        host: host,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306,
        connectTimeout: 5000,
        enableKeepAlive: true,
        authSwitchHandler: (data: any, cb: any) => {
           if (data.pluginName === 'caching_sha2_password') {
             cb(null, Buffer.from(process.env.DB_PASSWORD!));
           } else {
             cb(new Error(`Unknown Auth Plugin: ${data.pluginName}`));
           }
        }
      };

      const tempPool = mysql.createPool(dbConfig);
      const conn = await tempPool.getConnection();
      conn.release();
      
      pool = tempPool;
      return { pool, host };
    } catch (err: any) {
      console.error(`[DB] Fail at ${host}: ${err.message}`);
    }
  }
  throw new Error("Database connection failed.");
};

export const getPool = () => pool;
