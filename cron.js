const cron = require('node-cron');
const execa = require('execa');

cron.schedule('* * * * *', async () => {
  const { stderr, stdout } = await execa('npm', ['start']);
  console.error(stderr);
  console.log(new Date(), stdout);
});
