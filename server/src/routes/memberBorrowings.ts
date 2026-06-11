import { Router } from 'express';
import { pool } from '../db';
import { requireMemberAuth } from '../middleware/memberAuth';

const router = Router();

router.use(requireMemberAuth);

async function markOverdue() {
  await pool.query(
    `UPDATE borrowings
     SET status = 'overdue'
     WHERE status = 'active' AND due_date < CURRENT_DATE`
  );
}

router.get('/', async (req, res) => {
  const memberId = req.member!.id;
  const status = (req.query.status as string) || 'active';

  try {
    await markOverdue();

    let query = `
      SELECT b.id, b.book_id, b.member_id, b.due_date, b.status,
             b.borrowed_at, b.returned_at,
             bk.title AS book_title, bk.author AS book_author
      FROM borrowings b
      JOIN books bk ON bk.id = b.book_id
      WHERE b.member_id = $1
    `;

    const params: (number | string)[] = [memberId];

    if (status !== 'all') {
      query += ' AND b.status = $2';
      params.push(status);
    }

    query += ' ORDER BY b.borrowed_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Fetch member borrowings error:', error);
    res.status(500).json({ error: 'Failed to fetch borrowings' });
  }
});

export default router;
