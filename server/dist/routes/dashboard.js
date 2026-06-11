"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get('/stats', async (_req, res) => {
    try {
        await db_1.pool.query(`UPDATE borrowings SET status = 'overdue'
       WHERE status = 'active' AND due_date < CURRENT_DATE`);
        const [books, members, active, overdue, recent] = await Promise.all([
            db_1.pool.query('SELECT COUNT(*)::int AS count FROM books'),
            db_1.pool.query('SELECT COUNT(*)::int AS count FROM members'),
            db_1.pool.query(`SELECT COUNT(*)::int AS count FROM borrowings WHERE status = 'active'`),
            db_1.pool.query(`SELECT COUNT(*)::int AS count FROM borrowings WHERE status = 'overdue'`),
            db_1.pool.query(`SELECT b.id, bk.title, m.name AS member_name, b.due_date, b.status
         FROM borrowings b
         JOIN books bk ON bk.id = b.book_id
         JOIN members m ON m.id = b.member_id
         WHERE b.status IN ('active', 'overdue')
         ORDER BY b.due_date ASC
         LIMIT 5`),
        ]);
        res.json({
            totalBooks: books.rows[0].count,
            totalMembers: members.rows[0].count,
            activeBorrowings: active.rows[0].count,
            overdueBorrowings: overdue.rows[0].count,
            upcomingDue: recent.rows,
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});
exports.default = router;
