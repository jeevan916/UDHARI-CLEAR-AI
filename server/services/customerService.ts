import { getPool } from '../db';

export const getCustomers = async () => {
  const pool = getPool();
  if (!pool) return [];
  const [rows] = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
  return rows;
};
