import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

async function markOverdue() {
  await pool.query(
    `UPDATE borrowings
     SET status = 'overdue'
     WHERE status = 'active' AND due_date < CURRENT_DATE`
  );
}

router.get('/', async (req, res) => {
  const status = (req.query.status as string) || 'all';

  try {
    await markOverdue();

    let query = `
      SELECT b.*,
             bk.title AS book_title, bk.author AS book_author,
             m.name AS member_name, m.membership_number,
             l.name AS librarian_name
      FROM borrowings b
      JOIN books bk ON bk.id = b.book_id
      JOIN members m ON m.id = b.member_id
      JOIN librarians l ON l.id = b.librarian_id
    `;

    const params: string[] = [];

    if (status !== 'all') {
      query += ' WHERE b.status = $1';
      params.push(status);
    }

    query += ' ORDER BY b.borrowed_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Fetch borrowings error:', error);
    res.status(500).json({ error: 'Failed to fetch borrowings' });
  }
});

router.post('/', async (req, res) => {
  const { book_id, member_id, due_date } = req.body;
  const librarianId = req.librarian!.id;

  if (!book_id || !member_id || !due_date) {
    return res.status(400).json({ error: 'Book, member, and due date are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookResult = await client.query(
      'SELECT copies_available FROM books WHERE id = $1 FOR UPDATE',
      [book_id]
    );

    if (bookResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Book not found' });
    }

    if (bookResult.rows[0].copies_available < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No copies available for this book' });
    }

    const memberResult = await client.query('SELECT id FROM members WHERE id = $1', [member_id]);
    if (memberResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Member not found' });
    }

    const { rows } = await client.query(
      `INSERT INTO borrowings (book_id, member_id, librarian_id, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [book_id, member_id, librarianId, due_date]
    );

    await client.query(
      'UPDATE books SET copies_available = copies_available - 1 WHERE id = $1',
      [book_id]
    );

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Issue book error:', error);
    res.status(500).json({ error: 'Failed to issue book' });
  } finally {
    client.release();
  }
});

router.post('/:id/return', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const borrowing = await client.query(
      `SELECT * FROM borrowings WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (borrowing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Borrowing record not found' });
    }

    const record = borrowing.rows[0];

    if (record.status === 'returned') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Book already returned' });
    }

    const { rows } = await client.query(
      `UPDATE borrowings
       SET status = 'returned', returned_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    await client.query(
      'UPDATE books SET copies_available = copies_available + 1 WHERE id = $1',
      [record.book_id]
    );

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Return book error:', error);
    res.status(500).json({ error: 'Failed to return book' });
  } finally {
    client.release();
  }
});

export default router;
