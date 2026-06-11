"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get('/', async (req, res) => {
    const search = req.query.search || '';
    try {
        const { rows } = await db_1.pool.query(`SELECT * FROM books
       WHERE title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1 OR genre ILIKE $1
       ORDER BY title ASC`, [`%${search}%`]);
        res.json(rows);
    }
    catch (error) {
        console.error('Fetch books error:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await db_1.pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(rows[0]);
    }
    catch (error) {
        console.error('Fetch book error:', error);
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});
router.post('/', async (req, res) => {
    const { title, author, isbn, genre, copies_total } = req.body;
    if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
    }
    const copies = Math.max(1, Number(copies_total) || 1);
    try {
        const { rows } = await db_1.pool.query(`INSERT INTO books (title, author, isbn, genre, copies_total, copies_available)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING *`, [title.trim(), author.trim(), isbn?.trim() || null, genre?.trim() || null, copies]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
            return res.status(409).json({ error: 'ISBN already exists' });
        }
        console.error('Create book error:', error);
        res.status(500).json({ error: 'Failed to create book' });
    }
});
router.put('/:id', async (req, res) => {
    const { title, author, isbn, genre, copies_total } = req.body;
    if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
    }
    const copies = Math.max(0, Number(copies_total) || 0);
    try {
        const activeBorrowings = await db_1.pool.query(`SELECT COUNT(*)::int AS count FROM borrowings
       WHERE book_id = $1 AND status IN ('active', 'overdue')`, [req.params.id]);
        const borrowed = activeBorrowings.rows[0].count;
        if (copies < borrowed) {
            return res.status(400).json({
                error: `Cannot set total copies below ${borrowed} (currently borrowed)`,
            });
        }
        const copiesAvailable = copies - borrowed;
        const { rows } = await db_1.pool.query(`UPDATE books
       SET title = $1, author = $2, isbn = $3, genre = $4,
           copies_total = $5, copies_available = $6
       WHERE id = $7
       RETURNING *`, [
            title.trim(),
            author.trim(),
            isbn?.trim() || null,
            genre?.trim() || null,
            copies,
            copiesAvailable,
            req.params.id,
        ]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(rows[0]);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
            return res.status(409).json({ error: 'ISBN already exists' });
        }
        console.error('Update book error:', error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const active = await db_1.pool.query(`SELECT COUNT(*)::int AS count FROM borrowings
       WHERE book_id = $1 AND status IN ('active', 'overdue')`, [req.params.id]);
        if (active.rows[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete a book with active borrowings' });
        }
        const { rowCount } = await db_1.pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});
exports.default = router;
