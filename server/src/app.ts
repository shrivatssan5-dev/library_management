import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import booksRoutes from './routes/books';
import membersRoutes from './routes/members';
import borrowingsRoutes from './routes/borrowings';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/borrowings', borrowingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

export default app;
