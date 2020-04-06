const cron = require('node-cron');
const { exec } = require('child_process');

cron.schedule('* * * * *', () => {
  exec(
    'npm run start',
    {
      cwd: __dirname,
    },
    console.log
  );
});
