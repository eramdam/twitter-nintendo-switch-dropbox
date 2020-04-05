import { Dropbox } from 'dropbox';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export async function uploadFileToDropbox(
  filepath: string,
  dropboxFolder = '/'
) {
  const client = new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    fetch: require('isomorphic-fetch'),
  });

  const fileContents = fs.readFileSync(filepath);
  const basename = path.basename(filepath);
  console.log('uploading', basename);

  return client
    .filesUpload({
      path: `${dropboxFolder}/${basename}`,
      contents: fileContents,
    })
    .then(() => {
      console.log('uploaded', basename);
    })
    .catch(console.error);
}
