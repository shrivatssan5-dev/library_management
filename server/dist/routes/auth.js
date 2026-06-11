"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const { rows } = await db_1.pool.query('SELECT id, email, password_hash, name FROM librarians WHERE email = $1', [email.toLowerCase().trim()]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const librarian = rows[0];
        const valid = await bcryptjs_1.default.compare(password, librarian.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'Server misconfiguration' });
        }
        const signOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN || '8h'),
        };
        const token = jsonwebtoken_1.default.sign({
            id: librarian.id,
            email: librarian.email,
            name: librarian.name,
            role: 'librarian',
        }, secret, signOptions);
        res.json({
            token,
            librarian: {
                id: librarian.id,
                email: librarian.email,
                name: librarian.name,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
router.get('/me', auth_1.requireAuth, (req, res) => {
    res.json({ librarian: req.librarian });
});
exports.default = router;
