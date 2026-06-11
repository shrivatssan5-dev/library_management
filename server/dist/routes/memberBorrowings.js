"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const memberAuth_1 = require("../middleware/memberAuth");
const router = (0, express_1.Router)();
router.use(memberAuth_1.requireMemberAuth);
async function markOverdue() {
    await db_1.pool.query(`UPDATE borrowings
     SET status = 'overdue'
     WHERE status = 'active' AND due_date < CURRENT_DATE`);
}
router.get('/', async (req, res) => {
    const memberId = req.member.id;
    const status = req.query.status || 'active';
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
        const params = [memberId];
        if (status !== 'all') {
            query += ' AND b.status = $2';
            params.push(status);
        }
        query += ' ORDER BY b.borrowed_at DESC';
        const { rows } = await db_1.pool.query(query, params);
        res.json(rows);
    }
    catch (error) {
        console.error('Fetch member borrowings error:', error);
        res.status(500).json({ error: 'Failed to fetch borrowings' });
    }
});
exports.default = router;
