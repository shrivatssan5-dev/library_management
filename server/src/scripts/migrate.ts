import path from 'path';
import dotenv from 'dotenv';
import { migrate } from '../db/migrate';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

migrate()
  .then(() => {
    console.log('Migration finished');
    process.exit(0);
  })
  .catch((error: NodeJS.ErrnoException & { code?: string }) => {
    console.error('Migration failed:', error.message || error);

    if (error.code === 'ENOTFOUND') {
      console.error(
        '\nTip: Use the Supabase Session pooler host (IPv4), not db.xxx.supabase.co.\n' +
          'Copy it from Supabase → Connect → Session pooler.'
      );
    }
    if (error.code === '28P01') {
      console.error(
        '\nTip: Wrong database password. Reset it in Supabase → Settings → Database,\n' +
          'then update DATABASE_PASSWORD in server/.env and run migrate again.'
      );
    }

    process.exit(1);
  });
