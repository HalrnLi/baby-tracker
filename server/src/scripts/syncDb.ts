import { syncDatabase } from '../config/database';

syncDatabase(false, true)
  .then(() => {
    console.log('Database schema synced with alter.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to sync database:', err);
    process.exit(1);
  });
