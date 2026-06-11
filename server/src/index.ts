import dotenv from 'dotenv';
import app from './app';
import { migrate } from './db/migrate';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await migrate();
    app.listen(PORT, () => {
      console.log(`Library API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
