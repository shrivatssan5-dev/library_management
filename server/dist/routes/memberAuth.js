"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const memberAuth_1 = require("../middleware/memberAuth");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    const { membership_number, email } = req.body;
    if (!membership_number || !email) {
        return res.status(400).json({ error: 'Member ID and email are required' });
    }
    try {
        const { rows } = await db_1.pool.query(`SELECT id, name, email, membership_number
       FROM members
       WHERE membership_number = $1 AND LOWER(email) = LOWER($2)`, [membership_number.trim(), email.trim()]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid member ID or email' });
        }
        const member = rows[0];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'Server misconfiguration' });
        }
        const signOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN || '8h'),
        };
        const token = jsonwebtoken_1.default.sign({
            id: member.id,
            email: member.email,
            name: member.name,
            membership_number: member.membership_number,
            role: 'member',
        }, secret, signOptions);
        res.json({
            token,
            member: {
                id: member.id,
                name: member.name,
                email: member.email,
                membership_number: member.membership_number,
            },
        });
    }
    catch (error) {
        console.error('Member login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
router.get('/me', memberAuth_1.requireMemberAuth, (req, res) => {
    res.json({ member: req.member });
});
exports.default = router;
