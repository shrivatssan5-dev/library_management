import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const search = (req.query.search as string) || '';

  try {
    const { rows } = await pool.query(
      `SELECT * FROM members
       WHERE name ILIKE $1 OR email ILIKE $1 OR membership_number ILIKE $1
       ORDER BY name ASC`,
      [`%${search}%`]
    );
    res.json(rows);
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, phone, membership_number } = req.body;

  if (!name || !email || !membership_number) {
    return res.status(400).json({
      error: 'Name, email, and membership number are required',
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO members (name, email, phone, membership_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        phone?.trim() || null,
        membership_number.trim(),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return res.status(409).json({ error: 'Email or membership number already exists' });
    }
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

router.put('/:id', async (req, res) => {
  const { name, email, phone, membership_number } = req.body;

  if (!name || !email || !membership_number) {
    return res.status(400).json({
      error: 'Name, email, and membership number are required',
    });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE members
       SET name = $1, email = $2, phone = $3, membership_number = $4
       WHERE id = $5
       RETURNING *`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        phone?.trim() || null,
        membership_number.trim(),
        req.params.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(rows[0]);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return res.status(409).json({ error: 'Email or membership number already exists' });
    }
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const active = await pool.query(
      `SELECT COUNT(*)::int AS count FROM borrowings
       WHERE member_id = $1 AND status IN ('active', 'overdue')`,
      [req.params.id]
    );

    if (active.rows[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete a member with active borrowings' });
    }

    const { rowCount } = await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

export default router;
