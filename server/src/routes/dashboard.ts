import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/stats', async (_req, res) => {
  try {
    await pool.query(
      `UPDATE borrowings SET status = 'overdue'
       WHERE status = 'active' AND due_date < CURRENT_DATE`
    );

    const [books, members, active, overdue, recent] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM books'),
      pool.query('SELECT COUNT(*)::int AS count FROM members'),
      pool.query(`SELECT COUNT(*)::int AS count FROM borrowings WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM borrowings WHERE status = 'overdue'`),
      pool.query(
        `SELECT b.id, bk.title, m.name AS member_name, b.due_date, b.status
         FROM borrowings b
         JOIN books bk ON bk.id = b.book_id
         JOIN members m ON m.id = b.member_id
         WHERE b.status IN ('active', 'overdue')
         ORDER BY b.due_date ASC
         LIMIT 5`
      ),
    ]);

    res.json({
      totalBooks: books.rows[0].count,
      totalMembers: members.rows[0].count,
      activeBorrowings: active.rows[0].count,
      overdueBorrowings: overdue.rows[0].count,
      upcomingDue: recent.rows,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
