import { maybeLoginOnTwitter } from './helpers';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await maybeLoginOnTwitter(await browser.newPage());
  const content = JSON.stringify(await page.cookies());

  console.log(path.resolve(__dirname, '../cookies.json'));
  await fs.promises.writeFile(
    path.resolve(__dirname, '../cookies.json'),
    content
  );

  process.exit(0);
})();
