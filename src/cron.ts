import cron from 'node-cron';
import { grabMedia } from './grabMedia';

(async () => {
  console.log('Gonna grab tweets media', new Date());
  await grabMedia();

  cron.schedule('* * * * *', async () => {
    console.log('Gonna grab tweets media', new Date());
    await grabMedia();
  });
})();
