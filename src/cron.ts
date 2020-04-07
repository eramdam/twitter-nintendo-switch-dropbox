import cron from 'node-cron';
import { grabMedia } from './grabMedia';

(async () => {
  await grabMedia();

  cron.schedule('* * * * *', async () => {
    await grabMedia();
  });
})();
