import { Router } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { pool } from '../db';
import { requireMemberAuth } from '../middleware/memberAuth';

const router = Router();

router.post('/login', async (req, res) => {
  const { membership_number, email } = req.body;

  if (!membership_number || !email) {
    return res.status(400).json({ error: 'Member ID and email are required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, membership_number
       FROM members
       WHERE membership_number = $1 AND LOWER(email) = LOWER($2)`,
      [membership_number.trim(), email.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid member ID or email' });
    }

    const member = rows[0];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      {
        id: member.id,
        email: member.email,
        name: member.name,
        membership_number: member.membership_number,
        role: 'member',
      },
      secret,
      signOptions
    );

    res.json({
      token,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        membership_number: member.membership_number,
      },
    });
  } catch (error) {
    console.error('Member login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireMemberAuth, (req, res) => {
  res.json({ member: req.member });
});

export default router;
