import express from 'express';
import cors from 'cors';
import { pool } from './db';
import authRoutes from './routes/auth';
import memberAuthRoutes from './routes/memberAuth';
import memberBorrowingsRoutes from './routes/memberBorrowings';
import booksRoutes from './routes/books';
import membersRoutes from './routes/members';
import borrowingsRoutes from './routes/borrowings';
import dashboardRoutes from './routes/dashboard';

const app = express();

function getEnvironment() {
  if (process.env.RENDER) return 'render';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'local';
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.STUDENT_APP_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const dbHost =
    process.env.DATABASE_HOST ||
    (process.env.DATABASE_URL?.includes('@')
      ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0]
      : 'not configured');

  try {
    const { rows } = await pool.query('SELECT current_database() AS name');
    res.json({
      status: 'ok',
      database: rows[0].name,
      dbHost,
      environment: getEnvironment(),
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: null,
      dbHost,
      environment: getEnvironment(),
      message: 'Database connection failed. Check environment variables.',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/member-auth', memberAuthRoutes);
app.use('/api/member/borrowings', memberBorrowingsRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/borrowings', borrowingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

export default app;
