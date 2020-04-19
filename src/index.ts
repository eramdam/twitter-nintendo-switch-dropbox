import express from 'express';
import dotenv from 'dotenv';
import { grabMedia } from './grabMedia';
import { AddressInfo } from 'net';

dotenv.config();

const app = express();

app.all('/' + process.env.SCRIPT_ENDPOINT, async (_req, res) => {
  await grabMedia();

  return res.sendStatus(200);
});

// The `PORT` variable is set on glitch.com
const listener = app.listen(process.env.PORT || 3000, () => {
  const info = listener.address() as AddressInfo;
  console.log(`Running server on http://localhost:${info.port}`);
});
