import { loginOnTwitter } from './helpers';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await loginOnTwitter(await browser.newPage());
  const content = JSON.stringify(await page.cookies());

  await fs.promises.writeFile('./cookies.json', content);

  process.exit(0);
})();
