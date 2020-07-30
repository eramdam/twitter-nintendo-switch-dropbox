import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import _ from 'lodash';
import m3u8 from 'm3u8';
import { Duplex } from 'stream';
import { bufferToStream, downloadUrl } from './helpers';

const baseTwitterVideoDomain = 'https://video.twimg.com';

interface AttributeList {
  bandwidth: number;
  resolution: [number, number];
  codecs: string;
}

interface Item {
  attributes: {
    attributes: AttributeList;
  };
  properties: {
    byteRange: null;
    daiPlacementOpportunity: null;
    date: null;
    discontinuity: null;
    duration: number;
    title: string;
    uri: string;
  };
}

interface M3u8 {
  items: {
    PlaylistItem: Item[];
    StreamItem: Item[];
    IframeStreamItem: Item[];
    MediaItem: Item[];
  };
  properties: {
    indenpendentSegments: boolean;
  };
}

async function parseM3u8File(file: Buffer) {
  const parser = m3u8.createStream();
  const fileStream = bufferToStream(file);

  return new Promise<M3u8>((resolve) => {
    fileStream.pipe(parser);
    parser.on('m3u', resolve);
  });
}

async function encodeMp4File(inputFile: Duplex) {
  return new Promise<Buffer>((resolve, reject) => {
    // Output as mp4 file.
    ffmpeg(inputFile)
      // make sure aac is enabled.
      .outputOptions('-strict -2')
      .output('/tmp/final.mp4')
      .on('progress', console.log)
      .on('error', reject)
      .on('end', () => {
        const fileBuffer = fs.readFileSync('/tmp/final.mp4');

        resolve(fileBuffer);
      })
      .run();
  });
}

async function downloadAndParseM3u8(url: string) {
  return await parseM3u8File(await downloadUrl(url));
}

export async function downloadTwitterVideo(
  m3u8Url: string
): Promise<Buffer | undefined> {
  console.log('Downloading ', m3u8Url);
  // Grab the entry m3u8 file
  const parsedEntrypointFile = await downloadAndParseM3u8(m3u8Url);
  // Find the best quality
  const bestStream = _(parsedEntrypointFile.items.StreamItem)
    .filter((stream) => stream.attributes.attributes.resolution[0] >= 1280)
    .sort((stream) => -stream.attributes.attributes.bandwidth)
    .first();

  if (!bestStream) {
    return undefined;
  }

  // Parse the playlist with the best quality
  const { uri } = bestStream.properties;
  const parsedPlaylist = await downloadAndParseM3u8(
    baseTwitterVideoDomain + uri
  );
  console.log('Parsed playlist');
  // Download the files as buffers
  const partsUrisPromises = _(parsedPlaylist.items.PlaylistItem)
    .map((item) => item.properties.uri)
    .compact()
    .map((uri) => downloadUrl(baseTwitterVideoDomain + uri))
    .value();
  console.log('Downloaded all parts');
  const partsBuffers = await Promise.all(partsUrisPromises);

  // Combine everything in one buffer, then a stream we can give to ffmpeg
  const combinedBuffer = Buffer.concat(partsBuffers);
  const combinedStream = bufferToStream(combinedBuffer);
  console.log('Encoding as mp4 file');
  const finalBuffer = await encodeMp4File(combinedStream);

  return finalBuffer;
}
