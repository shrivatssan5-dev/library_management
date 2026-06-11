import dotenv from 'dotenv';
import { migrate } from '../db/migrate';

dotenv.config();

migrate()
  .then(() => {
    console.log('Migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
