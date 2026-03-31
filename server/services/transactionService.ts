import { getPool } from '../db';

export const getTransactions = async (params: any) => {
  const pool = getPool();
  if (!pool) return { data: [], meta: { total: 0 } };
  
  const { page = 1, limit = 50, search, startDate, endDate } = params;
  const offset = (Number(page) - 1) * Number(limit);
  
  let query = 'SELECT t.*, c.name as customerName, c.uniquePaymentCode as upc FROM transactions t JOIN customers c ON t.customerId = c.id';
  const queryParams: any[] = [];
  
  if (search || startDate || endDate) {
    query += ' WHERE';
    const conditions = [];
    if (search) {
      conditions.push('(c.name LIKE ? OR c.uniquePaymentCode LIKE ? OR t.description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (startDate) {
      conditions.push('t.date >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      conditions.push('t.date <= ?');
      queryParams.push(endDate);
    }
    query += ' ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY t.date DESC LIMIT ? OFFSET ?';
  queryParams.push(Number(limit), offset);
  
  const [rows] = await pool.execute(query, queryParams);
  const [countRows]: any = await pool.execute('SELECT COUNT(*) as total FROM transactions');
  
  return {
    data: rows,
    meta: {
      total: countRows[0]?.total || 0,
      page: Number(page),
      totalPages: Math.ceil((countRows[0]?.total || 0) / Number(limit)),
      limit: Number(limit)
    }
  };
};
